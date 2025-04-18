import test from 'ava';
import { ApiCoverage } from '../coverage/ApiCoverage.js';
import { RequestCollector } from '../collector/RequestCollector.js';
import { chromium } from '@playwright/test';

test('should track API coverage with real requests', async (t) => {
    // Инициализируем API coverage
    const apiCoverage = new ApiCoverage({
        swaggerPath: 'https://petstore.swagger.io/v2/swagger.json',
        baseUrl: 'https://petstore.swagger.io/v2',
        debug: true,
        outputDir: 'coverage-test'
    });

    // Инициализируем сборщик запросов
    const collector = new RequestCollector();

    // Запускаем браузер
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

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

        // Выполняем тестовые запросы
        await page.goto('https://petstore.swagger.io/v2/pet/1');
        await page.goto('https://petstore.swagger.io/v2/store/inventory');

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
        t.truthy(coverage);
        t.true(coverage.totalEndpoints > 0);
        t.true(coverage.coveredEndpoints > 0);
        t.true(coverage.coveragePercentage > 0);

        // Проверяем, что запросы были записаны
        t.true(requests.length >= 2);
        t.is(requests[0].method(), 'GET');
        t.is(new URL(requests[0].url()).pathname, '/v2/pet/1');
        t.is(requests[1].method(), 'GET');
        t.is(new URL(requests[1].url()).pathname, '/v2/store/inventory');

    } catch (error) {
        t.fail(`Test failed: ${error.message}`);
    } finally {
        await browser.close();
    }
});

test('should track API coverage in basic test scenario', async (t) => {
    // Инициализируем API coverage
    const apiCoverage = new ApiCoverage({
        swaggerPath: 'https://petstore.swagger.io/v2/swagger.json',
        baseUrl: 'https://petstore.swagger.io/v2',
        debug: true,
        outputDir: 'coverage-test'
    });

    // Инициализируем сборщик запросов
    const collector = new RequestCollector();

    // Запускаем браузер
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

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
        t.is(await page.title(), 'Swagger UI');

        // 2. Проверяем инвентарь магазина
        await page.goto('https://petstore.swagger.io/v2/store/inventory');
        t.is(await page.title(), 'Swagger UI');

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

        t.is(response.status, 200);

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
        t.truthy(coverage);
        t.true(coverage.totalEndpoints > 0);
        t.true(coverage.coveredEndpoints > 0);
        t.true(coverage.coveragePercentage > 0);

        // Проверяем, что запросы были записаны
        t.true(requests.length >= 3);
        
        // Проверяем основные запросы
        const petRequests = requests.filter(r => 
            new URL(r.url()).pathname.includes('/pet')
        );
        t.true(petRequests.length >= 2);
        
        const storeRequests = requests.filter(r => 
            new URL(r.url()).pathname.includes('/store')
        );
        t.true(storeRequests.length >= 1);

    } catch (error) {
        t.fail(`Test failed: ${error.message}`);
    } finally {
        await browser.close();
    }
}); 