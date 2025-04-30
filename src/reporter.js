import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HtmlReporter {
    constructor(options = {}) {
        this.outputDir = options.outputDir || 'coverage';
        this.title = options.title || 'API Coverage Report';
        this.logFile = options.logFile || null;
        this.logLevel = options.logLevel || 'none';
    }

    generate(coverageData) {
        // Создаем директорию для отчета, если её нет
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        const html = this._generateHtml(coverageData);
        const reportPath = path.join(this.outputDir, 'index.html');
        fs.writeFileSync(reportPath, html);

        return reportPath;
    }

    _generateHtml(coverageData) {
        const { totalEndpoints, coveredEndpoints, coveragePercentage, serviceStats, details, unknownEndpoints } = coverageData;
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            margin-bottom: 30px;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            flex: 1;
            padding: 20px;
            border-radius: 8px;
            background: #f5f5f5;
        }
        .progress-bar {
            height: 20px;
            background: #eee;
            border-radius: 10px;
            overflow: hidden;
            margin-top: 10px;
        }
        .progress {
            height: 100%;
            background: #4CAF50;
            width: ${coveragePercentage}%;
        }
        .endpoints-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .endpoints-table th, .endpoints-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .endpoints-table th {
            background: #f5f5f5;
        }
        .covered {
            color: #4CAF50;
        }
        .uncovered {
            color: #f44336;
        }
        .service-section {
            margin-top: 30px;
        }
        .service-header {
            font-size: 1.2em;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #eee;
        }
        .unknown-endpoint {
            background-color: #fff3cd;
        }
        .tabs {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
        }
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border: 1px solid #ddd;
            border-bottom: none;
            margin-right: 5px;
            border-radius: 4px 4px 0 0;
        }
        .tab.active {
            background: #f5f5f5;
            border-bottom: 1px solid #f5f5f5;
            margin-bottom: -1px;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .status-codes {
            margin: 5px 0;
        }
        
        .status-codes-progress {
            height: 6px;
            background: #eee;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 3px;
        }
        
        .status-codes-bar {
            height: 100%;
            background: #4CAF50;
            transition: width 0.3s ease;
        }
        
        .status-codes-info {
            font-size: 0.8em;
            color: #666;
        }
        
        .missing-codes {
            color: #f44336;
            margin-left: 10px;
        }
        
        .unexpected-codes {
            color: #ff9800;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${this.title}</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <h3>Total Endpoints</h3>
                <p>${totalEndpoints}</p>
            </div>
            <div class="stat-card">
                <h3>Covered Endpoints</h3>
                <p>${coveredEndpoints}</p>
            </div>
            <div class="stat-card">
                <h3>Coverage</h3>
                <p>${coveragePercentage.toFixed(2)}%</p>
                <div class="progress-bar">
                    <div class="progress"></div>
                </div>
            </div>
            <div class="stat-card">
                <h3>Unknown Endpoints</h3>
                <p>${unknownEndpoints.length}</p>
            </div>
        </div>

        <div class="tabs">
            <div class="tab" data-tab="swagger">Swagger Endpoints</div>
            <div class="tab" data-tab="unknown">Unknown Endpoints</div>
        </div>

        <div id="swagger" class="tab-content">
            ${this._generateServiceSections(serviceStats)}
            
            <h2>Detailed Coverage</h2>
            <table class="endpoints-table">
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Method</th>
                        <th>Path</th>
                        <th>Status</th>
                        <th>Tags</th>
                    </tr>
                </thead>
                <tbody>
                    ${this._generateEndpointRows(details, false)}
                </tbody>
            </table>
        </div>

        <div id="unknown" class="tab-content">
            <h2>Unknown Endpoints</h2>
            <table class="endpoints-table">
                <thead>
                    <tr>
                        <th>Method</th>
                        <th>Path</th>
                        <th>Requests</th>
                    </tr>
                </thead>
                <tbody>
                    ${this._generateUnknownEndpointRows(details)}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Показываем первую вкладку по умолчанию
            showTab('swagger');

            // Добавляем обработчики для вкладок
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabName = this.getAttribute('data-tab');
                    showTab(tabName);
                });
            });
        });

        function showTab(tabName) {
            // Скрываем все содержимое вкладок
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            
            // Показываем выбранное содержимое
            document.getElementById(tabName).style.display = 'block';
            
            // Обновляем стили вкладок
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector('.tab[data-tab="' + tabName + '"]').classList.add('active');
        }
    </script>
</body>
</html>
        `;
    }

    _generateServiceSections(serviceStats) {
        return Object.entries(serviceStats)
            .map(([serviceName, stats]) => `
                <div class="service-section">
                    <div class="service-header">
                        <h2>${serviceName}</h2>
                        <p>Coverage: ${stats.coveragePercentage.toFixed(2)}%</p>
                    </div>
                    <table class="endpoints-table">
                        <thead>
                            <tr>
                                <th>Method</th>
                                <th>Path</th>
                                <th>Status</th>
                                <th>Tags</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.endpoints.map(endpoint => `
                                <tr>
                                    <td>${endpoint.method}</td>
                                    <td>${endpoint.path}</td>
                                    <td class="${endpoint.covered ? 'covered' : 'uncovered'}">
                                        ${endpoint.covered ? 'Covered' : 'Not Covered'}
                                    </td>
                                    <td>${endpoint.tags.join(', ')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('');
    }

    _generateEndpointRows(details, isSwagger) {
        return Object.entries(details)
            .map(([endpointKey, data]) => {
                const statusCodeCoverage = data.statusCodeCoverage;
                const coveragePercentage = statusCodeCoverage.total > 0 
                    ? (statusCodeCoverage.covered / statusCodeCoverage.total) * 100 
                    : 0;
                
                return `
                <tr>
                    <td>${data.service}</td>
                    <td>${endpointKey.split(' ')[0]}</td>
                    <td>${endpointKey.split(' ')[1]}</td>
                    <td class="${data.covered ? 'covered' : 'uncovered'}">
                        ${data.covered ? 'Covered' : 'Not Covered'}
                    </td>
                    <td>
                        <div class="status-codes">
                            <div class="status-codes-progress">
                                <div class="status-codes-bar" style="width: ${coveragePercentage}%"></div>
                            </div>
                            <div class="status-codes-info">
                                ${statusCodeCoverage.covered}/${statusCodeCoverage.total} codes
                                ${statusCodeCoverage.missing.length > 0 ? 
                                    `<span class="missing-codes">Missing: ${statusCodeCoverage.missing.join(', ')}</span>` : 
                                    ''}
                                ${statusCodeCoverage.unexpected.length > 0 ? 
                                    `<span class="unexpected-codes">Unexpected: ${statusCodeCoverage.unexpected.join(', ')}</span>` : 
                                    ''}
                            </div>
                        </div>
                    </td>
                    <td>${data.tags.join(', ')}</td>
                </tr>
            `}).join('');
    }

    _generateUnknownEndpointRows(details) {
        return Object.entries(details)
            .filter(([_, data]) => data.isUnknown)
            .map(([endpointKey, data]) => `
                <tr class="unknown-endpoint">
                    <td>${endpointKey.split(' ')[0]}</td>
                    <td>${endpointKey.split(' ')[1]}</td>
                    <td>${data.requests.length}</td>
                </tr>
            `).join('');
    }
}

module.exports = HtmlReporter; 