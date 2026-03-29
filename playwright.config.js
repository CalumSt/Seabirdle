const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './playwright',
  /* CRITICAL: WebKit on Linux is unstable with high concurrency in Docker.
     Setting workers to 1 ensures the browser doesn't crash the server.
  */
  workers: 1, 
  fullyParallel: false, 
  
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:5000',
    // Helps with stability in containerized Safari/WebKit
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});