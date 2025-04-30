# Опции конфигурации

## Обзор

API Coverage предоставляет различные опции конфигурации для настройки его поведения. Эти опции могут быть установлены при инициализации класса `ApiCoverage` или через переменные окружения.

## Опции конфигурации

### Базовые опции

| Опция | Тип | По умолчанию | Описание |
|--------|------|---------|-------------|
| `swaggerUrl` | string | - | URL спецификации Swagger |
| `swaggerFile` | string | - | Путь к локальному файлу Swagger |
| `baseUrl` | string | - | Базовый URL API |
| `basePath` | string | - | Базовый путь API (если не указан, будет извлечен из Swagger) |
| `outputDir` | string | 'coverage' | Директория для отчетов |
| `includeTags` | string[] | [] | Отслеживать только эндпоинты с этими тегами |
| `excludeTags` | string[] | [] | Исключить эндпоинты с этими тегами |
| `partialCoverageThreshold` | number | 0.5 | Считать эндпоинт покрытым, если покрыто столько процентов кодов статуса |

### Опции отчетов

| Опция | Тип | По умолчанию | Описание |
|--------|------|---------|-------------|
| `reportTitle` | string | 'API Coverage Report' | Заголовок генерируемого отчета |
| `reportDescription` | string | '' | Описание отчета |
| `reportTemplate` | string | 'default' | Шаблон для HTML-отчета |
| `generateJsonReport` | boolean | true | Генерировать ли JSON-отчет |
| `generateHtmlReport` | boolean | true | Генерировать ли HTML-отчет |

### Опции покрытия

| Опция | Тип | По умолчанию | Описание |
|--------|------|---------|-------------|
| `ignorePaths` | string[] | [] | Пути, которые игнорировать при расчете покрытия |
| `ignoreMethods` | string[] | [] | HTTP-методы, которые игнорировать при расчете покрытия |
| `ignoreStatusCodes` | number[] | [] | Коды статуса, которые игнорировать при расчете покрытия |
| `groupByService` | boolean | true | Группировать ли эндпоинты по сервисам |
| `minCoveragePercentage` | number | 0 | Минимальный процент покрытия для успешного прохождения тестов |

### Опции запросов

| Опция | Тип | По умолчанию | Описание |
|--------|------|---------|-------------|
| `recordRequestHeaders` | boolean | false | Записывать ли заголовки запросов |
| `recordResponseHeaders` | boolean | false | Записывать ли заголовки ответов |
| `recordRequestBody` | boolean | false | Записывать ли тело запроса |
| `recordResponseBody` | boolean | false | Записывать ли тело ответа |
| `maxRequestSize` | number | 1024 | Максимальный размер запроса/ответа для записи (в байтах) |

## Переменные окружения

Все опции конфигурации также могут быть установлены с помощью переменных окружения. Имена переменных окружения формируются из имен опций путем преобразования их в верхний регистр и замены точек на подчеркивания.

Пример:
```bash
# Установка URL Swagger
export API_COVERAGE_SWAGGER_URL=https://api.example.com/swagger.json

# Установка базового URL
export API_COVERAGE_BASE_URL=https://api.example.com

# Установка базового пути
export API_COVERAGE_BASE_PATH=/api/v1

# Установка директории для отчетов
export API_COVERAGE_OUTPUT_DIR=coverage

# Установка порога частичного покрытия
export API_COVERAGE_PARTIAL_COVERAGE_THRESHOLD=0.5
```

## Примеры конфигурации

### Базовая конфигурация

```javascript
const apiCoverage = new ApiCoverage({
    swaggerPath: 'https://api.example.com/swagger.json',
    baseUrl: 'https://api.example.com',
    basePath: '/api/v1',  // Опционально, будет извлечен из Swagger, если не указан
    outputDir: 'coverage',
    debug: true
});
```

### Конфигурация с несколькими сервисами

```javascript
const apiCoverage = new ApiCoverage({
    swaggerPath: [
        './swagger/user-service.json',
        './swagger/order-service.json'
    ],
    baseUrl: 'https://api.example.com',
    basePath: '/api/v1',  // Будет использоваться для всех сервисов
    outputDir: 'coverage',
    debug: true
});
```

### Пользовательский базовый путь

```javascript
const apiCoverage = new ApiCoverage({
    swaggerPath: './swagger.json',
    baseUrl: 'https://api.example.com',
    basePath: '/custom/path',  // Переопределяет basePath из Swagger
    outputDir: 'coverage',
    debug: true
});
```

## Лучшие практики

1. **Используйте переменные окружения**: Используйте переменные окружения для конфиденциальной или специфичной для окружения конфигурации
2. **Установите минимальное покрытие**: Установите минимальный процент покрытия для обеспечения качества
3. **Игнорируйте не-API эндпоинты**: Игнорируйте проверки здоровья, метрики и другие не-API эндпоинты
4. **Группируйте по сервисам**: Включите группировку по сервисам для лучшей организации
5. **Ограничьте сбор данных**: Записывайте только необходимые данные запроса/ответа для экономии места
6. **Используйте теги**: Используйте теги для организации и фильтрации эндпоинтов
7. **Установите разумные пороги**: Установите разумные пороги частичного покрытия в соответствии с вашими потребностями
8. **Документируйте конфигурацию**: Документируйте ваши выборы конфигурации для членов команды 