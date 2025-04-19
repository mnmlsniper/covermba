# TODO List

## High Priority

- [ ] Implement global initialization of ApiCoverage through Playwright fixtures
  - Create a new fixtures/api-coverage.js file
  - Implement automatic lifecycle management
  - Add support for project-specific configurations
  - Update documentation with new initialization approach
  - Add examples of advanced usage
  - Benefits:
    - Single initialization point
    - Automatic lifecycle management
    - Project-specific configurations
    - Better integration with Playwright
    - Easier debugging
    - More flexible configuration

- [ ] Реализовать глобальную инициализацию ApiCoverage через фикстуры Playwright
  - Создать новый файл fixtures/api-coverage.js
  - Реализовать автоматическое управление жизненным циклом
  - Добавить поддержку конфигураций для разных проектов
  - Обновить документацию с новым подходом к инициализации
  - Добавить примеры продвинутого использования
  - Преимущества:
    - Единая точка инициализации
    - Автоматическое управление жизненным циклом
    - Конфигурации для конкретных проектов
    - Лучшая интеграция с Playwright
    - Упрощение отладки
    - Более гибкая конфигурация

## Medium Priority 

## Testing Tasks

### API Coverage Tests
- [ ] Write tests for different status codes in various states:
  - [ ] Success states (2xx)
    - [ ] 200 OK - Successful requests
    - [ ] 201 Created - Resource creation
    - [ ] 204 No Content - Successful deletion
  - [ ] Client Error states (4xx)
    - [ ] 400 Bad Request - Invalid input
    - [ ] 401 Unauthorized - Missing or invalid token
    - [ ] 403 Forbidden - Valid token but insufficient permissions
    - [ ] 404 Not Found - Resource doesn't exist
    - [ ] 422 Unprocessable Entity - Validation errors
  - [ ] Server Error states (5xx)
    - [ ] 500 Internal Server Error
    - [ ] 503 Service Unavailable

### Test Scenarios
- [ ] Authentication endpoints
  - [x] POST /users/login
    - [x] 200 - Successful login
    - [x] 401 - Invalid token
    - [x] 422 - Invalid credentials
  - [ ] POST /users/register
    - [ ] 201 - Successful registration
    - [ ] 422 - Validation errors
  - [ ] GET /user
    - [ ] 200 - Get current user
    - [ ] 401 - Unauthorized

- [ ] Article endpoints
  - [ ] GET /articles
    - [ ] 200 - List articles
    - [ ] 422 - Invalid query parameters
  - [ ] POST /articles
    - [ ] 201 - Create article
    - [ ] 401 - Unauthorized
    - [ ] 422 - Validation errors
  - [ ] PUT /articles/{slug}
    - [ ] 200 - Update article
    - [ ] 401 - Unauthorized
    - [ ] 403 - Not article owner
    - [ ] 404 - Article not found
    - [ ] 422 - Validation errors

### Test Coverage Improvements
- [ ] Add test data factories for common entities
- [ ] Add test helpers for common operations
- [ ] Add test cleanup after each test
- [ ] Add test setup for required test data
- [ ] Add negative test cases for each endpoint
- [ ] Add boundary test cases for validation
- [ ] Add performance test cases 