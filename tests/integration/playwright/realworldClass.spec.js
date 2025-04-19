import { test, expect } from '@playwright/test';
import { ApiCoverage } from '../../../src/coverage/ApiCoverage.js';

class UsersService {
	constructor(request, apiCoverage) {
		this.request = request;
		this.apiCoverage = apiCoverage;
		this.baseUrl = 'https://realworld.qa.guru/api';
	}

	async login(data) {
		const requestData = {
			user: {
				email: data.email,
				password: data.password
			}
		};
		console.log('Request URL:', `${this.baseUrl}/users/login`);
		console.log('Request data:', JSON.stringify(requestData, null, 2));
		
		const response = await this.request.post(`${this.baseUrl}/users/login`, {
			data: requestData
		});
		
		console.log('Response status:', response.status());
		console.log('Response headers:', response.headers());
		const responseText = await response.text();
		console.log('Response text:', responseText);
		
		if (responseText) {
			const responseData = JSON.parse(responseText);
			this.apiCoverage.recordRequest({
				method: 'POST',
				path: '/users/login',
				status: response.status(),
				requestBody: requestData,
				responseBody: responseData
			});
		}
		
		return response;
	}
}

test.describe('RealWorld API Coverage', () => {
	let apiCoverage;
	let usersService;

	test.beforeAll(async () => {
		apiCoverage = new ApiCoverage({
			swaggerPath: 'tests/integration/playwright/swagger.json',
			outputDir: './coverage/realworldClass',
			generateHtmlReport: true
		});
		await apiCoverage.start();
	});

	test.afterAll(async () => {
		await apiCoverage.stop();
	});

	test('should track API coverage with login request - invalid credentials', async ({ request }) => {
		usersService = new UsersService(request, apiCoverage);
		const response = await usersService.login({
			email: 'test@test.com',
			password: 'test123'
		});

		expect(response.status()).toBe(422);
		const data = await response.json();
		expect(data.errors).toBeDefined();
		expect(data.errors.body).toContain('Wrong email/password combination');
	});
}); 

