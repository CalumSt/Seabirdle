// playwright/seabirdle.spec.js
// WebKit (Safari engine) tests via Playwright.
// Run: npx playwright test --browser=webkit

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const TODAY      = new Date().toISOString().slice(0, 10);
const ANSWER     = 'Atlantic Puffin'; // must match cypress/fixtures/birds.json
const WRONG_BIRDS = [
  'Razorbill', 'Common Guillemot', 'Northern Gannet',
  'European Shag', 'Great Cormorant', 'Manx Shearwater',
];

// ── API mocks ─────────────────────────────────────────────────────────────
async function mockApis(page) {
  const fixtureDir = path.join(__dirname, 'fixtures');

  await page.route('**/birds_list.json', route =>
    route.fulfill({ path: path.join(fixtureDir, 'birds_list.json') }));

  await page.route('**/birds.json', route => {
    const data = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'birds.json'), 'utf8'));
    data.date = TODAY;
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
  });

  await page.route('**/audio/**',    route => route.fulfill({ status: 200, body: '' }));
  await page.route('**/img/daily/**',route => route.fulfill({ status: 200, body: '' }));
}

test.beforeEach(async ({ page }) => {
  await mockApis(page);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

// ── Boot ──────────────────────────────────────────────────────────────────
test('loads and shows game UI', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#bird-preview-wrap')).toBeVisible();
  await expect(page.locator('#audio-section')).toBeVisible();
  await expect(page.locator('#guesses-section')).toBeVisible();
  await expect(page.locator('#input-section')).toBeVisible();
  await expect(page.locator('#date-badge')).not.toBeEmpty();
});

test('shows 6 empty guess rows on start', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.guess-row')).toHaveCount(6);
  await expect(page.locator('.guess-row.empty')).toHaveCount(6);
});

test('image is blurred on start', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#blur-label')).toContainText('remaining');
  const style = await page.locator('#prog-fill').getAttribute('style');
  expect(style).toContain('width: 0%');
});

// ── Hint panel ────────────────────────────────────────────────────────────
test('hint panel visible on start', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#hint-panel')).toBeVisible();
});

test('hint panel shows recording country', async ({ page }) => {
  await page.goto('/');
  // Country comes from rec.cnt in the fixture — just check the label exists
  await expect(page.locator('#hint-panel .hint-label').first()).toBeVisible();
});

test('hint panel shows blank letters on start', async ({ page }) => {
  await page.goto('/');
  // All hint letters should be blank (no greens yet)
  const blanks = page.locator('#hint-panel .hint-letter.blank');
  await expect(blanks).toHaveCount(
    ANSWER.replace(/ /g, '').length
  );
  await expect(page.locator('#hint-panel .hint-letter.green')).toHaveCount(0);
});

test('correct-position letters fill hint panel green', async ({ page }) => {
  await page.goto('/');
  // Guessing a wrong bird that shares some letters in the right position
  // will reveal greens. Guessing the answer reveals all.
  await page.fill('#guess-input', ANSWER);
  await page.click('#submit-btn');
  const answerLetters = ANSWER.replace(/ /g, '').length;
  await expect(page.locator('#hint-panel .hint-letter.green')).toHaveCount(answerLetters);
  await expect(page.locator('#hint-panel .hint-letter.blank')).toHaveCount(0);
});

test('genus appears in hint panel after 3 wrong guesses', async ({ page }) => {
  await page.goto('/');
  for (const name of WRONG_BIRDS.slice(0, 3)) {
    await page.fill('#guess-input', name);
    await page.click('#submit-btn');
  }
  // Genus label should now be in the hint panel (permanent, not a toast)
  const labels = page.locator('#hint-panel .hint-label');
  const texts = await labels.allInnerTexts();
  expect(texts.some(t => t.toLowerCase().includes('genus'))).toBe(true);
});

test('genus not shown before 3 wrong guesses', async ({ page }) => {
  await page.goto('/');
  for (const name of WRONG_BIRDS.slice(0, 2)) {
    await page.fill('#guess-input', name);
    await page.click('#submit-btn');
  }
  const labels = page.locator('#hint-panel .hint-label');
  const texts = await labels.allInnerTexts();
  expect(texts.some(t => t.toLowerCase().includes('genus'))).toBe(false);
});

// ── Tile scoring ──────────────────────────────────────────────────────────
test('guess row shows tiles not plain text', async ({ page }) => {
  await page.goto('/');
  await page.fill('#guess-input', 'Razorbill');
  await page.click('#submit-btn');
  await expect(page.locator('.guess-row.wrong .tile').first()).toBeVisible();
});

test('correct guess row has all green tiles', async ({ page }) => {
  await page.goto('/');
  await page.fill('#guess-input', ANSWER);
  await page.click('#submit-btn');
  const row = page.locator('.guess-row.correct');
  await expect(row).toBeVisible();
  const greens  = await row.locator('.tile-green').count();
  const yellows = await row.locator('.tile-yellow').count();
  const greys   = await row.locator('.tile-grey').count();
  expect(greens).toBe(ANSWER.replace(/ /g, '').length);
  expect(yellows).toBe(0);
  expect(greys).toBe(0);
});

