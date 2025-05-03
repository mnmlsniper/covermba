# Architecture

CoverMBA follows a modular architecture with clear separation of concerns. The main components are:

## Core Components

### ApiCoverage
The main facade class that orchestrates the coverage tracking process. It:
- Initializes and manages all other components
- Provides the public API for users
- Handles configuration and lifecycle management

### SwaggerLoader
Responsible for loading and parsing Swagger/OpenAPI specifications:
- Loads specifications from file or URL
- Validates the specification format
- Extracts endpoint definitions and schemas
- Maps paths and methods to operations

### RequestCollector
Manages the collection and storage of API requests:
- Collects request data during test execution
- Stores requests in memory and/or file system
- Provides methods for querying collected requests
- Handles request deduplication and aggregation

### CoverageCalculator
Calculates coverage metrics based on collected requests:
- Matches requests to API endpoints
- Calculates coverage percentages
- Identifies covered and uncovered endpoints
- Supports partial coverage calculation

### ReportGenerator
Generates various report formats:
- HTML reports with visual metrics
- JSON reports with detailed data
- Custom report formats
- Asset management for reports

## Integration Components

### Playwright Integration
Provides seamless integration with Playwright:
- Intercepts Playwright requests
- Collects request data automatically
- Supports different testing approaches:
  - Direct API calls
  - Page object model
  - Service layer
  - Class-based approach

### Request Interceptor
Handles request interception and modification:
- Intercepts HTTP requests
- Collects request and response data
- Supports request modification
- Handles different request types

## Support Components

### Logger
Provides logging functionality:
- Configurable log levels
- File and console output
- Structured logging
- Debug mode support

### Configuration
Manages configuration settings:
- Loads and validates configuration
- Provides default values
- Supports environment variables
- Handles configuration overrides

## Data Flow

1. **Initialization**:
   - ApiCoverage is initialized with configuration
   - SwaggerLoader loads and parses the specification
   - RequestCollector is set up for request collection

2. **Request Collection**:
   - Requests are intercepted during test execution
   - Request data is collected and stored
   - Requests are matched to API endpoints

3. **Coverage Calculation**:
   - CoverageCalculator processes collected requests
   - Coverage metrics are calculated
   - Coverage data is prepared for reporting

4. **Report Generation**:
   - ReportGenerator creates reports
   - Reports are saved to the output directory
   - Assets are copied to the output directory

## Directory Structure

```
src/
  coverage/
    ApiCoverage.js        # Main facade
    SwaggerLoader.js      # Swagger/OpenAPI handling
    RequestCollector.js   # Request collection
    CoverageCalculator.js # Coverage calculation
    ReportGenerator.js    # Report generation
  integration/
    playwright/          # Playwright integration
    request/            # Request interception
  support/
    logger.js           # Logging
    config.js           # Configuration
tests/
  integration/          # Integration tests
  unit/                # Unit tests
docs/
  architecture.md      # Architecture documentation
  configuration.md     # Configuration documentation
  integration.md       # Integration documentation
  methods.md           # API methods documentation
  reports.md           # Reports documentation
```

## Design Principles

1. **Modularity**: Each component has a single responsibility
2. **Extensibility**: Easy to add new integrations and report formats
3. **Configurability**: Flexible configuration options
4. **Testability**: Components are designed for easy testing
5. **Performance**: Efficient request collection and processing
6. **Maintainability**: Clear code structure and documentation 