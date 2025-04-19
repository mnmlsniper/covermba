import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import ejs from 'ejs';
import { RequestCollector } from './RequestCollector.js';
import { ReportGenerator } from './ReportGenerator.js';

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
        
        this.endpoints = {};
        this.requests = [];
        this.isInitialized = false;
        
        // Initialize collector after setting up options
        this.collector = new RequestCollector(this, this.options);
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
            this._processSwaggerSpec();
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
            return;
        }

        try {
            // Генерируем отчет перед остановкой
            if (this.options.generateHtmlReport) {
                const coverage = this._calculateCoverage();
                await this._saveCoverage(coverage);
                await this._generateHtmlReport(coverage);
            }
            
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
    _processSwaggerSpec() {
        if (!this.swaggerSpec?.paths) {
            this._log('warn', 'No paths found in Swagger spec');
            return;
        }

        Object.entries(this.swaggerSpec.paths).forEach(([endpointPath, methods]) => {
            Object.entries(methods).forEach(([method, spec]) => {
                if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) {
                    // Normalize path
                    let normalizedPath = endpointPath;
                    if (!normalizedPath.startsWith('/')) {
                        normalizedPath = `/${normalizedPath}`;
                    }
                    
                    // Add basePath if not present and if basePath is defined
                    if (this.options.basePath && !normalizedPath.startsWith(this.options.basePath)) {
                        normalizedPath = `${this.options.basePath}${normalizedPath}`;
                    }
                    
                    const endpointKey = `${method.toUpperCase()} ${normalizedPath}`;
                    
                    this._log('debug', `Processing endpoint: ${endpointKey}`);
                    
                    this.endpoints[endpointKey] = {
                        path: normalizedPath,
                        method: method.toUpperCase(),
                        requests: [],
                        summary: spec.summary,
                        description: spec.description,
                        tags: spec.tags,
                        responses: spec.responses,
                        expectedStatusCodes: Object.keys(spec.responses).map(code => parseInt(code, 10))
                    };
                }
            });
        });

        this._log('debug', `Processed ${Object.keys(this.endpoints).length} endpoints`);
        this._log('debug', `Available endpoints: ${Object.keys(this.endpoints).join(', ')}`);
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
        
        // Normalize path
        let normalizedPath = request.path;
        if (!normalizedPath.startsWith('/')) {
            normalizedPath = `/${normalizedPath}`;
        }
        
        // Add basePath if not present
        if (this.options.basePath && !normalizedPath.startsWith(this.options.basePath)) {
            normalizedPath = `${this.options.basePath}${normalizedPath}`;
        }
        
        const requestKey = `${request.method} ${normalizedPath}`;
        
        this._log('debug', `Normalized request key: ${requestKey}`);
        this._log('debug', `Available endpoint keys: ${Object.keys(this.endpoints).join(', ')}`);
        
        // Find matching endpoint
        const endpoint = this.endpoints[requestKey];
        if (endpoint) {
            this._log('debug', `Found matching endpoint: ${requestKey}`);
            endpoint.requests.push(request);
        } else {
            this._log('debug', `No matching endpoint found for: ${requestKey}`);
        }
    }

    _calculateCoverage() {
        const endpoints = Object.values(this.endpoints).map(endpoint => {
            const isCovered = endpoint.requests.length > 0;
            const isPartiallyCovered = isCovered && endpoint.requests.some(request => 
                endpoint.expectedStatusCodes.includes(request.status)
            );
            
            return {
                ...endpoint,
                isCovered,
                isPartiallyCovered
            };
        });
        
        const totalEndpoints = endpoints.length;
        const coveredEndpoints = endpoints.filter(e => e.isCovered).length;
        const partiallyCoveredEndpoints = endpoints.filter(e => e.isPartiallyCovered).length;
        const percentage = totalEndpoints > 0 ? (coveredEndpoints / totalEndpoints) * 100 : 0;
        
        // Группируем эндпоинты по сервисам
        const services = {};
        endpoints.forEach(endpoint => {
            const serviceName = endpoint.tags?.[0] || 'api';
            if (!services[serviceName]) {
                services[serviceName] = {
                    name: serviceName,
                    endpoints: {}
                };
            }
            const key = `${endpoint.method} ${endpoint.path}`;
            services[serviceName].endpoints[key] = endpoint;
        });
        
        this._log('debug', `Coverage calculation:
            Total endpoints: ${totalEndpoints}
            Covered endpoints: ${coveredEndpoints}
            Partially covered endpoints: ${partiallyCoveredEndpoints}
            Coverage percentage: ${percentage}%`);
        
        return {
            endpoints,
            services,
            totalEndpoints,
            coveredEndpoints,
            partiallyCoveredEndpoints,
            percentage
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
        const templatePath = new URL('./templates/report.ejs', import.meta.url).pathname;
        
        try {
            // Логируем структуру данных для отладки
            this._log('debug', 'Coverage data structure:');
            this._log('debug', JSON.stringify(coverage, null, 2));

            const template = await fs.readFile(templatePath, 'utf8');
            const html = ejs.render(template, { 
                coverage,
                timestamp: new Date().toISOString(),
                totalEndpoints: coverage.totalEndpoints,
                coveredEndpoints: coverage.coveredEndpoints,
                partialEndpoints: coverage.partialEndpoints,
                missingEndpoints: coverage.totalEndpoints - coverage.coveredEndpoints - coverage.partialEndpoints,
                services: coverage.services,
                isPartiallyCovered: (endpoint) => {
                    if (!endpoint.requests || endpoint.requests.length === 0) {
                        return false;
                    }
                    const coveredStatusCodes = new Set(endpoint.requests.map(r => r.statusCode));
                    const expectedStatusCodes = new Set(endpoint.expectedStatusCodes);
                    const coverageRatio = Array.from(coveredStatusCodes).filter(code => expectedStatusCodes.has(code)).length / expectedStatusCodes.size;
                    return coverageRatio > 0 && coverageRatio < 1;
                },
                getProgressBarColor: (percentage) => {
                    if (percentage >= 80) return '#28a745';
                    if (percentage >= 50) return '#ffc107';
                    return '#dc3545';
                }
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

    async generateReport() {
        if (!this.isInitialized) {
            throw new Error('API coverage not initialized. Call start() first.');
        }

        // Рассчитываем покрытие
        const coverage = this._calculateCoverage();
        
        // Сохраняем отчет
        await this._saveCoverage(coverage);
        
        // Генерируем HTML отчет, если включено
        if (this.options.generateHtmlReport) {
            await this._generateHtmlReport(coverage);
        }
        
        this._log('debug', `Generated coverage report: ${JSON.stringify(coverage, null, 2)}`);
        
        return coverage;
    }
} 