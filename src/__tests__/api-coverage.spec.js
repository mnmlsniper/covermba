import { test, expect } from '@playwright/test';
import { ApiCoverage } from '../coverage/ApiCoverage.js';
import { RequestCollector } from '../collector/RequestCollector.js';

test.describe('API Coverage Tests', () => {
    let apiCoverage;
    let collector;

    test.beforeAll(async () => {
        // Инициализируем API coverage
        apiCoverage = new ApiCoverage({
            swaggerPath: 'https://petstore.swagger.io/v2/swagger.json',
            baseUrl: 'https://petstore.swagger.io/v2',
            debug: true,
            outputDir: 'coverage-test'
        });

        // Инициализируем сборщик запросов
        collector = new RequestCollector();

        // Запускаем отслеживание
        await apiCoverage.start();
    });

    test.afterAll(async () => {
        // Останавливаем отслеживание и получаем отчет
        await apiCoverage.stop();
    });

    test('should track API coverage in basic test scenario', async ({ page }) => {
        try {
            // Перехватываем запросы
            page.on('request', request => {
                const url = new URL(request.url());
                if (url.origin === 'https://petstore.swagger.io') {
                    collector.collect(request);
                }
            });

            // Выполняем тестовые запросы
            // 1. Получаем информацию о питомце
            await page.goto('https://petstore.swagger.io/v2/pet/1');
            await page.waitForLoadState('networkidle');

            // 2. Проверяем инвентарь магазина
            await page.goto('https://petstore.swagger.io/v2/store/inventory');
            await page.waitForLoadState('networkidle');

            // 3. Создаем нового питомца
            const newPet = {
                id: 123,
                name: "Test Pet",
                status: "available"
            };

            await page.evaluate(async (pet) => {
                await fetch('https://petstore.swagger.io/v2/pet', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(pet)
                });
            }, newPet);

            // Записываем запросы в покрытие
            const requests = collector.getRequests();
            console.log('Collected requests:', requests);

            requests.forEach(request => {
                const path = request.path.replace('/v2', ''); // Убираем префикс /v2
                console.log('Recording request:', {
                    method: request.method,
                    path: path,
                    statusCode: request.statusCode
                });
                apiCoverage.recordRequest({
                    method: request.method,
                    path: path,
                    statusCode: request.statusCode
                });
            });

            // Проверяем результаты
            const coverage = await apiCoverage.stop();
            console.log('Coverage data:', coverage);
            
            expect(coverage).toBeTruthy();
            expect(coverage.totalEndpoints).toBeGreaterThan(0);
            expect(coverage.coveredEndpoints).toBeGreaterThan(0);
            expect(coverage.coveragePercentage).toBeGreaterThan(0);

        } catch (error) {
            throw new Error(`Test failed: ${error.message}`);
        }
    });
}); 