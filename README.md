# CoverMBA

CoverMBA is a powerful API coverage tracking tool that helps you monitor and analyze your API test coverage. It integrates seamlessly with Playwright and other testing frameworks to provide detailed coverage reports.

## Features

- **Swagger/OpenAPI Integration**: Automatically loads and parses Swagger/OpenAPI specifications
- **Request Tracking**: Collects and analyzes HTTP requests made during tests
- **Coverage Reports**: Generates detailed HTML and JSON reports
- **Multiple Test Types**: Supports different testing approaches:
  - Direct API calls
  - Page object model
  - Service layer
  - Class-based approach
- **Debug Mode**: Detailed logging for troubleshooting
- **Customizable Output**: Configure output directories and report formats

## Installation

```bash
npm install covermba
```

## Quick Start

1. Import and initialize CoverMBA in your test setup:

```javascript
import { ApiCoverage } from 'covermba';

const apiCoverage = new ApiCoverage({
    swaggerPath: 'path/to/swagger.json',
    baseUrl: 'https://api.example.com',
    outputDir: './coverage',
    generateHtmlReport: true,
    debug: true
});

await apiCoverage.start();
```

2. Track API requests in your tests:

```javascript
// Direct API calls
const response = await request.post('https://api.example.com/users', {
    data: { name: 'John' }
});

apiCoverage.collector.collect({
    method: 'POST',
    url: 'https://api.example.com/users',
    statusCode: response.status(),
    postData: { name: 'John' },
    responseBody: await response.json()
});

// Service layer
const userService = new UserService(request, apiCoverage);
await userService.createUser({ name: 'John' });

// Class-based approach
class UserService {
    constructor(request, apiCoverage) {
        this.request = request;
        this.apiCoverage = apiCoverage;
    }

    async createUser(data) {
        const response = await this.request.post('https://api.example.com/users', {
            data
        });
        
        this.apiCoverage.collector.collect({
            method: 'POST',
            url: 'https://api.example.com/users',
            statusCode: response.status(),
            postData: data,
            responseBody: await response.json()
        });
        
        return response;
    }
}
```

3. Generate reports:

```javascript
await apiCoverage.generateReport();
await apiCoverage.stop();
```

## Configuration Options

```javascript
{
    swaggerPath: 'path/to/swagger.json',  // Path to Swagger/OpenAPI spec
    baseUrl: 'https://api.example.com',   // Base URL of your API
    basePath: '/api',                     // Base path of your API
    outputDir: './coverage',              // Directory for reports
    generateHtmlReport: true,             // Generate HTML report
    debug: false,                         // Enable debug mode
    logLevel: 'info',                     // Log level
    logFile: 'coverage.log'               // Log file path
}
```

## Report Structure

CoverMBA generates the following files in the output directory:

- `coverage.html`: HTML report with visual coverage metrics
- `coverage.json`: JSON report with detailed coverage data
- `requests.json`: List of all tracked API requests
- `assets/`: Static resources for the HTML report

## Examples

Check out the `tests/integration/playwright` directory for complete examples:

- `apichallenges.spec.js`: Direct API calls
- `realworld.spec.js`: Page object model
- `realworld3level.spec.js`: Service layer
- `realworldClass.spec.js`: Class-based approach

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 