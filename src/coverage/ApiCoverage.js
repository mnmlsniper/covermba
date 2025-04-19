import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import ejs from 'ejs';
import { RequestCollector } from './RequestCollector.js';
import { ReportGenerator } from './ReportGenerator.js';
import { isPartiallyCovered, getStatusCodeClass, formatParameter, formatResponse, formatRequest } from './utils/coverageUtils.js';
import Handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Класс для отслеживания покрытия API тестами на основе Swagger спецификации.
 * Предоставляет функционал для:
 * - Загрузки и парсинга Swagger спецификации
 * - Отслеживания HTTP запросов
 * - Генерации отчетов о покрытии
 */
export class ApiCoverage {
    /**
     * Создает экземпляр ApiCoverage
     * @param {Object} options - Настройки библиотеки
     * @param {string} options.swaggerPath - Путь к Swagger спецификации (URL или путь к файлу)
     * @param {string} options.baseUrl - Базовый URL API
     * @param {string} [options.basePath] - Базовый путь API (если не указан, будет извлечен из Swagger)
     * @param {boolean} [options.debug=false] - Включить отладочный режим
     * @param {string} [options.outputDir='coverage'] - Директория для сохранения отчетов
     * @param {string} [options.logLevel='info'] - Уровень логирования
     * @param {string} [options.logFile='coverage.log'] - Файл для сохранения логов
     * @param {boolean} [options.generateHtmlReport=false] - Включить генерацию HTML отчета
     */
    constructor(options = {}) {
        this.reportGenerator = new ReportGenerator(options);
        this.swaggerSpec = options.swaggerSpec;
        this.ignoreConfig = options.ignoreConfig || {};
        this.options = {
            swaggerPath: options.swaggerPath,
            baseUrl: options.baseUrl,
            basePath: options.basePath,
            debug: options.debug || false,
            outputDir: options.outputDir || 'coverage',
            logLevel: options.logLevel || 'info',
            logFile: options.logFile || 'coverage.log',
            generateHtmlReport: options.generateHtmlReport || false
        };
        
        this.endpoints = new Map();
        this.requests = [];
        this.isInitialized = false;
        
        // Initialize collector after setting up options
        this.collector = new RequestCollector(this, this.options);

        this.templatePath = path.join(__dirname, 'templates', 'coverage.html');
        this.assetsPath = path.join(__dirname, 'templates', 'assets');
        this.outputPath = this.options.outputDir;
        this.setupHandlebars();
    }

    setupHandlebars() {
        Handlebars.registerHelper('json', function(context) {
            return JSON.stringify(context, null, 2);
        });
        
        Handlebars.registerHelper('floor', function(num, precision) {
            return Math.floor(num / precision) * precision;
        });

        Handlebars.registerHelper('formatNumber', function(num, decimals) {
            return Number(num).toFixed(decimals);
        });

        Handlebars.registerHelper('eq', function(a, b) {
            return a === b;
        });

        Handlebars.registerHelper('isStatusCodeCovered', function(requests, statusCode) {
            return requests && requests.some(req => req.statusCode === statusCode);
        });

        Handlebars.registerHelper('lookup', function(obj, key, prop) {
            if (!obj || !obj[key]) return '';
            return obj[key][prop] || '';
        });
    }

    /**
     * Загружает и парсит Swagger спецификацию
     * @private
     * @throws {Error} Если не удалось загрузить или распарсить спецификацию
     */
    async _loadSwaggerSpec() {
        const { swaggerPath } = this.options;
        
        try {
            let content;
            if (swaggerPath.startsWith('http')) {
                const response = await fetch(swaggerPath);
                content = await response.text();
            } else {
                content = await fs.readFile(swaggerPath, 'utf8');
            }

            this.swaggerSpec = swaggerPath.endsWith('.yaml') || swaggerPath.endsWith('.yml')
                ? yaml.load(content)
                : JSON.parse(content);

            // Извлекаем basePath из Swagger спецификации, если не указан в опциях
            if (!this.options.basePath && this.swaggerSpec.basePath) {
                this.options.basePath = this.swaggerSpec.basePath;
                this._log('debug', `Extracted basePath from Swagger: ${this.options.basePath}`);
            }

            this._log('info', `Loaded Swagger spec from ${swaggerPath}`);
        } catch (error) {
            this._log('error', `Error loading Swagger spec: ${error.message}`);
            throw error;
        }
    }

