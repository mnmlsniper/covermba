import { test, expect } from '@playwright/test';
import { ApiCoverage, RequestCollector } from '../../src/index.js';

test.describe('Playwright Integration Tests', () => {
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
        try {
            // 1. Создаем новую сессию
            const challengerResponse = await collector.collect(
                request.post('https://apichallenges.herokuapp.com/challenger')
            );
            expect(challengerResponse.status()).toBe(201);
            
            const challengerId = challengerResponse.headers()['x-challenger'];
            expect(challengerId).toBeDefined();

            // 2. Получаем список задач
            const challengesResponse = await collector.collect(
                request.get('https://apichallenges.herokuapp.com/challenges', {
                    headers: {
                        'x-challenger': challengerId
                    }
                })
            );
            expect(challengesResponse.status()).toBe(200);

            // 3. Получаем детали первой задачи
            const challenges = await challengesResponse.json();
            const firstChallenge = challenges[0];
            
            const challengeResponse = await collector.collect(
                request.get(`https://apichallenges.herokuapp.com/challenges/${firstChallenge.id}`, {
                    headers: {
                        'x-challenger': challengerId
                    }
                })
            );
            expect(challengeResponse.status()).toBe(200);

            // Записываем запросы в покрытие
            const requests = collector.getRequests();
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
            
            expect(coverage).toBeTruthy();
            expect(coverage.totalEndpoints).toBeGreaterThan(0);
            expect(coverage.coveredEndpoints).toBeGreaterThan(0);
            expect(coverage.coveragePercentage).toBeGreaterThan(0);

            // Проверяем детали покрытия
            const coveredEndpoints = coverage.endpoints.filter(e => e.covered);
            expect(coveredEndpoints.length).toBeGreaterThan(0);
            
            // Проверяем, что все наши запросы были зафиксированы
            const coveredPaths = coveredEndpoints.map(e => e.path);
            expect(coveredPaths).toContain('/challenger');
            expect(coveredPaths).toContain('/challenges');
            expect(coveredPaths).toContain(`/challenges/${firstChallenge.id}`);

        } catch (error) {
            throw new Error(`Test failed: ${error.message}`);
        }
    });
}); 