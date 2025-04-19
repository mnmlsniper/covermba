# API Coverage Library

A library for tracking API test coverage based on Swagger/OpenAPI specifications.

[Russian version (Русская версия)](#api-coverage-library-ru)

## Features

- Automatic tracking of API endpoints coverage
- Support for Swagger/OpenAPI specifications
- Real-time request monitoring
- Detailed HTML reports
- JSON reports for custom analysis
- Coverage status tracking (Covered, Partial, Missing)

## Installation

```bash
npm install api-coverage
```

## Quick Start

```javascript
import { ApiCoverage } from 'api-coverage';

const coverage = new ApiCoverage({
    swaggerPath: './swagger.json',
    baseUrl: 'http://api.example.com',
    outputDir: 'coverage'
});

await coverage.start();
// Your tests here
await coverage.stop();
```

## Coverage Statuses

The library tracks three coverage statuses for each endpoint:

1. **Covered**: All expected status codes have been tested
2. **Partial**: Some status codes have been tested, but not all
3. **Missing**: No status codes have been tested

## Report Types

### HTML Report
- Visual representation of API coverage
- Interactive interface
- Detailed endpoint information
- Status code coverage tracking
- Request/response details

### JSON Report
- Machine-readable format
- Suitable for custom analysis
- Integration with other tools
- Historical data comparison

## Architecture

The library consists of several key components:

1. **ApiCoverage**: Main class that orchestrates the coverage tracking
2. **RequestCollector**: Monitors and collects API requests
3. **ReportGenerator**: Generates coverage reports
4. **Coverage Calculator**: Analyzes coverage data

## Configuration Options

```javascript
{
    swaggerPath: string,      // Path to Swagger/OpenAPI specification
    baseUrl: string,          // Base URL of the API
    outputDir: string,        // Output directory for reports
    debug: boolean,           // Enable debug logging
    generateHtmlReport: boolean // Generate HTML report
}
```

---

# API Coverage Library (RU)

Библиотека для отслеживания покрытия тестами API на основе спецификаций Swagger/OpenAPI.

## Возможности

- Автоматическое отслеживание покрытия эндпоинтов API
- Поддержка спецификаций Swagger/OpenAPI
- Мониторинг запросов в реальном времени
- Подробные HTML-отчеты
- JSON-отчеты для пользовательского анализа
- Отслеживание статусов покрытия (Покрыто, Частично, Не покрыто)

## Установка

```bash
npm install api-coverage
```

## Быстрый старт

```javascript
import { ApiCoverage } from 'api-coverage';

const coverage = new ApiCoverage({
    swaggerPath: './swagger.json',
    baseUrl: 'http://api.example.com',
    outputDir: 'coverage'
});

await coverage.start();
// Ваши тесты здесь
await coverage.stop();
```

## Статусы покрытия

Библиотека отслеживает три статуса покрытия для каждого эндпоинта:

1. **Covered (Покрыто)**: Протестированы все ожидаемые статус-коды
2. **Partial (Частично)**: Протестирована часть статус-кодов, но не все
3. **Missing (Не покрыто)**: Не протестирован ни один статус-код

## Типы отчетов

### HTML-отчет
- Визуальное представление покрытия API
- Интерактивный интерфейс
- Подробная информация по эндпоинтам
- Отслеживание покрытия статус-кодов
- Детали запросов и ответов

### JSON-отчет
- Машиночитаемый формат
- Подходит для пользовательского анализа
- Интеграция с другими инструментами
- Сравнение исторических данных

## Архитектура

Библиотека состоит из нескольких ключевых компонентов:

1. **ApiCoverage**: Основной класс, управляющий отслеживанием покрытия
2. **RequestCollector**: Мониторит и собирает API-запросы
3. **ReportGenerator**: Генерирует отчеты о покрытии
4. **Coverage Calculator**: Анализирует данные о покрытии

## Параметры конфигурации

```javascript
{
    swaggerPath: string,      // Путь к спецификации Swagger/OpenAPI
    baseUrl: string,          // Базовый URL API
    outputDir: string,        // Директория для отчетов
    debug: boolean,           // Включить отладочное логирование
    generateHtmlReport: boolean // Генерировать HTML-отчет
}
``` 