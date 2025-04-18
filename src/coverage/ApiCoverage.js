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
     * @param {boolean} [options.debug=false] - Включить отладочный режим
     * @param {string} [options.outputDir='coverage'] - Директория для сохранения отчетов
     * @param {string} [options.logLevel='info'] - Уровень логирования
     * @param {string} [options.logFile='coverage.log'] - Файл для сохранения логов
     * @param {boolean} [options.generateHtmlReport=false] - Включить генерацию HTML отчета
     */
    constructor(options = {}) {
        this.collector = new RequestCollector(options);
        this.reportGenerator = new ReportGenerator(options);
        this.swaggerSpec = options.swaggerSpec;
        this.ignoreConfig = options.ignoreConfig || {};
        this.options = {
            swaggerPath: options.swaggerPath,
            baseUrl: options.baseUrl,
            debug: options.debug || false,
            outputDir: options.outputDir || 'coverage',
            logLevel: options.logLevel || 'info',
            logFile: options.logFile || 'coverage.log',
            generateHtmlReport: options.generateHtmlReport || false
        };
        
        this.endpoints = {};
        this.requests = [];
        this.isInitialized = false;
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
            await this.collector.stop();
            this.isInitialized = false;
            this._log('info', 'API coverage stopped');
        } catch (error) {
            this._log('error', `Failed to stop API coverage: ${error.message}`);
            throw error;
        }
    }

    /**
     * Загружает Swagger спецификацию:
     * - Проверяет доступность URL или файла
     * - Загружает содержимое
     * - Парсит JSON или YAML
     * @private
     * @throws {Error} Если не удалось загрузить или распарсить спецификацию
     */
    async _loadSwaggerSpec() {
        const { swaggerPath } = this.options;
        
        if (!swaggerPath) {
            throw new Error('Swagger path is not specified');
        }

        try {
            let content;
            if (swaggerPath.startsWith('http')) {
                const response = await fetch(swaggerPath);
                if (!response.ok) {
                    throw new Error(`Failed to load Swagger spec: ${response.statusText}`);
                }
                content = await response.text();
            } else {
                content = await fs.readFile(swaggerPath, 'utf8');
            }

            const spec = swaggerPath.endsWith('.yaml') || swaggerPath.endsWith('.yml')
                ? yaml.load(content)
                : JSON.parse(content);

            this.swaggerSpec = spec;
            this._processSwaggerSpec(spec);
            this._log('info', 'Swagger spec loaded successfully');
        } catch (error) {
            this._log('error', `Failed to load Swagger spec: ${error.message}`);
            throw error;
        }
    }

    /**
     * Обрабатывает Swagger спецификацию:
     * - Извлекает пути и методы
     * - Нормализует пути
     * - Создает структуру для отслеживания
     * @private
     * @param {Object} spec - Распарсенная Swagger спецификация
     * @throws {Error} Если спецификация не содержит путей
     */
    _processSwaggerSpec(spec) {
        if (!spec.paths) {
            throw new Error('Invalid Swagger spec: missing paths');
        }

        // Обрабатываем каждый путь и метод
        for (const [path, methods] of Object.entries(spec.paths)) {
            for (const [method, details] of Object.entries(methods)) {
                if (method === 'parameters') continue; // Пропускаем общие параметры

                const endpointKey = `${method.toUpperCase()} ${path}`;
                this.endpoints[endpointKey] = {
                    path,
                    method: method.toUpperCase(),
                    summary: details.summary || '',
                    description: details.description || '',
                    tags: details.tags || [],
                    responses: details.responses || {},
                    requests: []
                };
            }
        }

        this._log('debug', `Processed ${Object.keys(this.endpoints).length} endpoints`);
    }

    /**
     * Записывает информацию о выполненном запросе:
     * - Сопоставляет запрос с эндпоинтом
     * - Сохраняет детали запроса
     * - Обновляет статистику покрытия
     * @param {Object} request - Информация о запросе
     * @param {string} request.url - URL запроса
     * @param {string} request.method - HTTP метод
     * @param {Object} [request.headers] - Заголовки запроса
     * @param {Object} [request.body] - Тело запроса
     */
    recordRequest(request) {
        const { method, path, statusCode } = request;
        this.collector.recordRequest({
            method: method.toUpperCase(),
            path,
            statusCode,
            timestamp: new Date().toISOString()
        });
    }

    _calculateCoverage(requests) {
        const endpoints = {};
        
        // Add endpoints from Swagger first
        if (this.swaggerSpec?.paths) {
            Object.entries(this.swaggerSpec.paths).forEach(([path, methods]) => {
                Object.entries(methods).forEach(([method, spec]) => {
                    if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) {
                        const endpointKey = `${method.toUpperCase()} ${path}`;
                        endpoints[endpointKey] = {
                            path,
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
        }

        // Add requests to corresponding endpoints
        requests.forEach(request => {
            const endpointKey = `${request.method} ${request.path}`;
            if (endpoints[endpointKey]) {
                endpoints[endpointKey].requests.push(request);
            }
        });

        // Calculate coverage statistics
        const totalEndpoints = Object.keys(endpoints).length;
        let coveredEndpoints = 0;
        let partialEndpoints = 0;

        Object.values(endpoints).forEach(endpoint => {
            if (endpoint.requests.length === 0) {
                return; // Uncovered endpoint
            }

            const coveredStatusCodes = new Set(endpoint.requests.map(r => r.statusCode));
            const expectedStatusCodes = new Set(endpoint.expectedStatusCodes);

            const coverageRatio = Array.from(coveredStatusCodes).filter(code => expectedStatusCodes.has(code)).length / expectedStatusCodes.size;

            if (coverageRatio === 1) {
                coveredEndpoints++;
            } else if (coverageRatio > 0) {
                partialEndpoints++;
            }
        });

        const coveragePercentage = totalEndpoints > 0 ? ((coveredEndpoints + partialEndpoints * 0.5) / totalEndpoints) * 100 : 0;

        // Group endpoints by service (using tags or path segments)
        const services = {};
        Object.entries(endpoints).forEach(([key, endpoint]) => {
            const serviceName = endpoint.tags?.[0] || endpoint.path.split('/')[1] || 'default';
            if (!services[serviceName]) {
                services[serviceName] = {
                    name: serviceName,
                    endpoints: {}
                };
            }
            services[serviceName].endpoints[key] = endpoint;
        });

        return {
            totalEndpoints,
            coveredEndpoints,
            partialEndpoints,
            percentage: coveragePercentage,
            endpoints: Object.values(endpoints),
            services
        };
    }

    async _saveCoverage(coverage) {
        const { outputDir } = this.options;
        
        try {
            await fs.mkdir(outputDir, { recursive: true });
            const coveragePath = path.join(outputDir, 'coverage.json');
            await fs.writeFile(coveragePath, JSON.stringify(coverage, null, 2));
            this._log('info', `Coverage saved to ${coveragePath}`);
        } catch (error) {
            this._log('error', `Error saving coverage: ${error.message}`);
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
        const requests = this.collector.getRequests();
        const coverage = this._calculateCoverage(requests);
        
        // Save coverage data
        await this._saveCoverage(coverage);
        
        // Generate HTML report
        if (this.options.generateHtmlReport) {
            await this._generateHtmlReport(coverage);
        }
        
        return coverage;
    }
} 