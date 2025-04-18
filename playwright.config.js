import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'https://api.example.com',
  },
  reporter: [['list'], ['html']],
  workers: 1,
  timeout: 30000,
}); 