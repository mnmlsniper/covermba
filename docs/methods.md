# API Coverage Methods Documentation

## ApiCoverage Class

The main facade class that orchestrates the API coverage tracking process.

### Constructor

```javascript
new ApiCoverage(options)
```

#### Parameters
- `options` (Object):
  - `swaggerUrl` (String): URL to Swagger specification
  - `swaggerFile` (String): Path to local Swagger file
  - `outputDir` (String): Directory for reports (default: 'coverage')
  - `includeTags` (Array): Only track endpoints with these tags
  - `excludeTags` (Array): Exclude endpoints with these tags
  - `partialCoverageThreshold` (Number): Consider endpoint covered if this percentage of status codes is covered (default: 0.5)

### Methods

#### init()
Initializes the coverage tracking system.

```javascript
await apiCoverage.init();
```

#### recordRequest(request)
Records an API request for coverage tracking.

```javascript
apiCoverage.recordRequest({
  method: 'GET',
  path: '/api/users',
  statusCode: 200
});
```

#### generateReport()
Generates a coverage report.

```javascript
await apiCoverage.generateReport();
```

## SwaggerLoader Class

Handles loading and parsing of Swagger specifications.

### Methods

#### loadSpecification(urlOrPath)
Loads a Swagger specification from URL or file path.

```javascript
const spec = await swaggerLoader.loadSpecification('https://api.example.com/swagger.json');
```

#### parseEndpoints(spec)
Parses endpoints from Swagger specification.

```javascript
const endpoints = swaggerLoader.parseEndpoints(spec);
```

## RequestTracker Class

Manages API request recording and storage.

### Methods

#### record(request)
Records a single API request.

```javascript
requestTracker.record({
  method: 'GET',
  path: '/api/users',
  statusCode: 200,
  timestamp: Date.now()
});
```

#### getRequests()
Retrieves all recorded requests.

```javascript
const requests = requestTracker.getRequests();
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
  templatePath: './templates/report.ejs'
});
```

#### generateJSON(coverage, outputPath)
Generates a JSON report.

```javascript
await reportGenerator.generateJSON(coverage, 'coverage/coverage.json');
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

## Usage Examples

### Basic Usage

```javascript
import ApiCoverage from '@covermba/api-coverage';

const apiCoverage = new ApiCoverage({
  swaggerUrl: 'https://api.example.com/swagger.json',
  outputDir: 'coverage'
});

await apiCoverage.init();

// Record requests during tests
apiCoverage.recordRequest({
  method: 'GET',
  path: '/api/users',
  statusCode: 200
});

await apiCoverage.generateReport();
```

### With Playwright

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