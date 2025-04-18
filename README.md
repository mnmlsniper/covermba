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
import { ApiCoverage } from './src/coverage/ApiCoverage.js';

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

### Базовый пример использования
```javascript
import { test, expect } from '@playwright/test';
import { ApiCoverage } from './src/coverage/ApiCoverage.js';
import { RequestCollector } from './src/collector/RequestCollector.js';

test.describe('API Coverage Tests', () => {
    let apiCoverage;
    let collector;

    test.beforeAll(async () => {
        // Инициализируем API coverage
        apiCoverage = new ApiCoverage({
            swaggerPath: 'https://petstore.swagger.io/v2/swagger.json',
            baseUrl: 'https://petstore.swagger.io/v2',
            debug: true,
            outputDir: 'coverage-test'
        });

        // Инициализируем сборщик запросов
        collector = new RequestCollector();

        // Запускаем отслеживание
        await apiCoverage.start();
    });

    test.afterAll(async () => {
        // Останавливаем отслеживание и получаем отчет
        await apiCoverage.stop();
    });

    test('should track API coverage in basic test scenario', async ({ page }) => {
        try {
            // Перехватываем запросы
            page.on('request', request => {
                const url = new URL(request.url());
                if (url.origin === 'https://petstore.swagger.io') {
                    collector.collect(request);
                }
            });

            page.on('response', response => {
                const url = new URL(response.url());
                if (url.origin === 'https://petstore.swagger.io') {
                    const request = response.request();
                    collector.collect(request);
                }
            });

            // Выполняем тестовые запросы
            await page.goto('https://petstore.swagger.io/v2/pet/1');
            await expect(page).toHaveTitle('Swagger UI');

            // Записываем запросы в покрытие
            const requests = collector.getRequests();
            requests.forEach(request => {
                apiCoverage.recordRequest({
                    method: request.method(),
                    path: new URL(request.url()).pathname,
                    statusCode: request.response()?.status() || 200
                });
            });

            // Проверяем результаты
            const coverage = await apiCoverage.getCoverage();
            expect(coverage).toBeTruthy();
            expect(coverage.totalEndpoints).toBeGreaterThan(0);
            expect(coverage.coveredEndpoints).toBeGreaterThan(0);
            expect(coverage.coveragePercentage).toBeGreaterThan(0);

        } catch (error) {
            throw new Error(`Test failed: ${error.message}`);
        }
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
src/
├── collector/
│   └── RequestCollector.js    # Сборщик запросов
├── coverage/
│   └── ApiCoverage.js         # Анализатор покрытия
├── __tests__/
│   ├── api.test.js            # Базовые тесты
│   └── api-coverage.spec.js   # Тесты с Playwright
└── index.js                   # Точка входа
```

### Установка зависимостей
```bash
npm install
```

### Запуск тестов
```bash
# Запуск всех тестов
npm test

# Запуск тестов с Playwright
npx playwright test src/__tests__/api-coverage.spec.js
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
- `getCoverage()` - получение текущей статистики покрытия

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