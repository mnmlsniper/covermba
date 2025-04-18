# Интеграция с тестовыми фреймворками

## Playwright

### Базовая настройка

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
```

### Глобальная настройка

Для лучшей организации можно создать файл глобальной настройки:

```javascript
// playwright.config.js
module.exports = {
  globalSetup: './global-setup.js',
  // ... другие настройки
};

// global-setup.js
import ApiCoverage from '@covermba/api-coverage';

const apiCoverage = new ApiCoverage({
  swaggerUrl: 'https://api.example.com/swagger.json',
  outputDir: 'coverage'
});

await apiCoverage.init();

// Экспорт для использования в тестах
export { apiCoverage };
```

## Jest

### Базовая настройка

```javascript
import ApiCoverage from '@covermba/api-coverage';

let apiCoverage;

beforeAll(async () => {
  apiCoverage = new ApiCoverage({
    swaggerUrl: 'https://api.example.com/swagger.json',
    outputDir: 'coverage'
  });
  await apiCoverage.init();
});

test('должен отслеживать покрытие API', async () => {
  const response = await fetch('https://api.example.com/users');
  apiCoverage.recordRequest({
    method: 'GET',
    path: '/users',
    statusCode: response.status
  });
});

afterAll(async () => {
  await apiCoverage.generateReport();
});
```

### Глобальная настройка

```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['./jest.setup.js'],
  // ... другие настройки
};

// jest.setup.js
import ApiCoverage from '@covermba/api-coverage';

let apiCoverage;

beforeAll(async () => {
  apiCoverage = new ApiCoverage({
    swaggerUrl: 'https://api.example.com/swagger.json',
    outputDir: 'coverage'
  });
  await apiCoverage.init();
});

afterAll(async () => {
  await apiCoverage.generateReport();
});

// Экспорт для использования в тестах
export { apiCoverage };
```

## Mocha

### Базовая настройка

```javascript
import ApiCoverage from '@covermba/api-coverage';

describe('Тесты покрытия API', () => {
  let apiCoverage;

  before(async () => {
    apiCoverage = new ApiCoverage({
      swaggerUrl: 'https://api.example.com/swagger.json',
      outputDir: 'coverage'
    });
    await apiCoverage.init();
  });

  it('должен отслеживать покрытие API', async () => {
    const response = await fetch('https://api.example.com/users');
    apiCoverage.recordRequest({
      method: 'GET',
      path: '/users',
      statusCode: response.status
    });
  });

  after(async () => {
    await apiCoverage.generateReport();
  });
});
```

### Глобальная настройка

```javascript
// mocha.opts
--require ./mocha.setup.js

// mocha.setup.js
import ApiCoverage from '@covermba/api-coverage';

let apiCoverage;

before(async () => {
  apiCoverage = new ApiCoverage({
    swaggerUrl: 'https://api.example.com/swagger.json',
    outputDir: 'coverage'
  });
  await apiCoverage.init();
});

after(async () => {
  await apiCoverage.generateReport();
});

// Экспорт для использования в тестах
export { apiCoverage };
```

## Cypress

### Базовая настройка

```javascript
// cypress/support/e2e.js
import ApiCoverage from '@covermba/api-coverage';

let apiCoverage;

before(() => {
  apiCoverage = new ApiCoverage({
    swaggerUrl: 'https://api.example.com/swagger.json',
    outputDir: 'coverage'
  });
  return apiCoverage.init();
});

after(() => {
  return apiCoverage.generateReport();
});

// Пользовательская команда для записи запросов
Cypress.Commands.add('recordApiRequest', (request) => {
  apiCoverage.recordRequest(request);
});

// Пример использования
describe('Тесты покрытия API', () => {
  it('должен отслеживать покрытие API', () => {
    cy.request('GET', '/api/users').then((response) => {
      cy.recordApiRequest({
        method: 'GET',
        path: '/api/users',
        statusCode: response.status
      });
    });
  });
});
```

## Пользовательская интеграция

Если вы используете другой тестовый фреймворк или нужна пользовательская интеграция, вы можете создать свою настройку:

```javascript
import ApiCoverage from '@covermba/api-coverage';

class ApiCoveragePlugin {
  constructor(options) {
    this.apiCoverage = new ApiCoverage(options);
  }

  async setup() {
    await this.apiCoverage.init();
  }

  async teardown() {
    await this.apiCoverage.generateReport();
  }

  recordRequest(request) {
    this.apiCoverage.recordRequest(request);
  }
}

// Пример использования
const apiCoverage = new ApiCoveragePlugin({
  swaggerUrl: 'https://api.example.com/swagger.json',
  outputDir: 'coverage'
});

// Настройка перед тестами
await apiCoverage.setup();

// Запись запросов во время тестов
apiCoverage.recordRequest({
  method: 'GET',
  path: '/api/users',
  statusCode: 200
});

// Завершение после тестов
await apiCoverage.teardown();
```

## Лучшие практики

1. **Инициализация один раз**: Инициализируйте трекер покрытия один раз перед всеми тестами
2. **Генерация отчета один раз**: Генерируйте отчет один раз после всех тестов
3. **Запись всех запросов**: Записывайте все запросы API, включая случаи ошибок
4. **Используйте глобальную настройку**: Используйте специфичную для фреймворка глобальную настройку, когда это возможно
5. **Обработка асинхронных операций**: Обеспечьте правильную обработку асинхронных операций
6. **Очистка**: Очищайте временные файлы или ресурсы после тестов
7. **Обработка ошибок**: Реализуйте правильную обработку ошибок для отслеживания покрытия
8. **Конфигурация**: Используйте переменные окружения для конфигурации, когда это возможно 