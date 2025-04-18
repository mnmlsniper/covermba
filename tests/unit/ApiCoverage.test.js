import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ApiCoverage } from '../../src/coverage/ApiCoverage.js';
import fs from 'fs';
import path from 'path';

describe('ApiCoverage', () => {
    let apiCoverage;
    const testSwaggerPath = './tests/fixtures/test-swagger.yaml';
    const testBaseUrl = 'https://api.example.com';
    const outputDir = 'coverage-test';

    beforeEach(() => {
        // Создаем тестовую Swagger спецификацию
        const swaggerContent = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /test/endpoint:
    get:
      summary: Test endpoint
      responses:
        '200':
          description: Successful response
  /test/another:
    post:
      summary: Another test endpoint
      responses:
        '201':
          description: Created
`;

        // Создаем директорию для тестовых файлов если её нет
        const fixturesDir = path.dirname(testSwaggerPath);
        if (!fs.existsSync(fixturesDir)) {
            fs.mkdirSync(fixturesDir, { recursive: true });
        }

        // Сохраняем тестовую спецификацию
        fs.writeFileSync(testSwaggerPath, swaggerContent);

        // Инициализируем ApiCoverage
        apiCoverage = new ApiCoverage({
            swaggerPath: testSwaggerPath,
            baseUrl: testBaseUrl,
            debug: true,
            outputDir: outputDir
        });
    });

    afterEach(() => {
        // Очищаем тестовые файлы
        if (fs.existsSync(testSwaggerPath)) {
            fs.unlinkSync(testSwaggerPath);
        }
        if (fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true });
        }
    });

    describe('constructor', () => {
        it('should initialize with default options', () => {
            const coverage = new ApiCoverage({
                swaggerPath: testSwaggerPath,
                baseUrl: testBaseUrl
            });

            expect(coverage.options.debug).toBe(false);
            expect(coverage.options.outputDir).toBe('coverage');
            expect(coverage.options.logLevel).toBe('info');
        });

        it('should initialize with custom options', () => {
            expect(apiCoverage.options.debug).toBe(true);
            expect(apiCoverage.options.outputDir).toBe(outputDir);
        });
    });

    describe('start', () => {
        it('should load and process Swagger spec', async () => {
            await apiCoverage.start();
            expect(apiCoverage.isInitialized).toBe(true);
            expect(Object.keys(apiCoverage.endpoints).length).toBe(2);
        });

        it('should throw error for invalid Swagger path', async () => {
            const invalidCoverage = new ApiCoverage({
                swaggerPath: 'invalid/path.yaml',
                baseUrl: testBaseUrl
            });

            await expect(invalidCoverage.start()).rejects.toThrow();
        });
    });

    describe('recordRequest', () => {
        it('should record request and match with endpoint', async () => {
            await apiCoverage.start();
            
            apiCoverage.recordRequest({
                method: 'GET',
                path: '/test/endpoint',
                statusCode: 200
            });

            const endpointKey = 'GET /test/endpoint';
            expect(apiCoverage.endpoints[endpointKey].requests.length).toBe(1);
            expect(apiCoverage.requests.length).toBe(1);
        });

        it('should not record request if not initialized', () => {
            apiCoverage.recordRequest({
                method: 'GET',
                path: '/test/endpoint',
                statusCode: 200
            });

            expect(apiCoverage.requests.length).toBe(0);
        });
    });

    describe('stop', () => {
        it('should calculate and return coverage', async () => {
            await apiCoverage.start();
            
            apiCoverage.recordRequest({
                method: 'GET',
                path: '/test/endpoint',
                statusCode: 200
            });

            const coverage = await apiCoverage.stop();
            
            expect(coverage).toBeDefined();
            expect(coverage.totalEndpoints).toBe(2);
            expect(coverage.coveredEndpoints).toBe(1);
            expect(coverage.coveragePercentage).toBe(50);
        });

        it('should generate coverage files', async () => {
            await apiCoverage.start();
            await apiCoverage.stop();

            expect(fs.existsSync(path.join(outputDir, 'coverage.json'))).toBeTruthy();
            expect(fs.existsSync(path.join(outputDir, 'coverage.html'))).toBeTruthy();
        });
    });
}); 