# Integration with Test Frameworks

## Playwright

### Basic Setup

```javascript
import { test } from '@playwright/test';
import ApiCoverage from '@covermba/api-coverage';

test.describe('API Coverage Tests', () => {
  let apiCoverage;

  test.beforeAll(async () => {
    apiCoverage = new ApiCoverage({
      swaggerUrl: 'https://api.example.com/swagger.json',
      outputDir: 'coverage'
    });
    await apiCoverage.init();
  });

  test('should track API coverage', async ({ request }) => {
    const response = await request.get('/api/users');
    apiCoverage.recordRequest({
      method: 'GET',
      path: '/api/users',
      statusCode: response.status()
    });
  });

  test.afterAll(async () => {
    await apiCoverage.generateReport();
  });
});
```

### Global Setup

For better organization, you can create a global setup file:

```javascript
// playwright.config.js
module.exports = {
  globalSetup: './global-setup.js',
  // ... other config
};

// global-setup.js
import ApiCoverage from '@covermba/api-coverage';

const apiCoverage = new ApiCoverage({
  swaggerUrl: 'https://api.example.com/swagger.json',
  outputDir: 'coverage'
});

await apiCoverage.init();

// Export for use in tests
export { apiCoverage };
```

## Jest

### Basic Setup

```javascript
import ApiCoverage from '@covermba/api-coverage';

let apiCoverage;

beforeAll(async () => {
  apiCoverage = new ApiCoverage({
    swaggerUrl: 'https://api.example.com/swagger.json',
    outputDir: 'coverage'
  });
  await apiCoverage.init();
});

test('should track API coverage', async () => {
  const response = await fetch('https://api.example.com/users');
  apiCoverage.recordRequest({
    method: 'GET',
    path: '/users',
    statusCode: response.status
  });
});

afterAll(async () => {
  await apiCoverage.generateReport();
});
```

### Global Setup

```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['./jest.setup.js'],
  // ... other config
};

// jest.setup.js
import ApiCoverage from '@covermba/api-coverage';

let apiCoverage;

beforeAll(async () => {
  apiCoverage = new ApiCoverage({
    swaggerUrl: 'https://api.example.com/swagger.json',
    outputDir: 'coverage'
  });
  await apiCoverage.init();
});

afterAll(async () => {
  await apiCoverage.generateReport();
});

// Export for use in tests
export { apiCoverage };
```

## Mocha

### Basic Setup

```javascript
import ApiCoverage from '@covermba/api-coverage';

describe('API Coverage Tests', () => {
  let apiCoverage;

  before(async () => {
    apiCoverage = new ApiCoverage({
      swaggerUrl: 'https://api.example.com/swagger.json',
      outputDir: 'coverage'
    });
    await apiCoverage.init();
  });

  it('should track API coverage', async () => {
    const response = await fetch('https://api.example.com/users');
    apiCoverage.recordRequest({
      method: 'GET',
      path: '/users',
      statusCode: response.status
    });
  });

  after(async () => {
    await apiCoverage.generateReport();
  });
});
```

### Global Setup

```javascript
// mocha.opts
--require ./mocha.setup.js

// mocha.setup.js
import ApiCoverage from '@covermba/api-coverage';

let apiCoverage;

before(async () => {
  apiCoverage = new ApiCoverage({
    swaggerUrl: 'https://api.example.com/swagger.json',
    outputDir: 'coverage'
  });
  await apiCoverage.init();
});

after(async () => {
  await apiCoverage.generateReport();
});

// Export for use in tests
export { apiCoverage };
```

## Cypress

### Basic Setup

```javascript
// cypress/support/e2e.js
import ApiCoverage from '@covermba/api-coverage';

let apiCoverage;

before(() => {
  apiCoverage = new ApiCoverage({
    swaggerUrl: 'https://api.example.com/swagger.json',
    outputDir: 'coverage'
  });
  return apiCoverage.init();
});

after(() => {
  return apiCoverage.generateReport();
});

// Custom command to record requests
Cypress.Commands.add('recordApiRequest', (request) => {
  apiCoverage.recordRequest(request);
});

// Example usage
describe('API Coverage Tests', () => {
  it('should track API coverage', () => {
    cy.request('GET', '/api/users').then((response) => {
      cy.recordApiRequest({
        method: 'GET',
        path: '/api/users',
        statusCode: response.status
      });
    });
  });
});
```

## Custom Integration

If you're using a different test framework or need custom integration, you can create your own setup:

```javascript
import ApiCoverage from '@covermba/api-coverage';

class ApiCoveragePlugin {
  constructor(options) {
    this.apiCoverage = new ApiCoverage(options);
  }

  async setup() {
    await this.apiCoverage.init();
  }

  async teardown() {
    await this.apiCoverage.generateReport();
  }

  recordRequest(request) {
    this.apiCoverage.recordRequest(request);
  }
}

// Usage example
const apiCoverage = new ApiCoveragePlugin({
  swaggerUrl: 'https://api.example.com/swagger.json',
  outputDir: 'coverage'
});

// Setup before tests
await apiCoverage.setup();

// Record requests during tests
apiCoverage.recordRequest({
  method: 'GET',
  path: '/api/users',
  statusCode: 200
});

// Teardown after tests
await apiCoverage.teardown();
```

## Best Practices

1. **Initialize Once**: Initialize the coverage tracker once before all tests
2. **Generate Report Once**: Generate the report once after all tests
3. **Record All Requests**: Record all API requests, including error cases
4. **Use Global Setup**: Use framework-specific global setup when possible
5. **Handle Async Operations**: Ensure proper handling of async operations
6. **Clean Up**: Clean up any temporary files or resources after tests
7. **Error Handling**: Implement proper error handling for coverage tracking
8. **Configuration**: Use environment variables for configuration when possible 