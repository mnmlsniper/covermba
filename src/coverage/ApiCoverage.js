import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import ejs from 'ejs';

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
     */
    constructor(options = {}) {
        this.options = {
            swaggerPath: options.swaggerPath,
            baseUrl: options.baseUrl,
            debug: options.debug || false,
            outputDir: options.outputDir || 'coverage',
            logLevel: options.logLevel || 'info',
            logFile: options.logFile || 'coverage.log'
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
            const coverage = this._calculateCoverage();
            await this._saveCoverage(coverage);
            await this._generateHtmlReport(coverage);
            this.isInitialized = false;
            this._log('info', 'API coverage stopped');
            return coverage;
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
                content = fs.readFileSync(swaggerPath, 'utf8');
            }

            const spec = swaggerPath.endsWith('.yaml') || swaggerPath.endsWith('.yml')
                ? yaml.load(content)
                : JSON.parse(content);

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
        if (!this.isInitialized) {
            this._log('warn', 'API coverage is not initialized');
            return;
        }

        const { method, path, statusCode, body, headers } = request;
        const endpointKey = `${method.toUpperCase()} ${path}`;

        const requestData = {
            endpointKey,
            statusCode,
            timestamp: new Date().toISOString(),
            body,
            headers
        };

        this.requests.push(requestData);
        
        if (this.endpoints[endpointKey]) {
            this.endpoints[endpointKey].requests.push(requestData);
        }

        this._log('debug', `Recorded request: ${endpointKey} (${statusCode})`);
    }

    _calculateCoverage() {
        const totalEndpoints = Object.keys(this.endpoints).length;
        const coveredEndpoints = Object.values(this.endpoints)
            .filter(endpoint => endpoint.requests.length > 0)
            .length;
        const coveragePercentage = (coveredEndpoints / totalEndpoints) * 100;

        return {
            totalEndpoints,
            coveredEndpoints,
            coveragePercentage,
            endpoints: this.endpoints,
            requests: this.requests
        };
    }

    async _saveCoverage(coverage) {
        const { outputDir } = this.options;
        
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const coveragePath = path.join(outputDir, 'coverage.json');
        fs.writeFileSync(coveragePath, JSON.stringify(coverage, null, 2));
        
        this._log('info', `Coverage saved to ${coveragePath}`);
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
        const outputDir = this.options.outputDir;
        const templatePath = path.join(__dirname, 'templates', 'report.ejs');
        
        try {
            const template = fs.readFileSync(templatePath, 'utf8');
            const html = ejs.render(template, { 
                coverage,
                endpoints: this.endpoints,
                timestamp: new Date().toISOString()
            });
            
            const reportPath = path.join(outputDir, 'coverage.html');
            fs.writeFileSync(reportPath, html);
            
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
    _log(level, message) {
        const { debug, logLevel, logFile } = this.options;
        
        if (debug || level === 'error') {
            console.log(`[${level.toUpperCase()}] ${message}`);
        }

        if (logFile) {
            const logMessage = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`;
            fs.appendFileSync(logFile, logMessage);
        }
    }
} 