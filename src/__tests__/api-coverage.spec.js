import { test, expect } from '@playwright/test';
import { ApiCoverage } from '../coverage/ApiCoverage.js';
import { RequestCollector } from '../collector/RequestCollector.js';

test('should track API coverage in basic test scenario', async ({ page }) => {
    // Инициализируем API coverage
    const apiCoverage = new ApiCoverage({
        swaggerPath: 'https://petstore.swagger.io/v2/swagger.json',
        baseUrl: 'https://petstore.swagger.io/v2',
        debug: true,
        outputDir: 'coverage-test'
    });

    // Инициализируем сборщик запросов
    const collector = new RequestCollector();

    try {
        // Запускаем отслеживание
        await apiCoverage.start();

        // Перехватываем запросы
        page.on('request', request => {
            const url = new URL(request.url());
            if (url.origin === 'https://petstore.swagger.io') {
                collector.collect(request);
            }
        });

        page.on('response', response => {
            const url = new URL(response.url());
            if (url.origin === 'https://petstore.swagger.io') {
                const request = response.request();
                collector.collect(request);
            }
        });

        // Базовый сценарий тестирования
        // 1. Получаем информацию о питомце
        await page.goto('https://petstore.swagger.io/v2/pet/1');
        await expect(page).toHaveTitle('Swagger UI');

        // 2. Проверяем инвентарь магазина
        await page.goto('https://petstore.swagger.io/v2/store/inventory');
        await expect(page).toHaveTitle('Swagger UI');

        // 3. Создаем нового питомца
        const newPet = {
            id: 123,
            name: "Test Pet",
            status: "available"
        };

        const response = await page.evaluate(async (pet) => {
            return await fetch('https://petstore.swagger.io/v2/pet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pet)
            });
        }, newPet);

        expect(response.status).toBe(200);

        // Записываем запросы в покрытие
        const requests = collector.getRequests();
        requests.forEach(request => {
            apiCoverage.recordRequest({
                method: request.method(),
                path: new URL(request.url()).pathname,
                statusCode: request.response()?.status() || 200
            });
        });

        // Останавливаем отслеживание и получаем отчет
        const coverage = await apiCoverage.stop();

        // Проверяем результаты
        expect(coverage).toBeTruthy();
        expect(coverage.totalEndpoints).toBeGreaterThan(0);
        expect(coverage.coveredEndpoints).toBeGreaterThan(0);
        expect(coverage.coveragePercentage).toBeGreaterThan(0);

        // Проверяем, что запросы были записаны
        expect(requests.length).toBeGreaterThanOrEqual(3);
        
        // Проверяем основные запросы
        const petRequests = requests.filter(r => 
            new URL(r.url()).pathname.includes('/pet')
        );
        expect(petRequests.length).toBeGreaterThanOrEqual(2);
        
        const storeRequests = requests.filter(r => 
            new URL(r.url()).pathname.includes('/store')
        );
        expect(storeRequests.length).toBeGreaterThanOrEqual(1);

    } catch (error) {
        throw new Error(`Test failed: ${error.message}`);
    }
}); 