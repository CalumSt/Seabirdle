// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './playwright',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5000',
  },
  projects: [
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});