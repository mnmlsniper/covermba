import { test } from '@playwright/test';

export function withTestReporter(requestInfo, testFunction) {
    return async (request) => {
        try {
            const response = await testFunction(request);
            return response;
        } catch (error) {
            console.error('Test reporter error:', error);
            throw error;
        }
    };
} 