test('wrong guess row contains at least grey tiles', async ({ page }) => {
  await page.goto('/');
  await page.fill('#guess-input', 'Razorbill');
  await page.click('#submit-btn');
  const row = page.locator('.guess-row.wrong');
  await expect(row.locator('.tile')).not.toHaveCount(0);
});

// ── Autocomplete ──────────────────────────────────────────────────────────
test('autocomplete appears when typing', async ({ page }) => {
  await page.goto('/');
  await page.fill('#guess-input', 'puf');
  await expect(page.locator('#autocomplete')).toBeVisible();
  await expect(page.locator('.ac-item').first()).toBeVisible();
});

test('clicking autocomplete item fills input', async ({ page }) => {
  await page.goto('/');
  await page.fill('#guess-input', 'puf');
  await page.locator('.ac-item').first().click();
  const val = await page.inputValue('#guess-input');
  expect(val.length).toBeGreaterThan(0);
  await expect(page.locator('#autocomplete')).not.toBeVisible();
});

// ── Wrong guess ───────────────────────────────────────────────────────────
test('rejects unknown bird name', async ({ page }) => {
  await page.goto('/');
  await page.fill('#guess-input', 'Penguin');
  await page.click('#submit-btn');
  await expect(page.locator('#toast')).toContainText('Not in the seabird list');
  await expect(page.locator('.guess-row.wrong')).toHaveCount(0);
});

test('rejects duplicate guess', async ({ page }) => {
  await page.goto('/');
  await page.fill('#guess-input', 'Razorbill');
  await page.click('#submit-btn');
  await page.fill('#guess-input', 'Razorbill');
  await page.click('#submit-btn');
  await expect(page.locator('#toast')).toContainText('Already guessed');
});

test('records wrong guess and reduces blur label', async ({ page }) => {
  await page.goto('/');
  const before = parseInt(await page.locator('#blur-label').innerText());
  await page.fill('#guess-input', 'Razorbill');
  await page.click('#submit-btn');
  await expect(page.locator('.guess-row.wrong')).toHaveCount(1);
  const after = parseInt(await page.locator('#blur-label').innerText());
  expect(after).toBeLessThan(before);
});

// ── Correct guess ─────────────────────────────────────────────────────────
test('wins on correct guess', async ({ page }) => {
  await page.goto('/');
  await page.fill('#guess-input', ANSWER);
  await page.click('#submit-btn');
  await expect(page.locator('#result-panel')).toBeVisible();
  await expect(page.locator('#res-title')).toContainText('Correct');
  await expect(page.locator('#blur-label')).toHaveText('');
});

test('saves play date to localStorage on win', async ({ page }) => {
  await page.goto('/');
  await page.fill('#guess-input', ANSWER);
  await page.click('#submit-btn');
  const stored = await page.evaluate(() => localStorage.getItem('lastPlayDate'));
  expect(stored).toBe(TODAY);
});

// ── Already played ────────────────────────────────────────────────────────
test('shows already-played on revisit', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(today => localStorage.setItem('lastPlayDate', today), TODAY);
  await page.reload();
  await expect(page.locator('#result-panel')).toBeVisible();
  await expect(page.locator('#res-title')).toContainText('Already played');
  await expect(page.locator('#res-name')).not.toBeEmpty();
});

test('already-played view shows all letters revealed in hint panel', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(today => localStorage.setItem('lastPlayDate', today), TODAY);
  await page.reload();
  await expect(page.locator('#hint-panel .hint-letter.green')).toHaveCount(
    ANSWER.replace(/ /g, '').length
  );
});

// ── Lose after 6 guesses ──────────────────────────────────────────────────
test('loses after 6 wrong guesses', async ({ page }) => {
  await page.goto('/');
  for (const name of WRONG_BIRDS) {
    await page.fill('#guess-input', name);
    await page.click('#submit-btn');
  }
  await expect(page.locator('#result-panel')).toBeVisible();
  await expect(page.locator('#res-title')).toContainText('Better luck');
  await expect(page.locator('.guess-row.wrong')).toHaveCount(6);
});

// ── Audio ─────────────────────────────────────────────────────────────────
test('play button is enabled', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#play-btn')).not.toBeDisabled();
});

// ── Keyboard ──────────────────────────────────────────────────────────────
test('Enter key submits a guess', async ({ page }) => {
  await page.goto('/');
  await page.fill('#guess-input', 'Razorbill');
  await page.press('#guess-input', 'Enter');
  await expect(page.locator('.guess-row:not(.empty)')).toHaveCount(1);
});

// ── Responsive ───────────────────────────────────────────────────────────
test('renders at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('#guess-input')).toBeVisible();
  await expect(page.locator('#submit-btn')).toBeVisible();
});
