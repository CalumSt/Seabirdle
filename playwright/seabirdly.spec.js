// playwright/seabirdle.spec.js
// WebKit (Safari engine) tests via Playwright.
// Run: npx playwright test --browser=webkit

const { test, expect } = require('@playwright/test');
const path = require('path');

// ── Mock API responses ────────────────────────────────────────────────────
// Mirror the Cypress fixtures so both suites test the same scenario.
const TODAY = new Date().toISOString().slice(0, 10);

async function mockApis(page) {
  const fixtureDir = path.join(__dirname, '../cypress', 'fixtures');

  await page.route('**/birds_list.json', route => {
    route.fulfill({ path: path.join(fixtureDir, 'birds_list.json') });
  });
  await page.route('**/birds.json', route => {
    const raw = require('fs').readFileSync(path.join(fixtureDir, 'birds.json'), 'utf8');
    const data = JSON.parse(raw);
    data.date = TODAY; // ensure date matches today
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
  });
  await page.route('**/audio/**', route => route.fulfill({ status: 200, body: '' }));
  await page.route('**/img/daily/**', route => route.fulfill({ status: 200, body: '' }));
}

const BASE = 'http://localhost:5000';

test.beforeEach(async ({ page }) => {
  await mockApis(page);
  // Navigate to the origin first — WebKit blocks localStorage on about:blank
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
});

// ── Boot ──────────────────────────────────────────────────────────────────
test('loads and shows game UI', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.locator('#bird-preview-wrap')).toBeVisible();
  await expect(page.locator('#audio-section')).toBeVisible();
  await expect(page.locator('#guesses-section')).toBeVisible();
  await expect(page.locator('#input-section')).toBeVisible();
  await expect(page.locator('#date-badge')).not.toBeEmpty();
});

test('shows 6 empty guess rows on start', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.locator('.guess-row')).toHaveCount(6);
  await expect(page.locator('.guess-row.empty')).toHaveCount(6);
});

test('image is blurred on start', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.locator('#blur-label')).toContainText('remaining');
  const style = await page.locator('#prog-fill').getAttribute('style');
  expect(style).toContain('width: 0%');
});

// ── Autocomplete ──────────────────────────────────────────────────────────
test('autocomplete appears when typing', async ({ page }) => {
  await page.goto(BASE);
  await page.fill('#guess-input', 'puf');
  await expect(page.locator('#autocomplete')).toBeVisible();
  await expect(page.locator('.ac-item').first()).toBeVisible();
});

test('clicking autocomplete item fills input', async ({ page }) => {
  await page.goto(BASE);
  await page.fill('#guess-input', 'puf');
  await page.locator('.ac-item').first().click();
  const val = await page.inputValue('#guess-input');
  expect(val.length).toBeGreaterThan(0);
  await expect(page.locator('#autocomplete')).not.toBeVisible();
});

// ── Wrong guess ───────────────────────────────────────────────────────────
test('rejects unknown bird name', async ({ page }) => {
  await page.goto(BASE);
  await page.fill('#guess-input', 'Penguin');
  await page.click('#submit-btn');
  await expect(page.locator('#toast')).toContainText('Not in the seabird list');
  await expect(page.locator('.guess-row.wrong')).toHaveCount(0);
});

test('rejects duplicate guess', async ({ page }) => {
  await page.goto(BASE);
  await page.fill('#guess-input', 'Razorbill');
  await page.click('#submit-btn');
  await page.fill('#guess-input', 'Razorbill');
  await page.click('#submit-btn');
  await expect(page.locator('#toast')).toContainText('Already guessed');
});

test('records wrong guess and reduces blur label', async ({ page }) => {
  await page.goto(BASE);
  const before = await page.locator('#blur-label').innerText();
  const countBefore = parseInt(before);
  await page.fill('#guess-input', 'Razorbill');
  await page.click('#submit-btn');
  await expect(page.locator('.guess-row.wrong')).toHaveCount(1);
  const after = await page.locator('#blur-label').innerText();
  expect(parseInt(after)).toBeLessThan(countBefore);
});

// ── Correct guess ─────────────────────────────────────────────────────────
test('wins on correct guess', async ({ page }) => {
  await page.goto(BASE);
  await page.fill('#guess-input', 'Atlantic Puffin');
  await page.click('#submit-btn');
  await expect(page.locator('#result-panel')).toBeVisible();
  await expect(page.locator('#res-title')).toContainText('Correct');
  await expect(page.locator('#blur-label')).toHaveText('');
});

test('saves play date to localStorage on win', async ({ page }) => {
  await page.goto(BASE);
  await page.fill('#guess-input', 'Atlantic Puffin');
  await page.click('#submit-btn');
  const stored = await page.evaluate(() => localStorage.getItem('lastPlayDate'));
  expect(stored).toBe(new Date().toISOString().slice(0, 10));
});

// ── Already played ────────────────────────────────────────────────────────
test('shows already-played on revisit', async ({ page }) => {
  await page.goto(BASE);
  await page.evaluate(today => localStorage.setItem('lastPlayDate', today), TODAY);
  await page.reload();
  await expect(page.locator('#result-panel')).toBeVisible();
  await expect(page.locator('#res-title')).toContainText('Already played');
  await expect(page.locator('#res-name')).not.toBeEmpty();
});

// ── Lose after 6 guesses ──────────────────────────────────────────────────
test('loses after 6 wrong guesses', async ({ page }) => {
  await page.goto(BASE);
  const wrong = [
    'Razorbill', 'Common Guillemot', 'Northern Gannet',
    'European Shag', 'Great Cormorant', 'Manx Shearwater',
  ];
  for (const name of wrong) {
    await page.fill('#guess-input', name);
    await page.click('#submit-btn');
  }
  await expect(page.locator('#result-panel')).toBeVisible();
  await expect(page.locator('#res-title')).toContainText('Better luck');
  await expect(page.locator('.guess-row.wrong')).toHaveCount(6);
});

// ── Hint toast ────────────────────────────────────────────────────────────
test('shows genus hint after 2 wrong guesses', async ({ page }) => {
  await page.goto(BASE);
  await page.fill('#guess-input', 'Razorbill');
  await page.click('#submit-btn');
  await page.fill('#guess-input', 'Common Guillemot');
  await page.click('#submit-btn');
  await expect(page.locator('#toast')).toContainText('Hint: genus');
});

// ── Audio button ──────────────────────────────────────────────────────────
test('play button is enabled', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.locator('#play-btn')).not.toBeDisabled();
});

// ── Keyboard ──────────────────────────────────────────────────────────────
test('Enter key submits a guess', async ({ page }) => {
  await page.goto(BASE);
  await page.fill('#guess-input', 'Razorbill');
  await page.press('#guess-input', 'Enter');
  await expect(page.locator('.guess-row').filter({ hasNot: page.locator('.empty') })).toHaveCount(1);
});

// ── Responsive ───────────────────────────────────────────────────────────
test('renders at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE);
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('#guess-input')).toBeVisible();
  await expect(page.locator('#submit-btn')).toBeVisible();
});