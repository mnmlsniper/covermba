# CoverMBA

CoverMBA - это мощный инструмент для отслеживания покрытия API тестами. Он легко интегрируется с Playwright и другими фреймворками для тестирования, предоставляя детальные отчеты о покрытии.

## Возможности

- **Интеграция со Swagger/OpenAPI**: Автоматически загружает и парсит спецификации Swagger/OpenAPI
- **Отслеживание запросов**: Собирает и анализирует HTTP-запросы, выполняемые во время тестов
- **Отчеты о покрытии**: Генерирует детальные HTML и JSON отчеты
- **Различные подходы к тестированию**: Поддерживает разные подходы к тестированию:
  - Прямые вызовы API
  - Page object model
  - Сервисный слой
  - Классовый подход
- **Режим отладки**: Подробное логирование для отладки
- **Настраиваемый вывод**: Конфигурация директорий и форматов отчетов

## Установка

```bash
npm install covermba
```

## Быстрый старт

1. Импортируйте и инициализируйте CoverMBA в настройках тестов:

```javascript
import { ApiCoverage } from 'covermba';

const apiCoverage = new ApiCoverage({
    swaggerPath: 'путь/к/swagger.json',
    baseUrl: 'https://api.example.com',
    outputDir: './coverage',
    generateHtmlReport: true,
    debug: true
});

await apiCoverage.start();
```

2. Отслеживайте API-запросы в тестах:

```javascript
// Прямые вызовы API
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

// Сервисный слой
const userService = new UserService(request, apiCoverage);
await userService.createUser({ name: 'John' });

// Классовый подход
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

3. Генерируйте отчеты:

```javascript
await apiCoverage.generateReport();
await apiCoverage.stop();
```

## Параметры конфигурации

```javascript
{
    swaggerPath: 'путь/к/swagger.json',  // Путь к спецификации Swagger/OpenAPI
    baseUrl: 'https://api.example.com',  // Базовый URL вашего API
    basePath: '/api',                    // Базовый путь API
    outputDir: './coverage',             // Директория для отчетов
    generateHtmlReport: true,            // Генерировать HTML отчет
    debug: false,                        // Включить режим отладки
    logLevel: 'info',                    // Уровень логирования
    logFile: 'coverage.log'              // Путь к файлу логов
}
```

## Структура отчетов

CoverMBA генерирует следующие файлы в выходной директории:

- `coverage.html`: HTML отчет с визуальными метриками покрытия
- `coverage.json`: JSON отчет с детальными данными о покрытии
- `requests.json`: Список всех отслеженных API-запросов
- `assets/`: Статические ресурсы для HTML отчета

## Примеры

Ознакомьтесь с директорией `tests/integration/playwright` для полных примеров:

- `apichallenges.spec.js`: Прямые вызовы API
- `realworld.spec.js`: Page object model
- `realworld3level.spec.js`: Сервисный слой
- `realworldClass.spec.js`: Классовый подход

## Участие в проекте

Приветствуются любые вклады в проект! Пожалуйста, ознакомьтесь с нашим [Руководством по участию](CONTRIBUTING.md) для получения подробной информации.

## Лицензия

Этот проект распространяется под лицензией MIT - подробности в файле [LICENSE](LICENSE). 