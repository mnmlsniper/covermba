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
 */
export class RequestCollector {
    /**
     * Создает экземпляр RequestCollector
     * @param {Object} apiCoverage - Экземпляр ApiCoverage
     * @param {Object} options - Настройки коллектора
     * @param {string} [options.outputDir='coverage'] - Директория для сохранения собранных данных
     * @param {string} [options.logLevel='info'] - Уровень логирования
     * @param {string} [options.logFile='coverage.log'] - Файл для сохранения логов
     */
    constructor(apiCoverage, options = {}) {
        this.requests = [];
        this.apiCoverage = apiCoverage;  // Сохраняем экземпляр ApiCoverage
        this.options = {
            outputDir: options.outputDir || 'coverage',
            logLevel: options.logLevel || 'info',
            logFile: options.logFile || 'coverage.log'
        };
    }

    /**
     * Инициализирует коллектор, очищая список запросов
     */
    async start() {
        this.requests = [];
    }

    /**
     * Останавливает коллектор и сохраняет собранные запросы в файл
     */
    async stop() {
        // Сохраняем собранные запросы
        const outputDir = this.options.outputDir;
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const requestsPath = path.join(outputDir, 'requests.json');
        fs.writeFileSync(requestsPath, JSON.stringify(this.requests, null, 2));
    }

    /**
     * Возвращает список собранных запросов
     * @returns {Array} Массив собранных запросов
     */
    getRequests() {
        return this.requests;
    }

    /**
     * Записывает запрос напрямую в коллектор.
     * Используйте этот метод, если у вас уже есть готовые данные о запросе.
     * @param {Object} request - Информация о запросе
     * @param {string} request.method - HTTP метод
     * @param {string} request.path - Путь запроса (должен включать basePath)
     * @param {number} request.status - HTTP статус ответа
     * @param {Object} [request.requestBody] - Тело запроса
     * @param {Object} [request.responseBody] - Тело ответа
     */
    recordRequest(request) {
        this.requests.push(request);
        // Передаем запрос в ApiCoverage
        if (this.apiCoverage.recordRequest) {
            this.apiCoverage.recordRequest(request);
        }
    }

    /**
     * Собирает информацию о запросе, автоматически извлекая путь из URL.
     * Рекомендуется использовать этот метод для автоматического сбора запросов.
     * @param {Object} request - Информация о запросе
     * @param {string} request.method - HTTP метод
     * @param {string} request.url - Полный URL запроса
     * @param {number} request.statusCode - HTTP статус ответа
     * @param {Object} [request.headers] - Заголовки запроса
     * @param {Object} [request.postData] - Данные POST запроса
     * @returns {Object} Исходный объект запроса
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
            
            console.log('Collected Playwright request:', collectedRequest);
        } 
        // Если это простой объект запроса
        else {
            const url = new URL(request.url);
            collectedRequest = {
                method: request.method,
                url: request.url,
                path: url.pathname,
                statusCode: request.statusCode,
                timestamp: new Date().toISOString(),
                headers: request.headers || {},
                postData: request.postData
            };
            
            console.log('Collected simple request:', collectedRequest);
        }

        this.requests.push(collectedRequest);
        
        // Передаем запрос в ApiCoverage
        if (this.apiCoverage.recordRequest) {
            // Извлекаем путь из URL, удаляя baseUrl
            const baseUrl = this.apiCoverage.options.baseUrl;
            let path = collectedRequest.path;
            
            // Удаляем baseUrl из пути, если он есть
            if (baseUrl) {
                const baseUrlObj = new URL(baseUrl);
                if (path.startsWith(baseUrlObj.pathname)) {
                    path = path.substring(baseUrlObj.pathname.length);
                }
            }
            
            // Добавляем basePath, если он есть и еще не добавлен
            const basePath = this.apiCoverage.options.basePath;
            if (basePath && !path.startsWith(basePath)) {
                path = basePath + (path.startsWith('/') ? path : '/' + path);
            }
            
            // Преобразуем запрос в формат, ожидаемый ApiCoverage
            const apiCoverageRequest = {
                method: collectedRequest.method.toUpperCase(),
                path: path,
                status: collectedRequest.statusCode,
                requestBody: collectedRequest.postData,
                responseBody: null,
                headers: collectedRequest.headers
            };
            
            console.log('Passing request to ApiCoverage:', apiCoverageRequest);
            this.apiCoverage.recordRequest(apiCoverageRequest);
        }
        
        return request;
    }
} 