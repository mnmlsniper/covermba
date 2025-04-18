import { test, expect } from '@playwright/test';
import { ApiCoverage } from '../coverage/ApiCoverage.js';
import { RequestCollector } from '../collector/RequestCollector.js';

test('should track API coverage with real requests', async ({ page }) => {
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

        // Выполняем тестовые запросы
        await page.goto('https://petstore.swagger.io/v2/pet/1');
        await page.goto('https://petstore.swagger.io/v2/store/inventory');

        // Записываем запросы в покрытие
        const requests = collector.getRequests();
        requests.forEach(request => {
            apiCoverage.recordRequest({
                method: request.method,
                path: request.path,
                statusCode: request.statusCode
            });
        });

        // Останавливаем отслеживание и получаем отчет
        const coverage = await apiCoverage.stop();

        // Проверяем результаты
        expect(coverage).toBeTruthy();
        expect(coverage.totalEndpoints).toBeGreaterThan(0);
        expect(coverage.coveragePercentage).toBeGreaterThanOrEqual(0);

        // Проверяем, что запросы были записаны
        expect(requests.length).toBeGreaterThanOrEqual(2);
        expect(requests[0].method).toBe('GET');
        expect(requests[0].path).toBe('/v2/pet/1');
        expect(requests[1].method).toBe('GET');
        expect(requests[1].path).toBe('/v2/store/inventory');

    } catch (error) {
        throw new Error(`Test failed: ${error.message}`);
    }
});

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

        // Базовый сценарий тестирования
        // 1. Получаем информацию о питомце
        await page.goto('https://petstore.swagger.io/v2/pet/1');

        // 2. Проверяем инвентарь магазина
        await page.goto('https://petstore.swagger.io/v2/store/inventory');

        // 3. Создаем нового питомца
        const newPet = {
            id: 123,
            name: "Test Pet",
            status: "available"
        };

        const response = await page.evaluate(async (pet) => {
            const res = await fetch('https://petstore.swagger.io/v2/pet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pet)
            });
            return { status: res.status };
        }, newPet);

        expect(response.status).toBe(200);

        // Записываем запросы в покрытие
        const requests = collector.getRequests();
        requests.forEach(request => {
            apiCoverage.recordRequest({
                method: request.method,
                path: request.path,
                statusCode: request.statusCode
            });
        });

        // Останавливаем отслеживание и получаем отчет
        const coverage = await apiCoverage.stop();

        // Проверяем результаты
        expect(coverage).toBeTruthy();
        expect(coverage.totalEndpoints).toBeGreaterThan(0);
        expect(coverage.coveragePercentage).toBeGreaterThanOrEqual(0);

        // Проверяем, что запросы были записаны
        expect(requests.length).toBeGreaterThanOrEqual(3);
        
        // Проверяем основные запросы
        const petRequests = requests.filter(r => r.path.includes('/pet'));
        expect(petRequests.length).toBeGreaterThanOrEqual(2);
        
        const storeRequests = requests.filter(r => r.path.includes('/store'));
        expect(storeRequests.length).toBeGreaterThanOrEqual(1);

    } catch (error) {
        throw new Error(`Test failed: ${error.message}`);
    }
}); 