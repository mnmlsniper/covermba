import { test, expect } from '@playwright/test';
import { ApiCoverage } from '../src/index.js';
import fs from 'fs';
import path from 'path';

test.describe('API Coverage Tests', () => {
    let apiCoverage;
    const testSwaggerPath = './tests/fixtures/test-swagger.yaml';
    const testBaseUrl = 'https://api.example.com';
    const outputDir = 'coverage-test';

    test.beforeAll(async () => {
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

        await apiCoverage.start();
    });

    test.afterAll(async () => {
        await apiCoverage.stop();
        
        // Очищаем тестовые файлы
        if (fs.existsSync(testSwaggerPath)) {
            fs.unlinkSync(testSwaggerPath);
        }
        // Закомментировано для просмотра отчетов после теста
        // if (fs.existsSync(outputDir)) {
        //     fs.rmSync(outputDir, { recursive: true });
        // }
    });

    test('should record request and generate coverage report', async ({ request }) => {
        // Записываем тестовый запрос
        apiCoverage.recordRequest({
            method: 'GET',
            path: '/test/endpoint',
            statusCode: 200
        });

        // Останавливаем покрытие и получаем результаты
        const coverage = await apiCoverage.stop();

        // Проверяем результаты
        expect(coverage).toBeDefined();
        expect(coverage.totalEndpoints).toBe(2); // Два эндпоинта в спецификации
        expect(coverage.coveredEndpoints).toBe(1); // Один запрос был сделан
        expect(coverage.coveragePercentage).toBeGreaterThan(0);
        expect(coverage.coveragePercentage).toBeLessThan(100);

        // Проверяем что директория создана
        expect(fs.existsSync(outputDir)).toBeTruthy();
        
        // Проверяем что файлы отчета созданы
        expect(fs.existsSync(path.join(outputDir, 'coverage.json'))).toBeTruthy();
        expect(fs.existsSync(path.join(outputDir, 'coverage.html'))).toBeTruthy();
    });
}); 