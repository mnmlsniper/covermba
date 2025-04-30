# API Coverage

Инструмент для отслеживания и отчетности о покрытии тестами API на основе спецификаций Swagger.

## Возможности

- Отслеживает запросы API во время выполнения тестов
- Рассчитывает покрытие на основе спецификаций Swagger
- Генерирует детальные HTML-отчеты
- Поддерживает определение частичного покрытия
- Группирует эндпоинты по сервисам
- Предоставляет статистику покрытия

## Архитектура

Инструмент следует модульной архитектуре с четким разделением ответственности:

- **ApiCoverage**: Основной фасад, который управляет процессом
- **SwaggerLoader**: Обрабатывает загрузку и парсинг спецификации Swagger
- **RequestTracker**: Управляет записью и хранением запросов API
- **CoverageCalculator**: Рассчитывает метрики покрытия
- **ReportGenerator**: Генерирует различные форматы отчетов

Подробную документацию по архитектуре смотрите в [docs/architecture.md](docs/architecture.md).

## Установка

```bash
npm install @covermba/api-coverage
```

## Использование

### Базовое использование

```javascript
import ApiCoverage from '@covermba/api-coverage';

const apiCoverage = new ApiCoverage({
  swaggerUrl: 'https://api.example.com/swagger.json',
  outputDir: 'coverage'
});

// Инициализация отслеживания покрытия
await apiCoverage.init();

// Запись запросов API во время тестов
apiCoverage.recordRequest({
  method: 'GET',
  path: '/api/users',
  statusCode: 200
});

// Генерация отчета
await apiCoverage.generateReport();
```

### Опции конфигурации

```javascript
const options = {
  swaggerUrl: 'https://api.example.com/swagger.json', // URL спецификации Swagger
  swaggerFile: './swagger.json', // Путь к локальному файлу Swagger
  outputDir: 'coverage', // Директория для отчетов
  includeTags: ['public', 'private'], // Отслеживать только эндпоинты с этими тегами
  excludeTags: ['deprecated'], // Исключить эндпоинты с этими тегами
  partialCoverageThreshold: 0.5 // Считать эндпоинт покрытым, если покрыто столько процентов кодов статуса
};
```

## Формат отчета

Сгенерированный HTML-отчет включает:

- Общий процент покрытия
- Количество общих, покрытых, частично покрытых и непокрытых эндпоинтов
- Детальный просмотр каждого эндпоинта с:
  - Кратким описанием и описанием
  - Ожидаемыми кодами статуса
  - Записанными запросами
  - Статусом покрытия
- Группировку по сервисам/тегам
- Опции фильтрации

## Разработка

### Структура проекта

```
src/
  coverage/
    ApiCoverage.js        # Основной фасад
    SwaggerLoader.js      # Обработка спецификации Swagger
    RequestTracker.js     # Запись и хранение запросов
    CoverageCalculator.js # Расчет покрытия
    ReportGenerator.js    # Генерация отчетов
    templates/           # Шаблоны отчетов
tests/
  integration/          # Интеграционные тесты
  unit/                # Модульные тесты
docs/
  architecture.md      # Документация по архитектуре
```

### Запуск тестов

```bash
# Запуск всех тестов
npm test

# Запуск конкретного файла тестов
npm test tests/unit/ApiCoverage.test.js
```

## Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функциональности
3. Внесите свои изменения
4. Запустите тесты
5. Отправьте pull request

## Лицензия

MIT 