# Configuration Options

## Overview

API Coverage provides various configuration options to customize its behavior. These options can be set when initializing the `ApiCoverage` class or through environment variables.

## Configuration Options

### Basic Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `swaggerUrl` | string | - | URL to Swagger specification |
| `swaggerFile` | string | - | Path to local Swagger file |
| `baseUrl` | string | - | Base URL of your API |
| `basePath` | string | - | Base path of your API (if not specified, will be extracted from Swagger) |
| `outputDir` | string | 'coverage' | Directory for reports |
| `includeTags` | string[] | [] | Only track endpoints with these tags |
| `excludeTags` | string[] | [] | Exclude endpoints with these tags |
| `partialCoverageThreshold` | number | 0.5 | Consider endpoint covered if this percentage of status codes is covered |

### Report Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `reportTitle` | string | 'API Coverage Report' | Title of the generated report |
| `reportDescription` | string | '' | Description of the report |
| `reportTemplate` | string | 'default' | Template to use for HTML report |
| `generateJsonReport` | boolean | true | Whether to generate JSON report |
| `generateHtmlReport` | boolean | true | Whether to generate HTML report |
| `debug` | boolean | false | Enable debug logging |

### Coverage Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ignorePaths` | string[] | [] | Paths to ignore in coverage calculation |
| `ignoreMethods` | string[] | [] | HTTP methods to ignore in coverage calculation |
| `ignoreStatusCodes` | number[] | [] | Status codes to ignore in coverage calculation |
| `groupByService` | boolean | true | Whether to group endpoints by service |
| `minCoveragePercentage` | number | 0 | Minimum coverage percentage to consider tests passing |

### Request Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `recordRequestHeaders` | boolean | false | Whether to record request headers |
| `recordResponseHeaders` | boolean | false | Whether to record response headers |
| `recordRequestBody` | boolean | false | Whether to record request body |
| `recordResponseBody` | boolean | false | Whether to record response body |
| `maxRequestSize` | number | 1024 | Maximum size of request/response to record (in bytes) |
| `collectorOptions` | object | {} | Options for RequestCollector |
  - `extractPathFromUrl` | boolean | false | Whether to extract path from URL by removing baseUrl |
  - `transformRequest` | function | null | Function to transform request before recording |
  - `onRequest` | function | null | Callback when a request is collected |

## Environment Variables

All configuration options can also be set using environment variables. The environment variable names are derived from the option names by converting them to uppercase and replacing dots with underscores.

Example:
```bash
# Set Swagger URL
export API_COVERAGE_SWAGGER_URL=https://api.example.com/swagger.json

# Set base URL
export API_COVERAGE_BASE_URL=https://api.example.com

# Set base path
export API_COVERAGE_BASE_PATH=/api/v1

# Set output directory
export API_COVERAGE_OUTPUT_DIR=coverage

# Set partial coverage threshold
export API_COVERAGE_PARTIAL_COVERAGE_THRESHOLD=0.5
```

## Configuration Examples

### Basic Configuration

```javascript
const apiCoverage = new ApiCoverage({
    swaggerUrl: 'https://api.example.com/swagger.json',
    baseUrl: 'https://api.example.com',
    outputDir: './coverage'
});
```

### Advanced Configuration

```javascript
const apiCoverage = new ApiCoverage({
    swaggerUrl: 'https://api.example.com/swagger.json',
    baseUrl: 'https://api.example.com',
    outputDir: './coverage',
    reportTitle: 'API Coverage Report',
    generateHtmlReport: true,
    debug: true,
    ignorePaths: ['/health', '/metrics'],
    minCoveragePercentage: 80,
    recordRequestHeaders: true,
    maxRequestSize: 1024 * 1024, // 1MB
    collectorOptions: {
        extractPathFromUrl: true,
        transformRequest: (request) => {
            // Transform request before recording
            return request;
        },
        onRequest: (request) => {
            // Handle collected request
            console.log('Request collected:', request);
        }
    }
});
```

### Multiple Services Configuration

```javascript
const apiCoverage = new ApiCoverage({
    swaggerPath: [
        './swagger/user-service.json',
        './swagger/order-service.json'
    ],
    baseUrl: 'https://api.example.com',
    basePath: '/api/v1',  // Will be used for all services
    outputDir: 'coverage',
    debug: true
});
```

### Custom Base Paths

```javascript
const apiCoverage = new ApiCoverage({
    swaggerPath: './swagger.json',
    baseUrl: 'https://api.example.com',
    basePath: '/custom/path',  // Override basePath from Swagger
    outputDir: 'coverage',
    debug: true
});
```

## Best Practices

1. **Use Environment Variables**: Use environment variables for sensitive or environment-specific configuration
2. **Set Minimum Coverage**: Set a minimum coverage percentage to ensure quality
3. **Ignore Non-API Endpoints**: Ignore health checks, metrics, and other non-API endpoints
4. **Group by Service**: Enable service grouping for better organization
5. **Limit Data Collection**: Only record necessary request/response data to save space
6. **Use Tags**: Use tags to organize and filter endpoints
7. **Set Reasonable Thresholds**: Set reasonable partial coverage thresholds based on your needs
8. **Document Configuration**: Document your configuration choices for team members
9. **Always set `baseUrl`**: Ensure correct path extraction
10. **Use `ignorePaths`**: For endpoints that don't need coverage
11. **Enable `debug`**: During development to troubleshoot issues
12. **Set appropriate `maxRequestSize`**: Avoid memory issues
13. **Use `collectorOptions`**: Customize request collection behavior 