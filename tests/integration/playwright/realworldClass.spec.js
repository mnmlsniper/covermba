const { test, expect } = require('@playwright/test');
const { ApiCoverage } = require('../../api-coverage');
const path = require('path');

class UsersService {
	constructor(request) {
		this.request = request;
	}

	async login(email, password) {
		const requestData = {
			data: {
				user: {
					email,
					password
				}
			}
		};
		const response = await this.request.post('/users/login', {
			data: requestData
		});
		if (!response.ok()) {
			throw new Error(`Login failed with status ${response.status()}`);
		}
		return response;
	}
}

test.describe('RealWorld API Coverage', () => {
	let apiCoverage;

	test.beforeEach(async ({ request }) => {
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

	test.afterEach(async () => {
		await apiCoverage.stop();
	});

	test('should track API coverage with login request', async ({ request }) => {
		const usersService = new UsersService(request);
		const response = await usersService.login('eve.holt@reqres.in', 'cityslicka');
		expect(response.ok()).toBeTruthy();
		const responseData = await response.json();
		expect(responseData.user).toBeDefined();
		expect(responseData.user.email).toBeDefined();
	});
}); 

