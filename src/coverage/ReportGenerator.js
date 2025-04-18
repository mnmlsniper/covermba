import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ReportGenerator {
    constructor(options = {}) {
        this.outputDir = options.outputDir || 'coverage';
        this.templatePath = options.templatePath || path.join(__dirname, 'templates', 'report.ejs');
    }

    async generate(coverage) {
        const processedData = this._processCoverageData(coverage);
        await this._generateHtml(processedData);
        await this._copyAssets();
    }

    _processCoverageData(coverage) {
        const services = {};
        const endpoints = coverage?.endpoints?.endpoints || {};

        // Process endpoints by service
        Object.entries(endpoints).forEach(([key, endpoint]) => {
            const serviceName = (endpoint.tags?.[0] || 'default').toLowerCase();
            if (!services[serviceName]) {
                services[serviceName] = {
                    name: serviceName,
                    endpoints: {}
                };
            }
            services[serviceName].endpoints[key] = endpoint;
        });

        return {
            totalEndpoints: coverage?.totalEndpoints || 0,
            coveredEndpoints: coverage?.coveredEndpoints || 0,
            coveragePercentage: coverage?.coveragePercentage || 0,
            services
        };
    }

    _isPartiallyCovered(endpoint) {
        if (!endpoint.requests || endpoint.requests.length === 0) return false;
        const expectedStatusCodes = Object.keys(endpoint.responses || {});
        const coveredStatusCodes = [...new Set(endpoint.requests.map(r => r.statusCode))];
        return coveredStatusCodes.length < expectedStatusCodes.length;
    }

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
} 