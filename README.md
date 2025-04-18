# API Coverage

[![npm version](https://badge.fury.io/js/api-coverage.svg)](https://badge.fury.io/js/api-coverage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Библиотека для отслеживания покрытия API тестами на основе Swagger/OpenAPI спецификации.

## Установка

```bash
npm install api-coverage
```

## Основные компоненты

### RequestCollector
Сборщик запросов для анализа покрытия API. Перехватывает HTTP запросы и собирает информацию о них.

```javascript
import { RequestCollector } from './src/collector/RequestCollector.js';

const collector = new RequestCollector();
const collectedRequest = collector.collect(request);

// Использование проксированного request
const response = await collectedRequest.post('/api/endpoint', {
  data: { key: 'value' }
});

// Получение собранных запросов
const requests = collector.getRequests();
```

### ApiCoverage
Анализатор покрытия API. Сравнивает реальные запросы с ожидаемыми из Swagger спецификации.

```javascript
import { ApiCoverage } from './src/index.js';

const apiCoverage = new ApiCoverage({
  swaggerPath: 'path/to/swagger.yaml',
  baseUrl: 'https://api.example.com',
  debug: true,
  outputDir: 'coverage'
});

// Запуск анализатора
await apiCoverage.start();

// Запись запроса для анализа
apiCoverage.recordRequest({
  method: 'POST',
  path: '/api/endpoint',
  statusCode: 200,
  queryParams: {},
  headers: {},
  body: {}
});

// Остановка анализатора и генерация отчета
await apiCoverage.stop();
```

## Интеграция с Playwright

### Использование в сервисах
```javascript
import { RequestCollector } from './src/collector/RequestCollector.js';

export class ApiService {
  constructor(request) {
    this.collector = new RequestCollector();
    this.request = this.collector.collect(request);
  }

  async makeRequest() {
    const response = await this.request.post('/api/endpoint', {
      data: { key: 'value' }
    });
    return response;
  }

  getCollectedRequests() {
    return this.collector.getRequests();
  }
}
```

### Использование в тестах
```javascript
import { test } from '@playwright/test';
import { ApiCoverage } from './src/index.js';
import { ApiService } from './services/api.service.js';

test.describe('API Tests', () => {
  let apiCoverage;

  test.beforeAll(async () => {
    apiCoverage = new ApiCoverage({
      swaggerPath: 'path/to/swagger.yaml',
      baseUrl: 'https://api.example.com',
      debug: true,
      outputDir: 'coverage'
    });
    await apiCoverage.start();
  });

  test.afterAll(async () => {
    await apiCoverage.stop();
  });

  test('test case', async ({ request }) => {
    const apiService = new ApiService(request);
    const response = await apiService.makeRequest();

    // Запись запросов для анализа покрытия
    const requests = apiService.getCollectedRequests();
    requests.forEach(req => {
      apiCoverage.recordRequest(req);
    });

    // Проверки
    expect(response.status()).toBe(200);
  });
});
```

## Отчет о покрытии

После выполнения тестов генерируется HTML отчет, который включает:
- Общую статистику покрытия
- Покрытие по сервисам
- Детальную информацию по каждому эндпоинту
- Список непокрытых эндпоинтов
- Статистику по статус кодам

Отчет сохраняется в директории, указанной в `outputDir`.

## Конфигурация

```javascript
{
  swaggerPath: string | string[],  // Путь к Swagger файлу или массив путей
  baseUrl: string,                 // Базовый URL API
  debug: boolean,                  // Включить отладочный вывод
  outputDir: string,               // Директория для отчетов
  ignorePaths: string[],          // Регулярные выражения для игнорирования путей
  logFile: string,                // Путь к файлу логов
  logLevel: 'none' | 'debug' | 'info' | 'warn' | 'error'  // Уровень логирования
}
```

## Разработка

### Структура проекта
```
demo/
├── src/
│   ├── collector/
│   │   └── RequestCollector.js    # Сборщик запросов
│   ├── coverage/
│   │   └── ApiCoverage.js         # Анализатор покрытия
│   └── index.js                   # Точка входа
├── package.json
└── README.md
```

### Установка зависимостей
```bash
npm install
```

### Запуск тестов
```bash
npm test
```

## API

### ApiCoverage

Основной класс для отслеживания покрытия API.

#### Конструктор
```javascript
new ApiCoverage(options)
```
- `options` - объект конфигурации:
  - `swaggerPath` - путь к Swagger спецификации
  - `baseUrl` - базовый URL API
  - `debug` - включить отладочный режим
  - `outputDir` - директория для сохранения результатов
  - `logLevel` - уровень логирования
  - `logFile` - файл для сохранения логов

#### Методы
- `start()` - инициализация покрытия
- `stop()` - завершение работы и сохранение результатов
- `recordRequest(request)` - запись запроса в покрытие

### TestReporter

Декоратор для перехвата и логирования HTTP-запросов в тестах.

#### Использование
```javascript
import { withTestReporter } from 'api-coverage';

test('your test', withTestReporter(async ({ request }) => {
    // Ваш тест
}));
```

## Отладка

Для отладки включите режим отладки в конфигурации:
```javascript
debug: true,
logLevel: 'debug'
```

## Лицензия

MIT

## Authors

- **AI Assistant** - *Initial implementation* - [Cursor AI](https://cursor.sh)
- **Sniper** - *Architect & Inspiration* - [GitHub](https://github.com/sniper) 