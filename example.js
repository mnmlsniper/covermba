import { chromium } from 'playwright';
import { ApiCoverage } from './src/index.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runExample() {
    // Инициализируем API coverage с несколькими Swagger файлами
    const apiCoverage = new ApiCoverage({
        swaggerPath: [
            './swagger/user-service.json',
            './swagger/order-service.json',
            './swagger/payment-service.json'
        ],
        baseUrls: {
            'user-service': 'https://api.example.com/users',
            'order-service': 'https://api.example.com/orders',
            'payment-service': 'https://api.example.com/payments'
        },
        ignorePaths: ['/health', '/metrics'],
        debug: true
    });

    // Запускаем отслеживание
    await apiCoverage.start();

    // Запускаем браузер
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Слушаем все сетевые запросы
    page.on('request', request => {
        const url = new URL(request.url());
        // Проверяем все базовые URL'ы
        for (const [service, baseUrl] of Object.entries(apiCoverage.options.baseUrls)) {
            if (url.origin === new URL(baseUrl).origin) {
                apiCoverage.recordRequest({
                    method: request.method(),
                    path: url.pathname,
                    statusCode: 0,
                    service: service
                });
                break;
            }
        }
    });

    page.on('response', response => {
        const url = new URL(response.url());
        // Проверяем все базовые URL'ы
        for (const [service, baseUrl] of Object.entries(apiCoverage.options.baseUrls)) {
            if (url.origin === new URL(baseUrl).origin) {
                apiCoverage.recordRequest({
                    method: response.request().method(),
                    path: url.pathname,
                    statusCode: response.status(),
                    service: service
                });
                break;
            }
        }
    });

    try {
        // Ваш тестовый код здесь
        await page.goto('https://example.com');
        // ... выполняем тесты ...

    } finally {
        // Останавливаем отслеживание и получаем результаты
        const coverage = await apiCoverage.stop();
        
        // Выводим общую статистику
        console.log('\nAPI Coverage Results:');
        console.log(`Total Endpoints: ${coverage.totalEndpoints}`);
        console.log(`Covered Endpoints: ${coverage.coveredEndpoints}`);
        console.log(`Coverage Percentage: ${coverage.coveragePercentage.toFixed(2)}%`);

        // Выводим статистику по сервисам
        console.log('\nService Coverage:');
        for (const [service, stats] of Object.entries(coverage.serviceStats)) {
            console.log(`\n${stats.title} (${stats.version}):`);
            console.log(`  Coverage: ${stats.coveragePercentage.toFixed(2)}%`);
            console.log(`  Endpoints: ${stats.coveredEndpoints}/${stats.totalEndpoints}`);
        }

        // Выводим статистику по тегам
        const tagCoverage = apiCoverage.getTagCoverage();
        console.log('\nTag Coverage:');
        for (const [tag, stats] of Object.entries(tagCoverage)) {
            console.log(`\n${tag}:`);
            console.log(`  Coverage: ${stats.coveragePercentage.toFixed(2)}%`);
            console.log(`  Endpoints: ${stats.coveredEndpoints}/${stats.totalEndpoints}`);
        }

        await browser.close();
    }
}

runExample().catch(console.error); 