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
        
        // Используем относительный путь от корня проекта
        this.options = {
            swaggerPath: options.swaggerPath,
            baseUrl: options.baseUrl,
            basePath: options.basePath,
            debug: true,
            outputDir: 'coverage/apichallenges',
            logLevel: options.logLevel || 'info',
            logFile: options.logFile || 'coverage.log',
            generateHtmlReport: options.generateHtmlReport || false
        };
        
        this.endpoints = new Map();
        this.requests = [];
        this.isInitialized = false;
        
        this.collector = new RequestCollector(this, this.options);

        this.templatePath = path.join(__dirname, 'templates', 'report.ejs');
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

            const spec = swaggerPath.endsWith('.yaml') || swaggerPath.endsWith('.yml')
                ? yaml.load(content)
                : JSON.parse(content);

            return spec;
        } catch (error) {
            if (this.options.debug) {
                console.error('Failed to load Swagger spec:', error);
            }
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
        if (!this.swaggerSpec) {
            this.swaggerSpec = await this._loadSwaggerSpec();
        }
        
        if (!this.swaggerSpec) {
            throw new Error('Failed to load Swagger specification');
        }

        this._processSwaggerSpec(this.swaggerSpec);
        this.isInitialized = true;
    }

    /**
     * Останавливает работу библиотеки:
     * - Сохраняет результаты покрытия
     * - Генерирует HTML отчет
     * @throws {Error} Если не удалось сохранить результаты или сгенерировать отчет
     */
    async stop() {
        if (this.options.generateHtmlReport) {
            await this._generateHtmlReport();
        }
        
        // Сохраняем requests.json
        const requestsPath = path.join(this.outputPath, 'requests.json');
        await fs.writeFile(requestsPath, JSON.stringify(this.collector.getRequests(), null, 2));
        
        await this._generateJsonReport();
        await this.collector.stop();
    }

    /**
     * Обрабатывает Swagger спецификацию и извлекает эндпоинты
     * @private
     */
    _processSwaggerSpec(spec) {
        if (!spec) return;

        const basePath = spec.basePath || '';
        
        if (!spec.paths) return;

        for (const [path, pathObj] of Object.entries(spec.paths)) {
            for (const [method, methodObj] of Object.entries(pathObj)) {
                if (method === 'parameters') continue;
                
                const fullPath = this._normalizePath(basePath + path);
                const endpoint = {
                    method: method.toUpperCase(),
                    path: fullPath,
                    name: `${method.toUpperCase()} ${fullPath}`,
                    description: methodObj.summary || methodObj.description || '',
                    expectedStatusCodes: this._getExpectedStatusCodes(methodObj),
                    parameters: methodObj.parameters || [],
                    responses: methodObj.responses || {},
                    requests: [],
                    isCovered: false,
                    isPartiallyCovered: false,
                    coverageStatus: 'not-covered'
                };
                
                const key = endpoint.name;
                this.endpoints.set(key, endpoint);
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
        path = path.endsWith('/') ? path.slice(0, -1) : path;
        path = path.startsWith('/') ? path : '/' + path;
        return path;
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
        const { method, path, status, statusCode, requestBody, responseBody } = request;
        const normalizedPath = this._normalizePath(path);
        
        // Формируем ключ для поиска эндпоинта
        const key = `${method.toUpperCase()} ${normalizedPath}`;
        
        if (this.options.debug) {
            console.log('ApiCoverage received request:', {
                method,
                path,
                normalizedPath,
                key,
                status: status || statusCode,
                requestBody,
                responseBody
            });
            console.log('Available endpoints:', Array.from(this.endpoints.keys()));
        }
        
        // Ищем эндпоинт по ключу
        let endpoint = this.endpoints.get(key);
        
        // Если не нашли, пробуем найти по пути без учета метода
        if (!endpoint) {
            for (const [endpointKey, endpointValue] of this.endpoints) {
                if (endpointValue.path === normalizedPath) {
                    endpoint = endpointValue;
                    break;
                }
            }
        }
        
        if (endpoint) {
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
            
            if (this.options.debug) {
                console.log('Request recorded for endpoint:', endpoint.name);
            }
        } else if (this.options.debug) {
            console.log('No matching endpoint found for request');
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
    }

    _calculateCoverage() {
        const endpointsList = Array.from(this.endpoints.values());
        const totalEndpoints = endpointsList.length;
        const coveredEndpoints = endpointsList.filter(e => e.coverageStatus === 'covered').length;
        const partiallyCoveredEndpoints = endpointsList.filter(e => e.coverageStatus === 'partially-covered').length;
        const missingEndpoints = endpointsList.filter(e => e.coverageStatus === 'not-covered').length;
        
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
            await fs.mkdir(outputDir, { recursive: true });
            await fs.writeFile(coveragePath, JSON.stringify(coverage, null, 2));
        } catch (error) {
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
    async _generateHtmlReport() {
        try {
            const coverage = this._calculateCoverage();
            const template = await fs.readFile(this.templatePath, 'utf8');
            const html = ejs.render(template, { coverage });
            
            await fs.mkdir(this.outputPath, { recursive: true });
            
            const reportPath = path.join(this.outputPath, 'coverage.html');
            await fs.writeFile(reportPath, html);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Логирует сообщение:
     * - В файл если указан logFile
     * @private
     * @param {string} level - Уровень логирования
     * @param {string} message - Сообщение для логирования
     */
    async _log(level, message) {
        const { logFile } = this.options;
        
        if (logFile) {
            try {
                const logDir = path.dirname(logFile);
                await fs.mkdir(logDir, { recursive: true });
                const logMessage = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`;
                await fs.appendFile(logFile, logMessage);
            } catch (error) {
                throw error;
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
        
        // Добавляем запросы в данные покрытия
        coverage.requests = this.collector.getRequests();
        
        await fs.mkdir(this.outputPath, { recursive: true });
        
        const assetsOutputPath = path.join(this.outputPath, 'assets');
        await fs.mkdir(assetsOutputPath, { recursive: true });
        await fs.mkdir(path.join(assetsOutputPath, 'css'), { recursive: true });
        await fs.mkdir(path.join(assetsOutputPath, 'js'), { recursive: true });
        
        await fs.copyFile(
            path.join(this.assetsPath, 'css', 'bootstrap.min.css'),
            path.join(assetsOutputPath, 'css', 'bootstrap.min.css')
        );
        await fs.copyFile(
            path.join(this.assetsPath, 'js', 'bootstrap.bundle.min.js'),
            path.join(assetsOutputPath, 'js', 'bootstrap.bundle.min.js')
        );
        
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
        
        // Сохраняем requests.json
        await fs.writeFile(
            path.join(this.outputPath, 'requests.json'),
            JSON.stringify(this.collector.getRequests(), null, 2)
        );
        
        return coverage;
    }

    async _generateJsonReport() {
        try {
            const coverage = this._calculateCoverage();
            await fs.mkdir(this.outputPath, { recursive: true });
            
            const reportPath = path.join(this.outputPath, 'coverage.json');
            await fs.writeFile(reportPath, JSON.stringify(coverage, null, 2));
        } catch (error) {
            throw error;
        }
    }
} 