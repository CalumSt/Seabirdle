const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './playwright',
  fullyParallel: true,
  use: {
    // This will be overridden by the ENV var in the workflow, but good for local
    baseURL: 'http://127.0.0.1:5000', 
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});