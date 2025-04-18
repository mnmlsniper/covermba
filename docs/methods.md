# API Coverage Methods Documentation

## ApiCoverage Class

The main facade class that orchestrates the API coverage tracking process.

### Constructor

```javascript
new ApiCoverage(options)
```

#### Parameters
- `options` (Object):
  - `swaggerPath` (String): Path to Swagger specification file
  - `baseUrl` (String): Base URL of the API
  - `basePath` (String): Base path of the API (if not specified, will be extracted from Swagger)
  - `outputDir` (String): Directory for reports (default: 'coverage')
  - `title` (String): Title of the coverage report
  - `debug` (Boolean): Enable debug logging
  - `generateHtmlReport` (Boolean): Whether to generate HTML report

### Methods

#### start()
Initializes and starts the coverage tracking system.

```javascript
await apiCoverage.start();
```

#### stop()
Stops the coverage tracking and generates reports.

```javascript
await apiCoverage.stop();
```

## SwaggerLoader Class

Handles loading and parsing of Swagger specifications.

### Methods

#### loadSpecification(path)
Loads a Swagger specification from file path.

```javascript
const spec = await swaggerLoader.loadSpecification('./swagger.json');
```

#### parseEndpoints(spec)
Parses endpoints from Swagger specification.

```javascript
const endpoints = swaggerLoader.parseEndpoints(spec);
```

## RequestCollector Class

Collects API requests during test execution.

### Methods

#### collect(request)
Collects a single request.

```javascript
const collectedRequest = requestCollector.collect(request);
```

#### getRequests()
Retrieves all collected requests.

```javascript
const requests = requestCollector.getRequests();
```

## CoverageCalculator Class

Calculates coverage metrics based on recorded requests and Swagger specification.

### Methods

#### calculateCoverage(endpoints, requests)
Calculates coverage statistics.

```javascript
const coverage = coverageCalculator.calculateCoverage(endpoints, requests);
```

Returns:
```javascript
{
  totalEndpoints: number,
  coveredEndpoints: number,
  partialEndpoints: number,
  missingEndpoints: number,
  coveragePercentage: number,
  endpoints: [
    {
      path: string,
      method: string,
      status: 'covered' | 'partial' | 'missing',
      requests: Array<Request>,
      expectedStatusCodes: Array<number>
    }
  ]
}
```

## ReportGenerator Class

Generates various report formats.

### Methods

#### generateHTML(coverage, options)
Generates an HTML report.

```javascript
await reportGenerator.generateHTML(coverage, {
  outputDir: 'coverage',
  title: 'API Coverage Report'
});
```

#### generateJSON(coverage, outputPath)
Generates a JSON report.

```javascript
await reportGenerator.generateJSON(coverage, 'coverage/coverage.json');
```

## Usage Examples

### Basic Usage

```javascript
import ApiCoverage from '@covermba/api-coverage';

const apiCoverage = new ApiCoverage({
  swaggerPath: './swagger.json',
  baseUrl: 'https://api.example.com',
  basePath: '/api',
  outputDir: 'coverage',
  title: 'API Coverage Report',
  generateHtmlReport: true
});

await apiCoverage.start();
// ... run tests ...
await apiCoverage.stop();
```

### With Playwright

```javascript
import { test } from '@playwright/test';
import ApiCoverage from '@covermba/api-coverage';

test.describe('API Coverage Tests', () => {
  let apiCoverage;

  test.beforeEach(async ({ request }) => {
    apiCoverage = new ApiCoverage({
      swaggerPath: './swagger.json',
      baseUrl: 'https://api.example.com',
      basePath: '/api',
      outputDir: 'coverage',
      title: 'API Coverage Report',
      generateHtmlReport: true
    });
    await apiCoverage.start();
  });

  test('should track API coverage', async ({ request }) => {
    const response = await request.get('/api/users');
    expect(response.ok()).toBeTruthy();
  });

  test.afterEach(async () => {
    await apiCoverage.stop();
  });
});
``` 