import { test, expect } from '@playwright/test';
import { ApiCoverage } from '../../../src/coverage/ApiCoverage.js';
import { RequestCollector } from '../../../src/coverage/RequestCollector.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let apiCoverage;
let collector;

test.beforeAll(async () => {
    apiCoverage = new ApiCoverage({
        swaggerPath: path.join(__dirname, 'swagger.json'),
        baseUrl: 'https://realworld.qa.guru',
        basePath: '/api',
        outputDir: './coverage/realworld',
        title: 'RealWorld API Coverage Report',
        debug: false,
        generateHtmlReport: true
    });
    
    await apiCoverage.start();
    collector = new RequestCollector(apiCoverage);
});

test.afterAll(async () => {
    await apiCoverage.stop();
});

test('should track API coverage with login request', async ({ request }) => {
    const response = await request.post('https://realworld.qa.guru/api/users/login', {
        data: {
            user: {
                email: 'test@example.com',
                password: 'password123'
            }
        }
    });
    
    // Записываем запрос в коллектор
    let responseBody = {};
    try {
        responseBody = await response.json();
    } catch (e) {
        console.log('No response body or invalid JSON');
    }

    collector.recordRequest({
        method: 'POST',
        path: '/users/login',
        statusCode: response.status(),
        requestBody: {
            user: {
                email: 'test@example.com',
                password: 'password123'
            }
        },
        responseBody
    });
    
    expect(response.ok()).toBeTruthy();
    const responseData = responseBody;
    expect(responseData.user).toBeDefined();
    expect(responseData.user.email).toBeDefined();
    expect(responseData.user.token).toBeDefined();
    expect(responseData.user.username).toBeDefined();
    expect(responseData.user.bio).toBeDefined();
    expect(responseData.user.image).toBeDefined();
    
    // Генерируем отчет явно
    await apiCoverage.generateReport();
});

test('should track API coverage with login request - invalid credentials', async ({ request }) => {
    const response = await request.post('https://realworld.qa.guru/api/users/login', {
        data: {
            user: {
                email: 'test@test.com',
                password: 'test123'
            }
        }
    });

    // Записываем запрос в коллектор
    let responseBody = {};
    try {
        responseBody = await response.json();
    } catch (e) {
        console.log('No response body or invalid JSON');
    }

    collector.recordRequest({
        method: 'POST',
        path: '/users/login',
        statusCode: response.status(),
        requestBody: {
            user: {
                email: 'test@test.com',
                password: 'test123'
            }
        },
        responseBody
    });

    // Выводим информацию о запросе для отладки
    console.log('Request URL:', response.url());
    console.log('\nRequest data:', {
        user: {
            email: 'test@test.com',
            password: 'test123'
        }
    });
    console.log('\nResponse status:', response.status());
    console.log('\nResponse headers:', response.headers());
    console.log('\nResponse text:', await response.text());

    // Генерируем отчет явно
    await apiCoverage.generateReport();
}); 