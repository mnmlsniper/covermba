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
		
		const response = await this.request.post(`${this.baseUrl}/users/login`, {
			data: requestData
		});
		
		const responseText = await response.text();
		
		if (responseText) {
			const responseData = JSON.parse(responseText);
			this.apiCoverage.collector.collect({
				method: 'POST',
				url: `${this.baseUrl}/users/login`,
				statusCode: response.status(),
				postData: requestData,
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
			generateHtmlReport: true,
			debug: false,

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

