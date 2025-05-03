import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Класс для сбора и хранения информации о HTTP запросах.
 * Предоставляет два способа записи запросов:
 * 1. Через метод collect() - для автоматического сбора запросов с извлечением пути из URL
 * 2. Через метод recordRequest() - для прямой записи запросов с уже подготовленными данными
 * 
 * @example
 * // Автоматический сбор запросов
 * const collector = new RequestCollector(apiCoverage, { outputDir: 'coverage' });
 * collector.collect({
 *   method: 'POST',
 *   url: 'https://api.example.com/users',
 *   statusCode: 200
 * });
 * 
 * // Прямая запись запроса
 * collector.recordRequest({
 *   method: 'POST',
 *   path: '/users',
 *   status: 200,
 *   requestBody: { name: 'John' }
 * });
 */
export class RequestCollector {
    /**
     * Создает экземпляр RequestCollector
     * @param {Object} apiCoverage - Экземпляр ApiCoverage для передачи собранных данных
     * @param {Object} options - Настройки коллектора
     * @param {string} [options.outputDir='coverage'] - Директория для сохранения собранных данных
     * @param {string} [options.logLevel='info'] - Уровень логирования (debug, info, warn, error)
     * @param {string} [options.logFile='coverage.log'] - Файл для сохранения логов
     * @throws {Error} Если не передан экземпляр ApiCoverage
     */
    constructor(apiCoverage, options = {}) {
        if (!apiCoverage) {
            throw new Error('ApiCoverage instance is required');
        }
        this.requests = [];
        this.apiCoverage = apiCoverage;
        
        // Используем относительный путь от корня проекта
        this.options = {
            outputDir: 'coverage/apichallenges',
            logLevel: options.logLevel || 'info',
            logFile: options.logFile || 'coverage.log',
            debug: options.debug || false
        };
    }

    /**
     * Инициализирует коллектор, очищая список запросов
     * @returns {Promise<void>}
     */
    async start() {
        this.requests = [];
    }

    /**
     * Останавливает коллектор и сохраняет собранные запросы в файл
     * @returns {Promise<void>}
     * @throws {Error} Если не удалось создать директорию или сохранить файл
     */
    async stop() {
        const outputDir = this.options.outputDir;
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const requestsPath = path.join(outputDir, 'requests.json');
        fs.writeFileSync(requestsPath, JSON.stringify(this.requests, null, 2));
    }

    /**
     * Возвращает список собранных запросов
     * @returns {Array<Object>} Массив собранных запросов
     */
    getRequests() {
        return this.requests;
    }

    /**
     * Записывает запрос напрямую в коллектор.
     * Используйте этот метод, если у вас уже есть готовые данные о запросе.
     * @param {Object} request - Информация о запросе
     * @param {string} request.method - HTTP метод (GET, POST, PUT, DELETE, etc.)
     * @param {string} request.path - Путь запроса (должен включать basePath)
     * @param {number} request.status - HTTP статус ответа
     * @param {Object} [request.requestBody] - Тело запроса (для POST, PUT, PATCH)
     * @param {Object} [request.responseBody] - Тело ответа
     * @param {Object} [request.headers] - Заголовки запроса
     * @param {string} [request.timestamp] - Временная метка запроса (ISO формат)
     */
    recordRequest(request) {
        const normalizedRequest = {
            ...request,
            statusCode: request.status || request.statusCode,
            timestamp: request.timestamp || new Date().toISOString()
        };
        
        this.requests.push(normalizedRequest);
        
        if (this.apiCoverage.recordRequest) {
            this.apiCoverage.recordRequest(normalizedRequest);
        }
    }

    /**
     * Собирает информацию о запросе, автоматически извлекая путь из URL.
     * Рекомендуется использовать этот метод для автоматического сбора запросов.
     * @param {Object|import('playwright').Request} request - Объект запроса (обычный или Playwright)
     * @param {string} request.method - HTTP метод
     * @param {string} request.url - Полный URL запроса
     * @param {number} [request.statusCode] - HTTP статус ответа
     * @param {Object} [request.headers] - Заголовки запроса
     * @param {Object|string} [request.postData] - Данные POST запроса
     * @returns {Object} Исходный объект запроса
     * @throws {Error} Если не удалось разобрать URL или извлечь данные запроса
     */
    collect(request) {
        let collectedRequest;
        
        // Если это объект запроса Playwright
        if (typeof request.url === 'function') {
            const url = new URL(request.url());
            collectedRequest = {
                method: request.method(),
                url: request.url(),
                path: url.pathname,
                statusCode: request.response()?.status() || 200,
                timestamp: new Date().toISOString(),
                headers: request.headers(),
                postData: request.postData()
            };
            this.requests.push(collectedRequest);
        } 
        // Если это простой объект запроса
        else {
            const url = new URL(request.url);
            collectedRequest = {
                method: request.method,
                url: request.url,
                path: url.pathname,
                statusCode: request.statusCode || request.status,
                timestamp: new Date().toISOString(),
                headers: request.headers || {},
                postData: request.postData,
                responseBody: request.responseBody
            };
            this.requests.push(collectedRequest);
        }

        // Передаем запрос в ApiCoverage
        if (this.apiCoverage.recordRequest) {
            // Преобразуем запрос в формат, ожидаемый ApiCoverage
            const apiCoverageRequest = {
                method: collectedRequest.method.toUpperCase(),
                path: collectedRequest.path,
                statusCode: collectedRequest.statusCode,
                requestBody: collectedRequest.postData,
                responseBody: collectedRequest.responseBody,
                headers: collectedRequest.headers,
                timestamp: collectedRequest.timestamp
            };
            
            this.apiCoverage.recordRequest(apiCoverageRequest);
        }
        
        return request;
    }

    addRequest(request) {
        const normalizedRequest = this.normalizeRequest(request);
        this.requests.push(normalizedRequest);
        this.saveRequests();
    }

    addPlaywrightRequest(request) {
        const collectedRequest = {
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            postData: request.postData(),
            timestamp: new Date().toISOString()
        };
        this.requests.push(collectedRequest);
        this.saveRequests();
    }

    addSimpleRequest(request) {
        const collectedRequest = {
            url: request.url,
            method: request.method,
            headers: request.headers,
            body: request.body,
            timestamp: new Date().toISOString()
        };
        this.requests.push(collectedRequest);
        this.saveRequests();
    }
} 