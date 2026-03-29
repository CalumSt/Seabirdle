const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './playwright',
  timeout: 30000,
  fullyParallel: true, // Run Chrome and Safari at the same time
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
  },
  // This starts your server automatically so you don't have to & it in CI
  webServer: {
    command: 'npx serve . -l 5000',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});