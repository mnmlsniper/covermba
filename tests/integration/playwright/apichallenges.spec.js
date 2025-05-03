import { test, expect } from '@playwright/test';
import { ApiCoverage } from '../../../src/coverage/ApiCoverage.js';
import { RequestCollector } from '../../../src/coverage/RequestCollector.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

let apiCoverage;
let collector;

test.beforeAll(async () => {
    apiCoverage = new ApiCoverage({
        swaggerPath: 'https://apichallenges.herokuapp.com/docs/swagger',
        baseUrl: 'https://apichallenges.herokuapp.com',
        debug: true,  // Включаем отладку
        outputDir: './coverage/apichallenges',
        generateHtmlReport: true
    });

    await apiCoverage.start();
    collector = apiCoverage.collector;  // Используем коллектор из ApiCoverage
});

test.afterAll(async () => {
    await apiCoverage.stop();
});

test('should track API coverage with multiple requests', async ({ request }) => {
    // 1. Создаем новую сессию
    const challengerResponse = await request.post('https://apichallenges.herokuapp.com/challenger');
    expect(challengerResponse.status()).toBe(201);
    
    const challengerId = challengerResponse.headers()['x-challenger'];
    expect(challengerId).toBeDefined();

    // Записываем запрос в коллектор
    let responseBody = {};
    try {
        const text = await challengerResponse.text();
        if (text) {
            responseBody = JSON.parse(text);
        }
    } catch (e) {
        // Ignore error
    }

    collector.collect({
        method: 'POST',
        url: 'https://apichallenges.herokuapp.com/challenger',
        statusCode: challengerResponse.status(),
        postData: {},
        responseBody
    });

    // 2. Получаем список задач
    const challengesResponse = await request.get('https://apichallenges.herokuapp.com/challenges', {
        headers: {
            'x-challenger': challengerId
        }
    });
    expect(challengesResponse.status()).toBe(200);

    // Записываем запрос в коллектор
    responseBody = {};
    try {
        const text = await challengesResponse.text();
        if (text) {
            responseBody = JSON.parse(text);
        }
    } catch (e) {
        // Ignore error
    }

    collector.collect({
        method: 'GET',
        url: 'https://apichallenges.herokuapp.com/challenges',
        statusCode: challengesResponse.status(),
        postData: {},
        responseBody
    });

    // 3. Получаем список todos
    const todosResponse = await request.get('https://apichallenges.herokuapp.com/todos', {
        headers: {
            'x-challenger': challengerId
        }
    });
    expect(todosResponse.status()).toBe(200);

    // Записываем запрос в коллектор
    responseBody = {};
    try {
        const text = await todosResponse.text();
        if (text) {
            responseBody = JSON.parse(text);
        }
    } catch (e) {
        // Ignore error
    }

    collector.collect({
        method: 'GET',
        url: 'https://apichallenges.herokuapp.com/todos',
        statusCode: todosResponse.status(),
        postData: {},
        responseBody
    });

    // Генерируем отчет
    await apiCoverage.generateReport();
    
    // Останавливаем ApiCoverage для сохранения requests.json
    await apiCoverage.stop();

    // Проверяем существование файлов отчета
    const coverageDir = path.join(process.cwd(), 'coverage', 'apichallenges');
    const htmlReportPath = path.join(coverageDir, 'coverage.html');
    const jsonReportPath = path.join(coverageDir, 'coverage.json');
    const requestsPath = path.join(coverageDir, 'requests.json');

    // Проверяем существование директории
    expect(fs.existsSync(coverageDir)).toBe(true);
    
    // Проверяем существование файлов отчета
    expect(fs.existsSync(htmlReportPath)).toBe(true);
    expect(fs.existsSync(jsonReportPath)).toBe(true);
    expect(fs.existsSync(requestsPath)).toBe(true);

    // Проверяем содержимое JSON отчета
    const jsonReport = JSON.parse(fs.readFileSync(jsonReportPath, 'utf8'));
    expect(jsonReport).toBeTruthy();
    expect(jsonReport.totalEndpoints).toBeGreaterThan(0);
    expect(jsonReport.coveredEndpoints).toBeGreaterThan(0);
    expect(jsonReport.percentage).toBeGreaterThan(0);
    
    // Проверяем содержимое requests.json
    const requests = JSON.parse(fs.readFileSync(requestsPath, 'utf8'));
    expect(requests).toBeTruthy();
    expect(requests.length).toBeGreaterThan(0);
}); 