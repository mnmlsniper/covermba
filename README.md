# API Coverage

Инструмент для отслеживания покрытия API тестами на основе Swagger спецификации.

## Возможности

- Отслеживание запросов к API во время выполнения тестов
- Расчет покрытия на основе Swagger спецификации
- Генерация HTML отчета с детальной информацией о покрытии
- Поддержка частичного покрытия (когда тестированы не все статус-коды)
- Группировка эндпоинтов по сервисам
- Статистика покрытия в процентах
- Визуализация прогресса покрытия
- Экспорт данных в JSON формат

## Архитектура

Инструмент состоит из следующих компонентов:

- `ApiCoverage` - основной класс для инициализации и управления покрытием
- `SwaggerLoader` - загрузчик Swagger спецификации
- `RequestTracker` - трекер запросов к API
- `CoverageCalculator` - калькулятор покрытия
- `ReportGenerator` - генератор отчетов

## Установка

```bash
npm install @covermba/api-coverage
```

## Использование

```javascript
import ApiCoverage from '@covermba/api-coverage';

// Инициализация
const coverage = new ApiCoverage({
    swaggerUrl: 'https://api.example.com/swagger.json',
    outputDir: './coverage'
});

// Запуск отслеживания
await coverage.start();

// Выполнение тестов...

// Генерация отчета
await coverage.generateReport();
```

## Конфигурация

### Базовые опции

| Опция | Тип | По умолчанию | Описание |
|-------|-----|-------------|----------|
| `swaggerUrl` | string | - | URL или путь к Swagger спецификации |
| `outputDir` | string | './coverage' | Директория для сохранения отчетов |
| `title` | string | 'API Coverage Report' | Заголовок отчета |

### Опции отчетов

| Опция | Тип | По умолчанию | Описание |
|-------|-----|-------------|----------|
| `reportPath` | string | 'report.html' | Путь к HTML отчету |
| `jsonPath` | string | 'coverage.json' | Путь к JSON отчету |
| `templatePath` | string | - | Путь к пользовательскому шаблону |

### Опции покрытия

| Опция | Тип | По умолчанию | Описание |
|-------|-----|-------------|----------|
| `partialCoverageThreshold` | number | 0.5 | Порог для частичного покрытия |
| `ignorePaths` | string[] | [] | Пути для игнорирования |
| `ignoreMethods` | string[] | [] | Методы для игнорирования |

### Опции запросов

| Опция | Тип | По умолчанию | Описание |
|-------|-----|-------------|----------|
| `trackRequestBody` | boolean | false | Отслеживать тело запроса |
| `trackResponseBody` | boolean | false | Отслеживать тело ответа |
| `trackHeaders` | boolean | false | Отслеживать заголовки |

## Формат отчета

### HTML отчет

HTML отчет включает:
- Общую статистику покрытия
- Прогресс-бар с процентом покрытия
- Количество эндпоинтов по категориям (всего, покрыто, частично, пропущено)
- Детальную информацию по каждому эндпоинту:
  - Метод и путь
  - Описание и теги
  - Статус покрытия
  - Записанные запросы и их статус-коды

### JSON отчет

```json
{
    "metadata": {
        "timestamp": "2024-03-21T12:00:00Z",
        "swaggerUrl": "https://api.example.com/swagger.json"
    },
    "coverage": {
        "totalEndpoints": 100,
        "coveredEndpoints": 80,
        "partialEndpoints": 15,
        "missingEndpoints": 5,
        "percentage": 87.5
    },
    "endpoints": [
        {
            "path": "/users",
            "method": "GET",
            "summary": "Get users",
            "description": "Returns list of users",
            "tags": ["users"],
            "isCovered": true,
            "isPartiallyCovered": false,
            "requests": [
                {
                    "statusCode": 200,
                    "timestamp": "2024-03-21T12:00:00Z"
                }
            ]
        }
    ]
}
```

## Структура проекта

```
src/
├── coverage/
│   ├── ApiCoverage.js
│   ├── SwaggerLoader.js
│   ├── RequestTracker.js
│   ├── CoverageCalculator.js
│   ├── ReportGenerator.js
│   └── templates/
│       └── report.ejs
├── tests/
│   └── integration/
│       └── playwright/
│           └── api-coverage.spec.js
└── docs/
    ├── configuration.md
    └── reports.md
```

## Разработка

### Запуск тестов

```bash
npm test
```

### Сборка

```bash
npm run build
```

## Лицензия

MIT 