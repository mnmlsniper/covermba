import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Класс для генерации отчетов о покрытии API.
 * Создает HTML отчеты с использованием EJS шаблонов.
 */
export class ReportGenerator {
    /**
     * Создает экземпляр ReportGenerator
     * @param {Object} options - Настройки генератора отчетов
     * @param {string} [options.outputDir='coverage'] - Директория для сохранения отчетов
     * @param {string} [options.templatePath] - Путь к шаблону отчета
     */
    constructor(options = {}) {
        // Используем относительный путь от корня проекта
        this.outputDir = options.outputDir || 'coverage';
        this.templatePath = options.templatePath || path.join(__dirname, 'templates', 'report.ejs');
    }

    /**
     * Генерирует отчет о покрытии
     * @param {Object} coverage - Данные о покрытии API
     * @returns {Promise<void>}
     */
    async generate(coverage) {
        const processedData = this._processCoverageData(coverage);
        
        // Сохраняем coverage.json
        const coveragePath = path.join(this.outputDir, 'coverage.json');
        await fs.promises.writeFile(coveragePath, JSON.stringify(processedData, null, 2));
        
        // Сохраняем requests.json
        const requestsPath = path.join(this.outputDir, 'requests.json');
        await fs.promises.writeFile(requestsPath, JSON.stringify(coverage.requests || [], null, 2));
        
        // Генерируем HTML отчет
        const htmlContent = await this._generateHtml(processedData);
        const htmlPath = path.join(this.outputDir, 'coverage.html');
        await fs.promises.writeFile(htmlPath, htmlContent);
        
        // Копируем ресурсы
        await this._copyAssets();
    }

    /**
     * Обрабатывает данные о покрытии для использования в шаблоне
     * @private
     * @param {Object} coverage - Исходные данные о покрытии
     * @returns {Object} Обработанные данные для шаблона
     */
    _processCoverageData(coverage) {
        const services = {};
        const endpoints = coverage?.endpoints || [];

        // Process endpoints by service
        endpoints.forEach(endpoint => {
            const serviceName = (endpoint.tags?.[0] || 'default').toLowerCase();
            if (!services[serviceName]) {
                services[serviceName] = {
                    name: serviceName,
                    endpoints: {}
                };
            }

            const endpointKey = `${endpoint.method} ${endpoint.path}`;
            services[serviceName].endpoints[endpointKey] = {
                ...endpoint,
                isCovered: endpoint.isCovered,
                isPartiallyCovered: endpoint.isPartiallyCovered
            };
        });

        return {
            totalEndpoints: coverage?.totalEndpoints || 0,
            coveredEndpoints: coverage?.coveredEndpoints || 0,
            partialEndpoints: coverage?.partialEndpoints || 0,
            missingEndpoints: coverage?.missingEndpoints || 0,
            percentage: coverage?.percentage || 0,
            services
        };
    }

    /**
     * Проверяет, частично ли покрыт эндпоинт
     * @private
     * @param {Object} endpoint - Информация об эндпоинте
     * @returns {boolean} true если эндпоинт частично покрыт
     */
    _isPartiallyCovered(endpoint) {
        if (!endpoint.requests || endpoint.requests.length === 0) return false;
        const expectedStatusCodes = Object.keys(endpoint.responses || {});
        const coveredStatusCodes = [...new Set(endpoint.requests.map(r => r.statusCode))];
        return coveredStatusCodes.length < expectedStatusCodes.length;
    }

    /**
     * Генерирует HTML отчет используя EJS шаблон
     * @private
     * @param {Object} data - Данные для шаблона
     * @returns {Promise<string>} HTML содержимое отчета
     */
    async _generateHtml(data) {
        const templatePath = path.join(__dirname, 'templates', 'report.ejs');
        const template = await fs.promises.readFile(templatePath, 'utf-8');
        
        const templateData = {
            ...data,
            getProgressBarColor: (percentage) => {
                if (percentage >= 80) return '#28a745';
                if (percentage >= 50) return '#ffc107';
                return '#dc3545';
            }
        };
        
        return ejs.render(template, templateData);
    }

    /**
     * Копирует статические ресурсы (CSS, JS) в директорию отчета
     * @private
     * @returns {Promise<void>}
     */
    async _copyAssets() {
        const assetsDir = path.join(this.outputDir, 'assets');
        const templateAssetsDir = path.join(path.dirname(this.templatePath), 'assets');
        
        if (!fs.existsSync(assetsDir)) {
            await fs.promises.mkdir(assetsDir, { recursive: true });
        }
        
        if (fs.existsSync(templateAssetsDir)) {
            await this._copyDirectory(templateAssetsDir, assetsDir);
        }
    }

    /**
     * Рекурсивно копирует директорию
     * @private
     * @param {string} src - Путь к исходной директории
     * @param {string} dest - Путь к целевой директории
     * @returns {Promise<void>}
     */
    async _copyDirectory(src, dest) {
        const entries = await fs.promises.readdir(src, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                await fs.promises.mkdir(destPath, { recursive: true });
                await this._copyDirectory(srcPath, destPath);
            } else {
                await fs.promises.copyFile(srcPath, destPath);
            }
        }
    }

    async generateReport(coverage) {
        try {
            // Создаем директорию для отчета, если она не существует
            await fs.promises.mkdir(this.outputDir, { recursive: true });

            // Генерируем HTML отчет
            const template = await fs.promises.readFile(this.templatePath, 'utf-8');
            const html = ejs.render(template, { coverage });
            await fs.promises.writeFile(path.join(this.outputDir, 'coverage.html'), html);

            // Копируем ассеты
            const templateAssetsDir = path.join(path.dirname(this.templatePath), 'assets');
            const outputAssetsDir = path.join(this.outputDir, 'assets');
            await this.copyAssets(templateAssetsDir, outputAssetsDir);

            // Генерируем JSON отчет
            await fs.promises.writeFile(
                path.join(this.outputDir, 'coverage.json'),
                JSON.stringify(coverage, null, 2)
            );

            return {
                html: path.join(this.outputDir, 'coverage.html'),
                json: path.join(this.outputDir, 'coverage.json')
            };
        } catch (error) {
            throw new Error(`Failed to generate report: ${error.message}`);
        }
    }
} 