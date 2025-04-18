# Опции конфигурации

## Обзор

API Coverage предоставляет различные опции конфигурации для настройки его поведения. Эти опции могут быть установлены при инициализации класса `ApiCoverage` или через переменные окружения.

## Опции конфигурации

### Базовые опции

| Опция | Тип | По умолчанию | Описание |
|--------|------|---------|-------------|
| `swaggerUrl` | string | - | URL спецификации Swagger |
| `swaggerFile` | string | - | Путь к локальному файлу Swagger |
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

# Установка директории для отчетов
export API_COVERAGE_OUTPUT_DIR=coverage

# Установка порога частичного покрытия
export API_COVERAGE_PARTIAL_COVERAGE_THRESHOLD=0.5
```

## Примеры конфигурации

### Базовая конфигурация

```javascript
const apiCoverage = new ApiCoverage({
  swaggerUrl: 'https://api.example.com/swagger.json',
  outputDir: 'coverage'
});
```

### Расширенная конфигурация

```javascript
const apiCoverage = new ApiCoverage({
  swaggerUrl: 'https://api.example.com/swagger.json',
  outputDir: 'coverage',
  includeTags: ['public', 'private'],
  excludeTags: ['deprecated'],
  partialCoverageThreshold: 0.5,
  reportTitle: 'Мой отчет о покрытии API',
  reportDescription: 'Отчет о покрытии для Моего API',
  ignorePaths: ['/health', '/metrics'],
  ignoreMethods: ['OPTIONS'],
  ignoreStatusCodes: [404],
  recordRequestHeaders: true,
  recordResponseHeaders: true,
  maxRequestSize: 2048
});
```

### Конфигурация с переменными окружения

```bash
# Файл .env
API_COVERAGE_SWAGGER_URL=https://api.example.com/swagger.json
API_COVERAGE_OUTPUT_DIR=coverage
API_COVERAGE_INCLUDE_TAGS=public,private
API_COVERAGE_EXCLUDE_TAGS=deprecated
API_COVERAGE_PARTIAL_COVERAGE_THRESHOLD=0.5
```

```javascript
// Загрузка переменных окружения
require('dotenv').config();

const apiCoverage = new ApiCoverage();
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