import { test, expect } from '@playwright/test';
import { ApiCoverage, RequestCollector } from '../../../src/index.js';

let apiCoverage;
let collector;

test.beforeAll(async () => {
    apiCoverage = new ApiCoverage({
        swaggerPath: 'https://apichallenges.herokuapp.com/docs/swagger',
        baseUrl: 'https://apichallenges.herokuapp.com',
        debug: false,
        outputDir: 'coverage-test',
        logLevel: 'debug',
        logFile: 'coverage-test/coverage.log'
    });

    collector = new RequestCollector();
    await apiCoverage.start();
});

test('should track API coverage with multiple requests', async ({ request }) => {
    // 1. Создаем новую сессию
    const challengerResponse = await request.post('https://apichallenges.herokuapp.com/challenger');
    collector.collect({
        method: 'POST',
        url: challengerResponse.url(),
        path: '/challenger',
        statusCode: challengerResponse.status()
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
    collector.collect({
        method: 'GET',
        url: challengesResponse.url(),
        path: '/challenges',
        statusCode: challengesResponse.status()
    });
    expect(challengesResponse.status()).toBe(200);

    // 3. Получаем детали первой задачи
    const responseData = await challengesResponse.json();
    const challenges = responseData.challenges;
    console.log('Challenges response:', responseData);
    
    // Проверяем, что у нас есть хотя бы одна задача
    expect(challenges.length).toBeGreaterThan(0);
    
    // Вместо запроса к конкретному челленджу, сделаем запрос к /todos
    const todosResponse = await request.get('https://apichallenges.herokuapp.com/todos', {
        headers: {
            'x-challenger': challengerId
        }
    });
    collector.collect({
        method: 'GET',
        url: todosResponse.url(),
        path: '/todos',
        statusCode: todosResponse.status()
    });
    expect(todosResponse.status()).toBe(200);

    // Записываем запросы в покрытие
    const requests = collector.getRequests();
    console.log('Collected requests:', requests);
    
    requests.forEach(request => {
        apiCoverage.recordRequest({
            method: request.method,
            path: request.path,
            statusCode: request.statusCode,
            service: 'challenges'
        });
    });

    // Проверяем результаты
    const coverage = await apiCoverage.stop();
    console.log('Coverage data:', JSON.stringify(coverage, null, 2));
    
    expect(coverage).toBeTruthy();
    expect(coverage.totalEndpoints).toBeGreaterThan(0);
    expect(coverage.coveredEndpoints).toBeGreaterThan(0);
    expect(coverage.coveragePercentage).toBeGreaterThan(0);

    // Проверяем, что все наши запросы были зафиксированы
    const allEndpoints = Object.keys(coverage.endpoints);
    console.log('All endpoints:', allEndpoints);
    
    const coveredEndpoints = allEndpoints.filter(path => {
        const endpoint = coverage.endpoints[path];
        console.log(`Endpoint ${path}:`, endpoint);
        return endpoint.requests && endpoint.requests.length > 0;
    });
    
    console.log('Covered endpoints:', coveredEndpoints);
    expect(coveredEndpoints.length).toBeGreaterThan(0);
    expect(coveredEndpoints).toContain('POST /challenger');
    expect(coveredEndpoints).toContain('GET /challenges');
    expect(coveredEndpoints).toContain('GET /todos');
}); 