# Документация по методам API Coverage

## Класс ApiCoverage

Основной фасадный класс, который управляет процессом отслеживания покрытия API.

### Конструктор

```javascript
new ApiCoverage(options)
```

#### Параметры
- `options` (Object):
  - `swaggerUrl` (String): URL спецификации Swagger
  - `swaggerFile` (String): Путь к локальному файлу Swagger
  - `outputDir` (String): Директория для отчетов (по умолчанию: 'coverage')
  - `includeTags` (Array): Отслеживать только эндпоинты с этими тегами
  - `excludeTags` (Array): Исключить эндпоинты с этими тегами
  - `partialCoverageThreshold` (Number): Считать эндпоинт покрытым, если покрыто столько процентов кодов статуса (по умолчанию: 0.5)

### Методы

#### init()
Инициализирует систему отслеживания покрытия.

```javascript
await apiCoverage.init();
```

#### recordRequest(request)
Записывает запрос API для отслеживания покрытия.

```javascript
apiCoverage.recordRequest({
  method: 'GET',
  path: '/api/users',
  statusCode: 200
});
```

#### generateReport()
Генерирует отчет о покрытии.

```javascript
await apiCoverage.generateReport();
```

## Класс SwaggerLoader

Обрабатывает загрузку и парсинг спецификаций Swagger.

### Методы

#### loadSpecification(urlOrPath)
Загружает спецификацию Swagger из URL или пути к файлу.

```javascript
const spec = await swaggerLoader.loadSpecification('https://api.example.com/swagger.json');
```

#### parseEndpoints(spec)
Парсит эндпоинты из спецификации Swagger.

```javascript
const endpoints = swaggerLoader.parseEndpoints(spec);
```

## Класс RequestTracker

Управляет записью и хранением запросов API.

### Методы

#### record(request)
Записывает один запрос API.

```javascript
requestTracker.record({
  method: 'GET',
  path: '/api/users',
  statusCode: 200,
  timestamp: Date.now()
});
```

#### getRequests()
Получает все записанные запросы.

```javascript
const requests = requestTracker.getRequests();
```

## Класс CoverageCalculator

Рассчитывает метрики покрытия на основе записанных запросов и спецификации Swagger.

### Методы

#### calculateCoverage(endpoints, requests)
Рассчитывает статистику покрытия.

```javascript
const coverage = coverageCalculator.calculateCoverage(endpoints, requests);
```

Возвращает:
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

## Класс ReportGenerator

Генерирует различные форматы отчетов.

### Методы

#### generateHTML(coverage, options)
Генерирует HTML-отчет.

```javascript
await reportGenerator.generateHTML(coverage, {
  outputDir: 'coverage',
  templatePath: './templates/report.ejs'
});
```

#### generateJSON(coverage, outputPath)
Генерирует JSON-отчет.

```javascript
await reportGenerator.generateJSON(coverage, 'coverage/coverage.json');
```

## Класс RequestCollector

Собирает запросы API во время выполнения тестов.

### Методы

#### collect(request)
Собирает один запрос.

```javascript
const collectedRequest = requestCollector.collect(request);
```

#### getRequests()
Получает все собранные запросы.

```javascript
const requests = requestCollector.getRequests();
```

## Примеры использования

### Базовое использование

```javascript
import ApiCoverage from '@covermba/api-coverage';

const apiCoverage = new ApiCoverage({
  swaggerUrl: 'https://api.example.com/swagger.json',
  outputDir: 'coverage'
});

await apiCoverage.init();

// Запись запросов во время тестов
apiCoverage.recordRequest({
  method: 'GET',
  path: '/api/users',
  statusCode: 200
});

await apiCoverage.generateReport();
```

### С Playwright

```javascript
import { test } from '@playwright/test';
import ApiCoverage from '@covermba/api-coverage';

test.describe('Тесты покрытия API', () => {
  let apiCoverage;

  test.beforeAll(async () => {
    apiCoverage = new ApiCoverage({
      swaggerUrl: 'https://api.example.com/swagger.json',
      outputDir: 'coverage'
    });
    await apiCoverage.init();
  });

  test('должен отслеживать покрытие API', async ({ request }) => {
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