    /**
     * Инициализирует библиотеку:
     * - Загружает Swagger спецификацию
     * - Парсит эндпоинты
     * - Подготавливает структуру для отслеживания
     * @throws {Error} Если не удалось загрузить или обработать Swagger спецификацию
     */
    async start() {
        if (this.isInitialized) {
            return;
        }

        try {
            await this._loadSwaggerSpec();
            this._processSwaggerSpec(this.swaggerSpec);
            await this.collector.start();
            this.isInitialized = true;
            this._log('info', 'API coverage started');
        } catch (error) {
            this._log('error', `Failed to start API coverage: ${error.message}`);
            throw error;
        }
    }

    /**
     * Останавливает работу библиотеки:
     * - Сохраняет результаты покрытия
     * - Генерирует HTML отчет
     * @throws {Error} Если не удалось сохранить результаты или сгенерировать отчет
     */
    async stop() {
        if (!this.isInitialized) {
            this._log('warn', 'API coverage not initialized, skipping stop');
            return;
        }

        try {
            this._log('debug', 'Starting stop process');
            this._log('debug', `generateHtmlReport option: ${this.options.generateHtmlReport}`);
            
            // Генерируем отчет перед остановкой
            if (this.options.generateHtmlReport) {
                this._log('debug', 'Generating HTML report');
                const coverage = this._calculateCoverage();
                this._log('debug', `Calculated coverage: ${JSON.stringify(coverage)}`);
                await this._saveCoverage(coverage);
                await this._generateHtmlReport(coverage);
            } else {
                this._log('debug', 'HTML report generation is disabled');
            }
            
            this._log('debug', 'Stopping collector');
            await this.collector.stop();
            this.isInitialized = false;
            this._log('info', 'API coverage stopped');
        } catch (error) {
            this._log('error', `Failed to stop API coverage: ${error.message}`);
            throw error;
        }
    }

    /**
     * Обрабатывает Swagger спецификацию и извлекает эндпоинты
     * @private
     */
    _processSwaggerSpec(spec) {
        const basePath = spec.basePath || '';
        
        for (const [path, pathObj] of Object.entries(spec.paths)) {
            for (const [method, methodObj] of Object.entries(pathObj)) {
                if (method === 'parameters') continue; // Skip path-level parameters
                
                const fullPath = this._normalizePath(basePath + path);
                const endpoint = {
                    method: method.toUpperCase(),
                    path: fullPath,
                    name: `${method.toUpperCase()} ${fullPath}`, // Add explicit name field
                    description: methodObj.summary || methodObj.description || '',
                    expectedStatusCodes: this._getExpectedStatusCodes(methodObj),
                    parameters: methodObj.parameters || [],
                    responses: methodObj.responses || {},
                    requests: [],
                    isCovered: false,
                    isPartiallyCovered: false,
                    coverageStatus: 'not-covered'
                };
                
                const key = endpoint.name; // Use the explicit name as key
                this.endpoints.set(key, endpoint);
                console.log(`Processed endpoint: ${key}`);
            }
        }
    }

    /**
     * Нормализует путь API, удаляя лишние слэши и приводя к единому формату
     * @private
     * @param {string} path - Путь для нормализации
     * @returns {string} Нормализованный путь
     */
    _normalizePath(path) {
        // Remove trailing slash if present
        return path.endsWith('/') ? path.slice(0, -1) : path;
    }

    /**
     * Извлекает ожидаемые статус коды из спецификации метода
     * @private
     * @param {Object} methodObj - Объект метода из Swagger спецификации
     * @returns {Array<Object>} Массив объектов с кодами и описаниями
     */
    _getExpectedStatusCodes(methodObj) {
        const statusCodes = [];
        if (methodObj.responses) {
            for (const [code, response] of Object.entries(methodObj.responses)) {
                if (code !== 'default') {
                    statusCodes.push({
                        code: parseInt(code, 10),
                        description: response.description || ''
                    });
                }
            }
        }
        return statusCodes.sort((a, b) => a.code - b.code);
    }

