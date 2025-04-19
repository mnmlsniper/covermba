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
        debug: false,  // Включаем отладку
        outputDir: './coverage/apichallenges',
        generateHtmlReport: true
    });

    await apiCoverage.start();
    collector = new RequestCollector(apiCoverage);

});

test('should track API coverage with multiple requests', async ({ request }) => {
    // 1. Создаем новую сессию
    const challengerResponse = await request.post('https://apichallenges.herokuapp.com/challenger');
    await collector.collect({
        method: 'POST',
        url: 'https://apichallenges.herokuapp.com/challenger',
        statusCode: challengerResponse.status(),
        headers: challengerResponse.headers()
    });
    
    expect(challengerResponse.status()).toBe(201);
    const challengerId = challengerResponse.headers()['x-challenger'];
    expect(challengerId).toBeDefined();

    // 2. Получаем список задач
    const challengesResponse = await request.get('https://apichallenges.herokuapp.com/challenges', {
        headers: {
            'x-challenger': challengerId
        }
    });
    await collector.collect({
        method: 'GET',
        url: 'https://apichallenges.herokuapp.com/challenges',
        statusCode: challengesResponse.status(),
        headers: challengesResponse.headers()
    });
    expect(challengesResponse.status()).toBe(200);

    // 3. Получаем детали первой задачи
    const responseData = await challengesResponse.json();
    const challenges = responseData.challenges;
    
    // Проверяем, что у нас есть хотя бы одна задача
    expect(challenges.length).toBeGreaterThan(0);
    
    // Вместо запроса к конкретному челленджу, сделаем запрос к /todos
    const todosResponse = await request.get('https://apichallenges.herokuapp.com/todos', {
        headers: {
            'x-challenger': challengerId
        }
    });
    await collector.collect({
        method: 'GET',
        url: 'https://apichallenges.herokuapp.com/todos',
        statusCode: todosResponse.status(),
        headers: todosResponse.headers()
    });
    expect(todosResponse.status()).toBe(200);

    // Генерируем отчет и получаем данные о покрытии
    const coverage = await apiCoverage.generateReport();
      
    
    expect(coverage).toBeTruthy();
    expect(coverage.totalEndpoints).toBeGreaterThan(0);
    expect(coverage.coveredEndpoints).toBeGreaterThan(0);
    expect(coverage.percentage).toBeGreaterThan(0);

    // Проверяем, что все наши запросы были зафиксированы
    const coveredEndpoints = coverage.endpoints
        .filter(endpoint => endpoint.requests && endpoint.requests.length > 0)
        .map(endpoint => `${endpoint.method} ${endpoint.path}`);
    
    expect(coveredEndpoints.length).toBeGreaterThan(0);
    expect(coveredEndpoints).toContain('POST /challenger');
    expect(coveredEndpoints).toContain('GET /challenges');
    expect(coveredEndpoints).toContain('GET /todos');

    // Verify coverage report
    const coverageReport = await apiCoverage.generateReport();
    expect(coverageReport.totalEndpoints).toBeGreaterThan(0);
    expect(coverageReport.coveredEndpoints).toBeGreaterThan(0);
    expect(coverageReport.percentage).toBeGreaterThan(0);
    expect(coverageReport.endpoints).toBeDefined();
    expect(coverageReport.endpoints.length).toBeGreaterThan(0);
    expect(coverageReport.services).toBeDefined();
    expect(Object.keys(coverageReport.services).length).toBeGreaterThan(0);

    // Verify HTML report file
    const reportPath = path.join(process.cwd(), 'coverage', 'apichallenges', 'coverage.html');
    expect(fs.existsSync(reportPath)).toBe(true);
    
    const reportContent = fs.readFileSync(reportPath, 'utf8');
    expect(reportContent).toContain('API Coverage Report');
    expect(reportContent).toContain(`${coverageReport.percentage.toFixed(2)}%`);
}); 