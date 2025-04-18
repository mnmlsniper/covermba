# Cover MBA

Библиотека для отслеживания покрытия API тестами с использованием Playwright.

## Возможности

- Автоматическое определение эндпоинтов из Swagger/OpenAPI спецификации
- Отслеживание запросов в реальном времени
- Генерация отчетов о покрытии
- Поддержка различных форматов спецификаций
- Интеграция с Playwright

## Установка

```bash
npm install cover-mba
```

## Использование

### Базовый пример

```javascript
import { ApiCoverage, RequestCollector } from 'cover-mba';

const apiCoverage = new ApiCoverage({
    swaggerPath: 'path/to/swagger.json',
    baseUrl: 'https://api.example.com',
    debug: true,
    outputDir: 'coverage'
});

const collector = new RequestCollector();

// Запуск отслеживания
await apiCoverage.start();

// Сбор запросов
const request = collector.collect({
    method: 'GET',
    url: 'https://api.example.com/users',
    path: '/users',
    statusCode: 200
});

// Запись запроса в покрытие
apiCoverage.recordRequest({
    method: request.method,
    path: request.path,
    statusCode: request.statusCode,
    service: 'users'
});

// Остановка и получение результатов
const coverage = await apiCoverage.stop();
console.log(coverage);
```

### Пример с Playwright

```javascript
import { test, expect } from '@playwright/test';
import { ApiCoverage, RequestCollector } from 'cover-mba';

test.describe('API Coverage Tests', () => {
    let apiCoverage;
    let collector;

    test.beforeAll(async () => {
        apiCoverage = new ApiCoverage({
            swaggerPath: 'https://apichallenges.herokuapp.com/docs/swagger',
            baseUrl: 'https://apichallenges.herokuapp.com',
            debug: false,
            outputDir: 'coverage-test',
            logLevel: 'debug',
            logFile: 'coverage-test/coverage.log'
        });

        collector = new RequestCollector();
        await apiCoverage.start();
    });

    test('should track API coverage', async ({ request }) => {
        try {
            // 1. Создаем новую сессию
            const challengerResponse = await collector.collect(
                request.post('https://apichallenges.herokuapp.com/challenger')
            );
            expect(challengerResponse.status()).toBe(201);
            
            const challengerId = challengerResponse.headers()['x-challenger'];
            expect(challengerId).toBeDefined();

            // 2. Получаем список задач
            const challengesResponse = await collector.collect(
                request.get('https://apichallenges.herokuapp.com/challenges', {
                    headers: {
                        'x-challenger': challengerId
                    }
                })
            );
            expect(challengesResponse.status()).toBe(200);

            // Записываем запросы в покрытие
            const requests = collector.getRequests();
            requests.forEach(request => {
                apiCoverage.recordRequest({
                    method: request.method,
                    path: request.path,
                    statusCode: request.statusCode,
                    service: 'challenges'
                });
            });

            // Проверяем результаты
            const coverage = await apiCoverage.stop();
            
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

## Формат отчета

Отчет о покрытии содержит следующую информацию:

```javascript
{
    totalEndpoints: number,      // Общее количество эндпоинтов
    coveredEndpoints: number,    // Количество покрытых эндпоинтов
    coveragePercentage: number,  // Процент покрытия
    endpoints: [                 // Детальная информация по каждому эндпоинту
        {
            path: string,        // Путь эндпоинта
            method: string,      // HTTP метод
            covered: boolean,    // Покрыт ли тестами
            lastRequested: string // Время последнего запроса
        }
    ]
}
```

## Требования

- Node.js >= 16
- Playwright >= 1.52.0

## Лицензия

MIT

## Возможности

- Автоматическое определение всех эндпоинтов из Swagger/OpenAPI спецификации
- Отслеживание вызовов API во время выполнения тестов
- Поддержка различных HTTP методов (GET, POST, PUT, DELETE и т.д.)
- Отслеживание статус кодов ответов
- Генерация HTML отчета о покрытии
- Поддержка как синхронных, так и асинхронных запросов
- Поддержка различных тестовых фреймворков (Jest, AVA, Playwright)

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
            debug: false,
            outputDir: 'coverage-test',
            logLevel: 'debug',
            logFile: 'coverage-test/coverage.log'
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

## Authors

- **AI Assistant** - *Initial implementation* - [Cursor AI](https://cursor.sh)
- **Sniper** - *Architect & Inspiration* - [GitHub](https://github.com/sniper) 