    /**
     * Записывает информацию о выполненном запросе.
     * УСТАРЕЛО: Используйте collector.collect() вместо этого метода.
     * @deprecated Используйте collector.collect() для автоматического сбора запросов
     * @param {Object} request - Информация о запросе
     * @param {string} request.method - HTTP метод
     * @param {string} request.path - Путь запроса
     * @param {number} request.status - HTTP статус ответа
     * @param {Object} [request.requestBody] - Тело запроса
     * @param {Object} [request.responseBody] - Тело ответа
     */
    recordRequest(request) {
        this._log('debug', `Recording request: ${JSON.stringify(request)}`);
        
        const { method, path, status, statusCode, requestBody, responseBody } = request;
        const basePath = this.options.basePath || '';
        const normalizedPath = this._normalizePath(path.startsWith(basePath) ? path : basePath + path);
        const key = `${method.toUpperCase()} ${normalizedPath}`;
        
        this._log('debug', `Normalized request key: ${key}`);
        this._log('debug', `Available endpoint keys: ${Array.from(this.endpoints.keys()).join(', ')}`);
        
        // Find matching endpoint
        const endpoint = this.endpoints.get(key);
        if (endpoint) {
            this._log('debug', `Found matching endpoint: ${key}`);
            const requestData = {
                method,
                path: normalizedPath,
                status: status || statusCode,
                requestBody,
                responseBody,
                timestamp: new Date().toISOString()
            };
            endpoint.requests.push(requestData);
            this._updateEndpointCoverage(endpoint);
        } else {
            this._log('debug', `No matching endpoint found for: ${key}`);
        }
    }

    /**
     * Обновляет информацию о покрытии эндпоинта
     * @private
     * @param {Object} endpoint - Объект эндпоинта
     * @returns {Object} Обновленная информация о покрытии
     */
    _updateEndpointCoverage(endpoint) {
        const coveredStatusCodes = new Set(endpoint.requests.map(r => r.status || r.statusCode));
        const expectedStatusCodes = new Set(endpoint.expectedStatusCodes.map(s => s.code));
        
        const coveredCount = Array.from(coveredStatusCodes).filter(code => 
            expectedStatusCodes.has(code)).length;
            
        if (coveredCount === expectedStatusCodes.size) {
            endpoint.isCovered = true;
            endpoint.isPartiallyCovered = false;
            endpoint.coverageStatus = 'covered';
        } else if (coveredCount > 0) {
            endpoint.isCovered = false;
            endpoint.isPartiallyCovered = true;
            endpoint.coverageStatus = 'partially-covered';
        } else {
            endpoint.isCovered = false;
            endpoint.isPartiallyCovered = false;
            endpoint.coverageStatus = 'not-covered';
        }

        this._log('debug', `Updated endpoint coverage:
            Path: ${endpoint.path}
            Expected status codes: ${Array.from(expectedStatusCodes).join(', ')}
            Covered status codes: ${Array.from(coveredStatusCodes).join(', ')}
            Coverage status: ${endpoint.coverageStatus}
        `);
    }

    _calculateCoverage() {
        const endpointsList = Array.from(this.endpoints.values());
        const totalEndpoints = endpointsList.length;
        const coveredEndpoints = endpointsList.filter(e => e.coverageStatus === 'covered').length;
        const partiallyCoveredEndpoints = endpointsList.filter(e => e.coverageStatus === 'partially-covered').length;
        const missingEndpoints = endpointsList.filter(e => e.coverageStatus === 'not-covered').length;
        
        // Group endpoints by service (based on first path segment)
        const services = new Map();
        for (const [key, endpoint] of this.endpoints) {
            const serviceName = endpoint.path.split('/')[1] || 'default';
            if (!services.has(serviceName)) {
                services.set(serviceName, {
                    name: serviceName,
                    endpoints: {}
                });
            }
            services.get(serviceName).endpoints[key] = endpoint;
        }

        const percentage = totalEndpoints === 0 ? 0 : 
            ((coveredEndpoints + (partiallyCoveredEndpoints * 0.5)) / totalEndpoints) * 100;

        this._log('debug', `Coverage calculation:
            Total endpoints: ${totalEndpoints}
            Covered endpoints: ${coveredEndpoints}
            Partially covered endpoints: ${partiallyCoveredEndpoints}
            Missing endpoints: ${missingEndpoints}
            Coverage percentage: ${percentage}%`);
        
        return {
            totalEndpoints,
            coveredEndpoints,
            partiallyCoveredEndpoints,
            missingEndpoints,
            percentage,
            services: Array.from(services.values())
        };
    }

