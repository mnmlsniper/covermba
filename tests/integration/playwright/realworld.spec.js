import { test, expect } from '@playwright/test';
import { ApiCoverage } from '../../../src/coverage/ApiCoverage.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let apiCoverage;

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
    
    let responseBody = {};
    try {
        responseBody = await response.json();
    } catch (e) {
        // Ignore error
    }

    const status = response.status();

    apiCoverage.collector.collect({
        method: 'POST',
        url: 'https://realworld.qa.guru/api/users/login',
        statusCode: status,
        postData: {
            user: {
                email: 'test@example.com',
                password: 'password123'
            }
        },
        responseBody
    });
    
    expect(status).toBe(200);
    const responseData = responseBody;
    expect(responseData.user).toBeDefined();
    expect(responseData.user.email).toBeDefined();
    expect(responseData.user.token).toBeDefined();
    expect(responseData.user.username).toBeDefined();
    expect(responseData.user.bio).toBeDefined();
    expect(responseData.user.image).toBeDefined();
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

    let responseBody = {};
    try {
        responseBody = await response.json();
    } catch (e) {
        // Ignore error
    }

    const status = response.status();

    apiCoverage.collector.collect({
        method: 'POST',
        url: 'https://realworld.qa.guru/api/users/login',
        statusCode: status,
        postData: {
            user: {
                email: 'test@test.com',
                password: 'test123'
            }
        },
        responseBody
    });

    expect(status).toBe(422);
}); 