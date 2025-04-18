# Configuration Options

## Overview

API Coverage provides various configuration options to customize its behavior. These options can be set when initializing the `ApiCoverage` class or through environment variables.

## Configuration Options

### Basic Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `swaggerUrl` | string | - | URL to Swagger specification |
| `swaggerFile` | string | - | Path to local Swagger file |
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

## Environment Variables

All configuration options can also be set using environment variables. The environment variable names are derived from the option names by converting them to uppercase and replacing dots with underscores.

Example:
```bash
# Set Swagger URL
export API_COVERAGE_SWAGGER_URL=https://api.example.com/swagger.json

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
  outputDir: 'coverage'
});
```

### Advanced Configuration

```javascript
const apiCoverage = new ApiCoverage({
  swaggerUrl: 'https://api.example.com/swagger.json',
  outputDir: 'coverage',
  includeTags: ['public', 'private'],
  excludeTags: ['deprecated'],
  partialCoverageThreshold: 0.5,
  reportTitle: 'My API Coverage Report',
  reportDescription: 'Coverage report for My API',
  ignorePaths: ['/health', '/metrics'],
  ignoreMethods: ['OPTIONS'],
  ignoreStatusCodes: [404],
  recordRequestHeaders: true,
  recordResponseHeaders: true,
  maxRequestSize: 2048
});
```

### Configuration with Environment Variables

```bash
# .env file
API_COVERAGE_SWAGGER_URL=https://api.example.com/swagger.json
API_COVERAGE_OUTPUT_DIR=coverage
API_COVERAGE_INCLUDE_TAGS=public,private
API_COVERAGE_EXCLUDE_TAGS=deprecated
API_COVERAGE_PARTIAL_COVERAGE_THRESHOLD=0.5
```

```javascript
// Load environment variables
require('dotenv').config();

const apiCoverage = new ApiCoverage();
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