    async _saveCoverage(coverage) {
        const outputDir = this.options.outputDir;
        const coveragePath = path.join(outputDir, 'coverage.json');
        
        try {
            // Создаем директорию, если она не существует
            await fs.mkdir(outputDir, { recursive: true });
            this._log('info', `Created directory: ${outputDir}`);
            
            // Сохраняем данные о покрытии
            await fs.writeFile(coveragePath, JSON.stringify(coverage, null, 2));
            this._log('info', `Saved coverage data to: ${coveragePath}`);
        } catch (error) {
            this._log('error', `Failed to save coverage data: ${error.message}`);
            throw error;
        }
    }

    /**
     * Генерирует HTML отчет о покрытии:
     * - Загружает шаблон
     * - Рендерит отчет с данными
     * - Сохраняет HTML файл
     * @private
     * @throws {Error} Если не удалось сгенерировать отчет
     */
    async _generateHtmlReport(coverage) {
        if (!this.options.generateHtmlReport) {
            return;
        }

        const outputDir = this.options.outputDir;
        const templatePath = path.join(__dirname, 'templates', 'report.ejs');
        
        try {
            // Логируем структуру данных для отладки
            this._log('debug', 'Coverage data structure:');
            this._log('debug', JSON.stringify(coverage, null, 2));

            const template = await fs.readFile(templatePath, 'utf8');
            const html = ejs.render(template, {
                coverage,
                services: coverage.services,
                isPartiallyCovered,
                getStatusCodeClass,
                formatParameter,
                formatResponse,
                formatRequest
            });
            
            const reportPath = path.join(outputDir, 'coverage.html');
            await fs.writeFile(reportPath, html);
            
            this._log('info', `HTML report generated at: ${reportPath}`);
        } catch (error) {
            this._log('error', `Error generating HTML report: ${error.message}`);
            throw error;
        }
    }

    /**
     * Логирует сообщение:
     * - В консоль если включен debug режим
     * - В файл если указан logFile
     * @private
     * @param {string} level - Уровень логирования
     * @param {string} message - Сообщение для логирования
     */
    async _log(level, message) {
        const { debug, logLevel, logFile } = this.options;
        
        if (debug || level === 'error') {
            console.log(`[${level.toUpperCase()}] ${message}`);
        }

        if (logFile) {
            try {
                const logDir = path.dirname(logFile);
                await fs.mkdir(logDir, { recursive: true });
                const logMessage = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`;
                await fs.appendFile(logFile, logMessage);
            } catch (error) {
                console.error(`Error writing to log file: ${error.message}`);
            }
        }
    }

    /**
     * Генерирует отчет о покрытии API
     * Создает HTML и JSON отчеты в указанной директории
     * @public
     * @async
     * @returns {Promise<Object>} Объект с информацией о покрытии
     * @throws {Error} Если не удалось сгенерировать отчет
     */
    async generateReport() {
        const coverage = this._calculateCoverage();
        
        // Ensure output directory exists
        await fs.mkdir(this.outputPath, { recursive: true });
        
        // Copy assets
        const assetsOutputPath = path.join(this.outputPath, 'assets');
        await fs.mkdir(assetsOutputPath, { recursive: true });
        await fs.mkdir(path.join(assetsOutputPath, 'css'), { recursive: true });
        await fs.mkdir(path.join(assetsOutputPath, 'js'), { recursive: true });
        
        // Copy Bootstrap files
        await fs.copyFile(
            path.join(this.assetsPath, 'css', 'bootstrap.min.css'),
            path.join(assetsOutputPath, 'css', 'bootstrap.min.css')
        );
        await fs.copyFile(
            path.join(this.assetsPath, 'js', 'bootstrap.bundle.min.js'),
            path.join(assetsOutputPath, 'js', 'bootstrap.bundle.min.js')
        );
        
        // Generate HTML report using EJS
        const template = await fs.readFile(path.join(__dirname, 'templates', 'report.ejs'), 'utf8');
        const html = ejs.render(template, {
            coverage,
            services: coverage.services,
            isPartiallyCovered,
            getStatusCodeClass,
            formatParameter,
            formatResponse,
            formatRequest
        });
        
        await fs.writeFile(path.join(this.outputPath, 'coverage.html'), html);
        await fs.writeFile(
            path.join(this.outputPath, 'coverage.json'), 
            JSON.stringify(coverage, null, 2)
        );
        
        console.log(`Coverage report generated in ${this.outputPath}`);
        return coverage;
    }
} 