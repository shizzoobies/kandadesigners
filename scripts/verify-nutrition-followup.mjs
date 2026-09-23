import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

// Reuse the existing local production-tools installation. No package install.
const require = createRequire('file:///D:/kap-reel/node_modules/');
const { chromium } = require('playwright');
const base = process.env.NUTRITION_QA_URL || 'http://127.0.0.1:62121/training-samples/nutrition/';
const out = path.resolve('docs/training-upgrades/nutrition-qa');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { base, browser: 'Existing Playwright Chromium fallback', workbook: [], audioRetry: null };
try {
  for (const [width, height] of [[360, 800], [768, 1024], [1280, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: false });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(base, { waitUntil: 'load' });
    await page.getByRole('link', { name: 'Open the complete reference workbook' }).click();
    await page.waitForLoadState('load');
    await page.evaluate(() => document.fonts.ready);
    assert.match(page.url(), /workbook\.html$/);
    const state = await page.evaluate(() => ({
      width: innerWidth, documentWidth: document.documentElement.scrollWidth,
      scripts: document.scripts.length,
      headings: [...document.querySelectorAll('h2')].map(h => h.textContent),
      audioControls: document.querySelectorAll('audio[controls]').length
    }));
    assert.equal(state.documentWidth, width, 'Workbook must not overflow horizontally');
    assert.equal(state.scripts, 0, 'Workbook must be script-free');
    assert.equal(state.audioControls, 0);
    assert.equal(state.headings.length, 9, 'Full workbook coverage');
    await page.screenshot({ path: path.join(out, `nutrition-workbook-${width}-opening.png`) });
    await page.locator('summary').click();
    assert.equal(await page.locator('details').getAttribute('open'), '');
    assert.equal(await page.locator('details tbody tr').count(), 8);
    await page.locator('#label').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(out, `nutrition-workbook-${width}-label.png`) });
    await page.locator('#plate-notes').fill('Broccoli in the vegetable half.');
    assert.equal(await page.locator('#plate-notes').inputValue(), 'Broccoli in the vegetable half.');
    await page.getByRole('checkbox').first().check();
    assert.equal(await page.getByRole('checkbox').first().isChecked(), true);
    assert.equal(await page.getByRole('checkbox').count(), 6);
    assert.equal(errors.length, 0, errors.join('\n'));
    report.workbook.push({ width, height, javaScriptEnabled: false, ...state, foodExplanations: 8, nativeSwaps: 6, errors });
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  let attempts = 0;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/assets/audio/screen-1.mp3', route => {
    attempts++;
    return attempts === 1 ? route.fulfill({ status: 503, contentType: 'text/plain', body: 'Intentional transient media failure' }) : route.continue();
  });
  await page.goto(base, { waitUntil: 'load' });
  await page.getByRole('button', { name: 'Listen to the guide Audio + transcript' }).click();
  await page.waitForFunction(() => document.querySelector('audio').error !== null);
  const failed = await page.evaluate(() => ({
    code: document.querySelector('audio').error.code,
    transcriptVisible: !document.querySelector('#audio-tray').hidden,
    feedbackVisible: !document.querySelector('#audio-error').hidden,
    playingIndicator: document.querySelector('.course').classList.contains('is-playing')
  }));
  assert.equal(failed.transcriptVisible, true);
  assert.equal(failed.feedbackVisible, true);
  assert.equal(failed.playingIndicator, false);
  await page.screenshot({ path: path.join(out, 'nutrition-audio-retry-failed.png') });
  await page.getByRole('button', { name: 'Listen to the guide Audio + transcript' }).click();
  await page.waitForFunction(() => {
    const audio = document.querySelector('audio');
    return !audio.paused && audio.readyState === 4 && audio.currentTime > 0.4;
  });
  const recovered = await page.evaluate(() => ({
    time: document.querySelector('audio').currentTime,
    paused: document.querySelector('audio').paused,
    readyState: document.querySelector('audio').readyState,
    error: document.querySelector('audio').error,
    feedbackHidden: document.querySelector('#audio-error').hidden,
    playingIndicator: document.querySelector('.course').classList.contains('is-playing')
  }));
  assert.ok(attempts >= 2);
  assert.equal(recovered.error, null);
  assert.equal(recovered.feedbackHidden, true);
  assert.equal(recovered.playingIndicator, true);
  await page.screenshot({ path: path.join(out, 'nutrition-audio-retry-recovered.png') });
  await page.getByRole('button', { name: 'Pause the guide Audio + transcript' }).click();
  assert.equal(await page.evaluate(() => document.querySelector('audio').paused), true);
  assert.equal(errors.length, 0, errors.join('\n'));
  report.audioRetry = { attempts, failed, recovered, pageErrors: errors, expectedNetworkFailure: 'One intentionally mocked HTTP 503 response' };
  await context.close();
  await fs.writeFile(path.join(out, 'nutrition-followup-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
