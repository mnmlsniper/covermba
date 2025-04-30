# Отчеты API Coverage

## Обзор

API Coverage генерирует два типа отчетов:
1. HTML отчет - для визуального анализа покрытия
2. JSON отчет - для автоматизированной обработки данных

## HTML отчет

### Структура отчета

#### Заголовок
- Название отчета
- Прогресс-бар с процентом покрытия
- Статистика по эндпоинтам:
  - Всего эндпоинтов
  - Покрыто
  - Частично покрыто
  - Пропущено

#### Навигация
- Вкладки для фильтрации:
  - Все эндпоинты
  - Пропущенные
  - Частично покрытые
  - Покрытые

#### Детали эндпоинтов
- Группировка по сервисам
- Аккордеон для каждого эндпоинта:
  - Метод и путь
  - Бейдж статуса покрытия
  - Описание и теги
  - Записанные запросы:
    - Статус-код
    - Временная метка

### Стилизация
- Цветовые индикаторы:
  - Зеленый - покрыто
  - Желтый - частично покрыто
  - Красный - пропущено
- Адаптивный дизайн
- Поддержка темной темы

## JSON отчет

### Структура

```json
{
    "metadata": {
        "timestamp": "2024-03-21T12:00:00Z",
        "swaggerUrl": "https://api.example.com/swagger.json",
        "version": "1.0.0"
    },
    "coverage": {
        "totalEndpoints": 100,
        "coveredEndpoints": 80,
        "partialEndpoints": 15,
        "missingEndpoints": 5,
        "percentage": 87.5
    },
    "services": {
        "users": {
            "total": 20,
            "covered": 18,
            "partial": 2,
            "missing": 0,
            "percentage": 95.0
        },
        "products": {
            "total": 30,
            "covered": 25,
            "partial": 3,
            "missing": 2,
            "percentage": 88.3
        }
    },
    "endpoints": [
        {
            "path": "/users",
            "method": "GET",
            "summary": "Get users",
            "description": "Returns list of users",
            "tags": ["users"],
            "service": "users",
            "isCovered": true,
            "isPartiallyCovered": false,
            "expectedStatusCodes": [200, 400, 404],
            "actualStatusCodes": [200],
            "requests": [
                {
                    "statusCode": 200,
                    "timestamp": "2024-03-21T12:00:00Z",
                    "requestBody": "...",
                    "responseBody": "...",
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            ]
        }
    ]
}
```

## Настройка отчетов

### HTML отчет

#### Пользовательский шаблон
```javascript
const coverage = new ApiCoverage({
    templatePath: './custom-template.ejs'
});
```

#### Настройка стилей
```javascript
const coverage = new ApiCoverage({
    assetsDir: './assets',
    styles: {
        progressBar: {
            height: '40px',
            backgroundColor: '#f0f0f0'
        },
        badges: {
            covered: '#28a745',
            partial: '#ffc107',
            missing: '#dc3545'
        }
    }
});
```

### JSON отчет

#### Настройка полей
```javascript
const coverage = new ApiCoverage({
    jsonOptions: {
        includeRequestBody: true,
        includeResponseBody: true,
        includeHeaders: true,
        maxRequestSize: 1024,
        maxResponseSize: 1024
    }
});
```

## Генерация отчетов

### Автоматическая генерация
```javascript
await coverage.generateReport();
```

### Ручная генерация
```javascript
const report = await coverage.generateReport({
    format: 'html', // или 'json'
    outputPath: './custom-report.html'
});
```

## Лучшие практики

1. Регулярно генерируйте отчеты
2. Храните историю отчетов
3. Интегрируйте в CI/CD
4. Анализируйте тренды покрытия
5. Используйте JSON отчет для автоматизации
6. Настройте оповещения при низком покрытии
7. Документируйте нестандартные настройки
8. Проверяйте актуальность Swagger спецификации 