import { describe, it, expect } from '@jest/globals';
import { RequestCollector } from '../../src/collector/RequestCollector.js';
import { ApiCoverage } from '../../src/coverage/ApiCoverage.js';

describe('RequestCollector', () => {
    let collector;
    let apiCoverage;

    beforeEach(() => {
        apiCoverage = new ApiCoverage({
            swaggerPath: 'test.yaml',
            baseUrl: 'https://api.example.com'
        });
        collector = new RequestCollector(apiCoverage);
    });

    describe('collect', () => {
        it('should create a proxy for the target object', () => {
            const target = {
                get: jest.fn(),
                post: jest.fn()
            };

            const proxy = collector.collect(target);
            expect(proxy).toBeDefined();
            expect(typeof proxy.get).toBe('function');
            expect(typeof proxy.post).toBe('function');
        });

        it('should record requests when methods are called', async () => {
            const target = {
                get: jest.fn().mockResolvedValue({ status: 200 })
            };

            const proxy = collector.collect(target);
            await proxy.get('https://api.example.com/test', { headers: { 'Content-Type': 'application/json' } });

            const requests = collector.getRequests();
            expect(requests.length).toBe(1);
            expect(requests[0].method).toBe('GET');
            expect(requests[0].path).toBe('/test');
        });

        it('should not record requests if ApiCoverage is not set', async () => {
            const collectorWithoutApiCoverage = new RequestCollector();
            const target = {
                get: jest.fn().mockResolvedValue({ status: 200 })
            };

            const proxy = collectorWithoutApiCoverage.collect(target);
            await proxy.get('https://api.example.com/test');

            const requests = collectorWithoutApiCoverage.getRequests();
            expect(requests.length).toBe(1);
        });
    });

    describe('getRequests', () => {
        it('should return all collected requests', () => {
            const target = {
                get: jest.fn().mockResolvedValue({ status: 200 })
            };

            const proxy = collector.collect(target);
            proxy.get('https://api.example.com/test1');
            proxy.get('https://api.example.com/test2');

            const requests = collector.getRequests();
            expect(requests.length).toBe(2);
        });
    });

    describe('clear', () => {
        it('should clear all collected requests', () => {
            const target = {
                get: jest.fn().mockResolvedValue({ status: 200 })
            };

            const proxy = collector.collect(target);
            proxy.get('https://api.example.com/test');

            collector.clear();
            const requests = collector.getRequests();
            expect(requests.length).toBe(0);
        });
    });
}); 