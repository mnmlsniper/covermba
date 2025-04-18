import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class RequestCollector {
    constructor(options = {}) {
        this.requests = [];
        this.options = {
            outputDir: options.outputDir || 'coverage',
            logLevel: options.logLevel || 'info',
            logFile: options.logFile || 'coverage.log'
        };
    }

    async start() {
        this.requests = [];
    }

    async stop() {
        // Сохраняем собранные запросы
        const outputDir = this.options.outputDir;
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const requestsPath = path.join(outputDir, 'requests.json');
        fs.writeFileSync(requestsPath, JSON.stringify(this.requests, null, 2));
    }

    getRequests() {
        return this.requests;
    }

    recordRequest(request) {
        this.requests.push(request);
    }

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
        }

        this.requests.push(collectedRequest);
        return request;
    }
} 