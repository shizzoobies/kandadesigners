// Focused local regression coverage for the safety sample, without external requests.
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { serveDist } from './lib/serve-dist.mjs';

const require = createRequire('file:///D:/kap-reel/node_modules/');
const { chromium } = require('playwright');
let axePath;
try { axePath = require.resolve('axe-core/axe.min.js'); } catch {}
const root = process.env.FIT_ROOT || 'public';
const out = path.resolve('output/playwright/safety-upgrade');
await mkdir(out, { recursive: true });
const report = { time: new Date().toISOString(), root, files: {}, viewports: [], failures: [], axeAvailable: Boolean(axePath) };
const topicFiles = [4, 5, 6].flatMap(screen => ['a', 'b', 'c'].map(tab => `assets/img/topic-${screen}${tab}.svg`));
const activityFiles = [...Array.from({ length: 6 }, (_, i) => 'h' + (i + 1)), ...Array.from({ length: 8 }, (_, i) => 'g' + (i + 1))].map(key => `assets/img/activity-${key}.svg`);
for (const name of ['index.html', 'style.css', 'premium.css', 'app.js', 'activities.js', 'activity-data.js', 'narration.js', 'assets/img/course-guide-v1.webp', ...topicFiles, ...activityFiles]) {
  report.files[name] = createHash('sha256').update(await readFile(path.join(root, 'training-samples/safety', name))).digest('hex');
}
const { origin, close } = await serveDist(root);
const browser = await chromium.launch();
try {
  for (const [width, height] of [[360, 800], [768, 1024], [1280, 900], [900, 700], [1280, 700]]) {
    const result = { width, height, checks: 0, screens: [], audio: [], topics: [], errors: [], badResponses: [], axe: [], clipping: [] };
    report.viewports.push(result);
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width <= 768, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    await page.route('**/*', route => {
      if (route.request().url().startsWith(origin + '/')) return route.continue();
      result.errors.push('Blocked external request: ' + route.request().url());
      return route.abort();
    });
    page.on('pageerror', error => result.errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) result.badResponses.push({ status: response.status(), url: response.url() }); });
    const check = (ok, label, detail) => {
      result.checks++;
      if (!ok) report.failures.push({ viewport: `${width}x${height}`, label, detail });
    };
    const horizontal = async label => {
      const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      check(sizes.scroll <= sizes.client + 1, 'No horizontal overflow: ' + label, sizes);
      const clips = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => {
        if (!(el instanceof HTMLElement) || !el.checkVisibility() || !el.textContent.trim() || el.clientHeight < 20) return false;
        const css = getComputedStyle(el);
        return ['hidden', 'clip'].includes(css.overflowY) && el.scrollHeight > el.clientHeight + 3;
      }).map(el => ({ element: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.trim().split(/\s+/)[0] : ''), clientHeight: el.clientHeight, scrollHeight: el.scrollHeight, text: el.textContent.trim().slice(0, 100) })));
      if (clips.length) result.clipping.push({ state: label, candidates: clips });
    };
    const expectText = async (selector, expression, label) => {
      const text = await page.locator(selector).textContent();
      check(expression.test(text), label, text);
    };
    const closeInspectionWithEscape = async () => {
      // dialog.open becomes false before the queued close event restores focus.
      // Wait for that event before focusing or closing the separate audio tray.
      await page.evaluate(() => {
        window.__safetyInspectionClosed = false;
        document.getElementById('inspection-dialog').addEventListener('close', () => { window.__safetyInspectionClosed = true; }, { once: true });
      });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => window.__safetyInspectionClosed && document.activeElement === document.getElementById('enlarge-scene'));
    };
    const checkTray = async screen => {
      check(await page.locator('#narration-tray').isVisible(), 'Inline audio tray visible screen ' + screen);
      check(await page.locator('#open-narration').getAttribute('aria-expanded') === 'true', 'Audio tray expanded state screen ' + screen);
      check(await page.locator(':modal').count() === 0, 'Audio opens without modal screen ' + screen);
      const guide = page.locator('#narration-tray img.course-guide');
      check(await guide.isVisible(), 'Course guide visible in audio tray screen ' + screen);
      await guide.evaluate(el => el.decode());
      check(await guide.evaluate(el => el.complete && el.naturalWidth > 0 && el.getAttribute('src') === 'assets/img/course-guide-v1.webp'), 'Course guide image decoded screen ' + screen);
      const layout = await page.evaluate(i => {
        const main = document.querySelector('main').getBoundingClientRect();
        const tray = document.getElementById('narration-tray').getBoundingClientRect();
        const heading = document.querySelector('#screen-' + i + ' h2');
        const rect = heading.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return { mainBottom: main.bottom, trayTop: tray.top, headingTop: rect.top, headingBottom: rect.bottom, headingVisible: Boolean(hit && (hit === heading || heading.contains(hit))) };
      }, screen);
      check(layout.mainBottom <= layout.trayTop + 1, 'Tray reserves space below lesson screen ' + screen, layout);
      check(layout.headingTop >= 0 && layout.headingBottom <= layout.trayTop + 1 && layout.headingVisible, 'Lesson heading remains visible during audio screen ' + screen, layout);
      const transcript = await page.locator('#narration-copy').textContent();
      const expected = await page.evaluate(i => window.safetyNarration[i - 1], screen);
      check(transcript === expected && transcript.trim().length > 40, 'Current-screen transcript ' + screen);
      await expectText('#narration-title', new RegExp('Screen ' + screen + ' introduction'), 'Narration title ' + screen);
      const tail = await page.locator('#narration-copy').evaluate(el => {
        for (let p = el; p && p !== document.body; p = p.parentElement) {
          if (['auto', 'scroll'].includes(getComputedStyle(p).overflowY)) p.scrollTop = p.scrollHeight;
        }
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let last;
        while (walker.nextNode()) if (walker.currentNode.textContent.trim()) last = walker.currentNode;
        if (!last) return { visible: false };
        const range = document.createRange();
        range.setStart(last, Math.max(0, last.textContent.length - 1));
        range.setEnd(last, last.textContent.length);
        const rect = range.getBoundingClientRect();
        let top = 0;
        let bottom = document.querySelector('footer').getBoundingClientRect().top;
        for (let p = el; p; p = p.parentElement) {
          if (['auto', 'scroll', 'hidden', 'clip'].includes(getComputedStyle(p).overflowY)) {
            const r = p.getBoundingClientRect();
            top = Math.max(top, r.top);
            bottom = Math.min(bottom, r.bottom);
          }
        }
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return { visible: rect.top >= top - 1 && rect.bottom <= bottom + 1 && Boolean(hit && (hit === el || el.contains(hit))), top: rect.top, bottom: rect.bottom, viewportTop: top, viewportBottom: bottom };
      });
      check(tail.visible, 'Full transcript end is scroll-reachable screen ' + screen, tail);
      await horizontal('audio tray ' + screen);
    };
    try {
      await page.goto(origin + '/training-samples/safety/', { waitUntil: 'networkidle' });
      if (axePath) await page.addScriptTag({ path: axePath });
      check(await page.locator('#narration-audio').evaluate(a => a.paused && !a.currentSrc), 'Audio starts idle without source');
      check(await page.locator('.stamp, .topic-eyebrow').count() === 0, 'Decorative numeric stamps and topic eyebrows removed');
      check(!/\b09\s*min/i.test(await page.locator('body').textContent()), 'Duration uses natural number formatting');
      check(await page.locator('#narration-audio').evaluate(a => !a.controls), 'Native audio controls disabled');
      check(await page.locator('#close-narration').getAttribute('aria-label') === 'Hide audio' || /Hide audio/.test(await page.locator('#close-narration').textContent()), 'Audio dismissal has descriptive label');
      check(await page.getByRole('button', { name: 'Hide audio', exact: true, includeHidden: true }).count() === 1, 'Audio dismissal accessible name');
      check(await page.getByRole('button', { name: 'Back to lesson', exact: true, includeHidden: true }).count() === 1, 'Inspection dismissal accessible name');
      check(await page.getByRole('button', { name: 'Return to course', exact: true, includeHidden: true }).count() === 1, 'Completion dismissal accessible name');
      const audioButton = page.locator('#open-narration');
      check(await page.getByRole('button', { name: 'Play introduction', exact: true }).isVisible(), 'Audio button has clear accessible name');
      check(await audioButton.getAttribute('aria-haspopup') === null, 'Audio launcher does not announce modal');
      check(await audioButton.getAttribute('aria-controls') === 'narration-tray' && await audioButton.getAttribute('aria-expanded') === 'false', 'Audio launcher controls collapsed tray');
      check(await audioButton.evaluate(el => Boolean(el.closest('footer'))), 'Audio launcher sits in footer');
      check(await page.locator('#narration-tray').isHidden(), 'Audio tray initially hidden');
      check(await audioButton.evaluate(el => /Play introduction/.test(el.innerText) && /Audio\s*\+\s*transcript/.test(el.innerText)), 'Audio button visibly explains playback and transcript');
      for (let screen = 1; screen <= 10; screen++) {
        const active = page.locator('#screen-' + screen);
        check(await active.isVisible(), 'Screen navigation reaches ' + screen);
        await expectText('#progress-text', new RegExp('Screen ' + screen + ' of 10'), 'Progress screen ' + screen);
        const heading = await active.locator('h2').textContent();
        result.screens.push({ screen, heading });
        await horizontal('screen ' + screen);

        await page.locator('#open-narration').click();
        await page.waitForFunction(() => {
          const a = document.getElementById('narration-audio');
          return a.error || (Number.isFinite(a.duration) && a.duration > 0 && a.currentTime > 0.05);
        }, null, { timeout: 10000 });
        const audio = await page.locator('#narration-audio').evaluate(a => ({ duration: a.duration, currentTime: a.currentTime, paused: a.paused, error: a.error?.message || null, src: a.getAttribute('src') }));
        result.audio.push({ screen, ...audio });
        check(audio.duration > 0 && audio.currentTime > 0 && !audio.paused && !audio.error, 'User-started playback screen ' + screen, audio);
        await expectText('#guide-state', /^Speaking$/, 'Guide indicates actual playback screen ' + screen);
        check(await page.locator('#narration-tray').evaluate(el => el.classList.contains('is-speaking')), 'Guide speaking treatment during playback screen ' + screen);
        check(audio.src.endsWith('screen-' + screen + '.mp3'), 'Correct MP3 screen ' + screen);
        await checkTray(screen);
        check(await page.getByRole('button', { name: 'Pause audio', exact: true }).isVisible(), 'Custom pause control visible during playback screen ' + screen);
        check(await page.locator('#audio-time').evaluate(el => /\d+:\d{2}\s*\/\s*\d+:\d{2}/.test(el.innerText)), 'Custom player displays elapsed and total screen ' + screen);
        if (screen === 1) {
          await page.locator('#audio-toggle').click();
          await page.waitForFunction(() => document.getElementById('narration-audio').paused);
          check(await page.getByRole('button', { name: 'Play audio', exact: true }).isVisible(), 'Pause changes custom button to Play audio');
          await expectText('#guide-state', /^Paused$/, 'Guide reports manually paused audio');
          check(await page.locator('#narration-tray').evaluate(el => !el.classList.contains('is-speaking')), 'Paused guide has no speaking treatment');
          const seek = page.getByRole('slider', { name: 'Audio position', exact: true });
          const seekBounds = await seek.evaluate(el => ({ min: Number(el.min), max: Number(el.max), step: Number(el.step), duration: document.getElementById('narration-audio').duration }));
          check(seekBounds.min === 0 && Math.abs(seekBounds.max - seekBounds.duration) < 0.2 && seekBounds.step === 0.1, 'Seek bounds follow audio duration', seekBounds);
          await seek.focus();
          await page.keyboard.press('Home');
          for (let key = 0; key < 12; key++) await page.keyboard.press('ArrowRight');
          const sought = await seek.evaluate(el => ({ value: Number(el.value), time: document.getElementById('narration-audio').currentTime, paused: document.getElementById('narration-audio').paused }));
          check(sought.value > 0 && Math.abs(sought.value - sought.time) <= 0.2 && sought.paused, 'Keyboard seeking updates paused audio position', sought);
          await page.getByRole('button', { name: 'Mute audio', exact: true }).click();
          check(await page.locator('#narration-audio').evaluate(a => a.muted), 'Custom mute changes actual audio');
          await page.getByRole('button', { name: 'Unmute audio', exact: true }).click();
          check(await page.locator('#narration-audio').evaluate(a => !a.muted), 'Custom unmute restores actual audio');
          await page.getByRole('button', { name: 'Play audio', exact: true }).click();
          await page.waitForFunction(t => {
            const a = document.getElementById('narration-audio');
            return !a.paused && !a.seeking && a.readyState >= 3 && a.currentTime > t + 0.05 && document.getElementById('guide-state').textContent === 'Speaking';
          }, sought.time);
          await expectText('#guide-state', /^Speaking$/, 'Custom resume restores speaking state');
          if (axePath) {
            const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })));
            result.axe.push({ screen, state: 'audio tray open with custom controls', violations });
            check(!violations.length, 'Axe open audio tray and custom controls', violations);
          }
          await page.screenshot({ path: path.join(out, `audio-controls-${width}x${height}.png`) });
        }
        if (screen === 4) {
          await page.locator('#tab-4b').click();
          check(await page.locator('#tab-4b').getAttribute('aria-selected') === 'true' && await page.locator('#narration-audio').evaluate(a => !a.paused), 'Teaching tabs usable while audio plays');
          await page.keyboard.press('Escape');
          check(await page.locator('#narration-tray').isVisible(), 'Escape from lesson does not close audio tray');
          await page.locator('#next').click();
          await checkTray(5);
          check(await page.locator('#narration-audio').evaluate(a => a.paused && a.getAttribute('src').endsWith('screen-5.mp3')), 'Navigation pauses previous audio and updates source');
          await expectText('#guide-state', /^Ready$/, 'Guide ready after forward navigation');
          check(await page.locator('#narration-tray').evaluate(el => !el.classList.contains('is-speaking')), 'Forward navigation removes speaking treatment');
          await audioButton.click();
          await page.waitForFunction(() => { const a = document.getElementById('narration-audio'); return !a.paused && !a.seeking && a.readyState >= 3 && a.currentTime > 0.05; });
          check(await page.locator('#narration-audio').evaluate(a => !a.paused), 'Explicit playback resumes on new screen');
          await page.locator('#prev').click();
          await checkTray(4);
          check(await page.locator('#narration-audio').evaluate(a => a.paused && a.getAttribute('src').endsWith('screen-4.mp3')), 'Backward navigation keeps tray updated and paused');
          await expectText('#guide-state', /^Ready$/, 'Guide ready after backward navigation');
          check(await page.locator('#narration-tray').evaluate(el => !el.classList.contains('is-speaking')), 'Backward navigation removes speaking treatment');
          await audioButton.click();
          await page.waitForFunction(() => document.getElementById('narration-audio').currentTime > 0.1);
          const before = await page.locator('#narration-audio').evaluate(a => a.currentTime);
          await audioButton.click();
          check(await page.locator('#narration-audio').evaluate((a, t) => !a.paused && a.currentTime >= t, before), 'Repeated launcher preserves playback position');
          await page.screenshot({ path: path.join(out, `audio-open-${width}x${height}.png`) });
        }
        if (screen === 7) {
          await page.locator('#enlarge-scene').click();
          await closeInspectionWithEscape();
          check(await page.locator('#inspection-dialog').evaluate(el => !el.open) && await page.locator('#narration-tray').isVisible(), 'Other dialog Escape leaves audio tray open');
        }
        if (screen % 2) {
          await page.locator('#narration-title').focus();
          await page.keyboard.press('Escape');
        }
        else await page.locator('#close-narration').click();
        await page.waitForFunction(() => document.getElementById('narration-tray').hidden && document.getElementById('narration-audio').paused);
        check(await audioButton.getAttribute('aria-expanded') === 'false', 'Closed tray collapses launcher screen ' + screen);
        check(await page.locator('#open-narration').evaluate(el => el === document.activeElement), 'Narration close focus return ' + screen);

        const tabsets = active.locator('[role="tablist"]');
        for (let set = 0; set < await tabsets.count(); set++) {
          const tabs = tabsets.nth(set).locator('[role="tab"]');
          if (!(await tabs.first().isVisible())) continue;
          await tabs.first().focus();
          if (await tabs.count() > 1) {
            await page.keyboard.press('ArrowRight');
            check(await tabs.nth(1).evaluate(el => el === document.activeElement && el.getAttribute('aria-selected') === 'true'), 'Keyboard tab selection screen ' + screen);
            await horizontal('keyboard tab screen ' + screen);
          }
          await tabs.first().click();
        }

        if ([4, 5, 6].includes(screen)) {
          check(await active.locator('.split-media').count() === 0, 'Old static teaching media removed screen ' + screen);
          const tabs = active.locator('[role="tab"]');
          for (let i = 0; i < await tabs.count(); i++) {
            await tabs.nth(i).click();
            const key = String(screen) + String.fromCharCode(97 + i);
            const panel = active.locator('#pan-' + key);
            const image = panel.locator('figure.topic-visual img');
            const expectedSrc = 'assets/img/topic-' + key + '.svg';
            check(await active.locator('figure.topic-visual:visible').count() === 1 && await image.isVisible(), 'Tab shows only its topic visual ' + key);
            const src = await image.getAttribute('src');
            check(src === expectedSrc, 'Topic visual matches active tab ' + key, { src, expectedSrc });
            await image.evaluate(el => el.decode());
            const intrinsic = await image.evaluate(el => ({ loaded: el.complete && el.naturalWidth > 0, width: el.naturalWidth, height: el.naturalHeight }));
            check(intrinsic.loaded && intrinsic.width > intrinsic.height, 'Topic visual loads as landscape ' + key, intrinsic);
            const caption = panel.locator('figure.topic-visual figcaption');
            const title = (await caption.locator('strong').textContent()).trim();
            const text = (await caption.textContent()).trim();
            check(title.length > 0 && text.length > title.length + 5, 'Topic caption has title and explanation ' + key);
            result.topics.push({ key, src, title, ...intrinsic });
            await horizontal('topic visual ' + key);
            const lastItem = active.locator('[role="tabpanel"]:visible li').last();
            await lastItem.scrollIntoViewIfNeeded();
            const geometry = await lastItem.evaluate(el => {
              const item = el.getBoundingClientRect();
              let top = 0;
              let bottom = innerHeight;
              for (let p = el.parentElement; p; p = p.parentElement) {
                if (['auto', 'scroll', 'hidden', 'clip'].includes(getComputedStyle(p).overflowY)) {
                  const r = p.getBoundingClientRect();
                  top = Math.max(top, r.top);
                  bottom = Math.min(bottom, r.bottom);
                }
              }
              const at = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(1, item.left + item.width / 2)), Math.min(bottom - 1, item.bottom - 2));
              return { itemTop: item.top, itemBottom: item.bottom, visibleTop: top, visibleBottom: bottom, unobstructed: Boolean(at && (at === el || el.contains(at))) };
            });
            check(geometry.itemBottom <= geometry.visibleBottom + 2 && geometry.itemBottom > geometry.visibleTop && geometry.unobstructed, `Last teaching bullet reachable and unobstructed screen ${screen}, tab ${i + 1}`, geometry);
            await page.screenshot({ path: path.join(out, `teaching-${screen}-tab-${i + 1}-bottom-${width}x${height}.png`) });
            await caption.scrollIntoViewIfNeeded();
            const captionGeometry = await caption.evaluate(el => {
              const rect = el.getBoundingClientRect();
              const footer = document.querySelector('footer').getBoundingClientRect();
              let top = 0;
              let bottom = Math.min(innerHeight, footer.top);
              let left = 0;
              let right = innerWidth;
              for (let p = el.parentElement; p; p = p.parentElement) {
                const css = getComputedStyle(p);
                const bounds = p.getBoundingClientRect();
                if (['auto', 'scroll', 'hidden', 'clip'].includes(css.overflowY)) {
                  top = Math.max(top, bounds.top);
                  bottom = Math.min(bottom, bounds.bottom);
                }
                if (['auto', 'scroll', 'hidden', 'clip'].includes(css.overflowX)) {
                  left = Math.max(left, bounds.left);
                  right = Math.min(right, bounds.right);
                }
              }
              // Test inside the rounded figure's content box. Two-pixel corner
              // samples land outside its eight-pixel radius despite no overlap.
              const inset = 10;
              const points = [
                [rect.left + rect.width / 2, rect.top + rect.height / 2],
                [rect.left + inset, rect.top + inset], [rect.right - inset, rect.top + inset],
                [rect.left + inset, rect.bottom - inset], [rect.right - inset, rect.bottom - inset],
              ];
              const hits = points.map(([x, y]) => {
                const hit = document.elementFromPoint(x, y);
                return Boolean(hit && (hit === el || el.contains(hit)));
              });
              return {
                top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right,
                visibleTop: top, visibleBottom: bottom, visibleLeft: left, visibleRight: right,
                footerTop: footer.top, unobstructed: hits.every(Boolean), hits,
              };
            });
            check(
              captionGeometry.top >= captionGeometry.visibleTop - 1 &&
              captionGeometry.bottom <= captionGeometry.visibleBottom + 1 &&
              captionGeometry.bottom <= captionGeometry.footerTop + 1 &&
              captionGeometry.left >= captionGeometry.visibleLeft - 1 &&
              captionGeometry.right <= captionGeometry.visibleRight + 1 &&
              captionGeometry.unobstructed,
              'Topic caption fully reachable above footer and unobstructed ' + key,
              captionGeometry,
            );
            await page.screenshot({ path: path.join(out, `topic-${key}-${width}x${height}.png`) });
          }
          await tabs.first().click();
          await active.locator('.screen-body').evaluate(el => { el.scrollTop = 0; });
          await page.screenshot({ path: path.join(out, `teaching-${screen}-top-${width}x${height}.png`) });
        }

        if (screen === 7) {
          check(await page.locator('#next').isDisabled(), 'Hunt initially gates next');
          await page.locator('#location-guides').click();
          check(await page.locator('#scene').evaluate(el => el.classList.contains('show-guides')), 'Location guides on');
          check(await page.locator('#location-guides').getAttribute('aria-pressed') === 'true', 'Location guides announced');
          await page.locator('#location-guides').click();
          check(await page.locator('#scene').evaluate(el => !el.classList.contains('show-guides')), 'Location guides off');
          await page.locator('#enlarge-scene').click();
          check(await page.locator('#inspection-dialog').evaluate(el => el.open), 'Enlarged scene opens');
          await horizontal('enlarged scene');
          await closeInspectionWithEscape();
          check(await page.locator('#enlarge-scene').evaluate(el => el === document.activeElement), 'Enlarged scene Escape focus return');
          const keys = ['ladder', 'edge', 'cord', 'door', 'worker', 'exit'];
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            await page.locator((i % 2 ? '.spot' : '.hot') + '[data-spot="' + key + '"]').click();
            await expectText('#hunt-counter', new RegExp('Found ' + (i + 1) + ' of 6'), 'Hunt counts ' + key);
            await page.locator((i % 2 ? '.hot' : '.spot') + '[data-spot="' + key + '"]').click();
            await expectText('#hunt-counter', new RegExp('Found ' + (i + 1) + ' of 6'), 'Repeated selection does not double-count ' + key);
            check(await page.locator('[data-spot="' + key + '"][aria-pressed="true"]').count() === 2, 'Hotspot and list synchronize ' + key);
            await horizontal('hazard feedback ' + key);
          }
          check(await page.locator('#next').isEnabled(), 'All six unlock next');
          await page.screenshot({ path: path.join(out, `hunt-${width}x${height}.png`) });
        }

        if (screen === 8) {
          await page.locator('#tab-8b').click();
          const keys = Array.from({ length: 6 }, (_, i) => 'h' + (i + 1));
          const tally = () => page.evaluate(k => window.safetyActivities.tally(k), keys);
          const selectSituation = async key => {
            await page.locator('#control-location').selectOption(key);
            check(await active.locator('[data-control-card]:visible').count() === 1 && await active.locator(`[data-control-card="${key}"]`).isVisible(), 'Only selected workbench situation is displayed ' + key);
          };
          const workbenchFit = async label => {
            if (width > 640 && width < 900) return;
            const fit = await active.evaluate(el => {
              const overflow = [...el.querySelectorAll('.screen-body, .workshop-panel, .control-rack, [data-control-card]')]
                .filter(node => node.checkVisibility() && node.clientHeight > 0 && node.scrollHeight > node.clientHeight + 2)
                .map(node => ({ element: node.id || node.className, height: node.clientHeight, contentHeight: node.scrollHeight }));
              const card = [...el.querySelectorAll('[data-control-card]')].find(node => node.checkVisibility());
              const rack = el.querySelector('.control-rack');
              return { overflow, cardBottom: card?.getBoundingClientRect().bottom ?? null, rackBottom: rack.checkVisibility() ? rack.getBoundingClientRect().bottom : null, footerTop: document.querySelector('footer').getBoundingClientRect().top };
            });
            check(fit.overflow.length === 0 && (fit.cardBottom === null || fit.cardBottom <= fit.footerTop + 1) && (fit.rackBottom === null || fit.rackBottom <= fit.footerTop + 1), 'Workbench fits without scrolling: ' + label, fit);
          };
          let toolkitCaptured = false;
          const openToolkit = async () => {
            if (width > 640) return;
            if (!(await active.locator('[data-tool]:visible').count())) await page.locator('#control-picker').click();
            check(await active.locator('[data-tool]:visible').count() === 6 && await active.locator('[data-control-card]:visible').count() === 0, 'Phone toolkit replaces situation instead of stacking below it');
            check(await page.locator('#control-picker').getAttribute('aria-expanded') === 'true', 'Phone toolkit announces expanded state');
            await workbenchFit('phone toolkit');
            if (!toolkitCaptured) {
              await page.screenshot({ path: path.join(out, `controls-toolkit-${width}x${height}.png`) });
              toolkitCaptured = true;
            }
          };
          const place = async (tool, destination) => {
            await selectSituation(destination);
            await openToolkit();
            const toolButton = page.locator(`[data-tool="${tool}"]`);
            const placeButton = page.locator(`[data-place="${destination}"]`);
            if (width <= 768) await toolButton.tap();
            else await toolButton.click();
            if (width <= 640) check(await active.locator('[data-tool]:visible').count() === 0 && await placeButton.evaluate(el => document.activeElement === el) && await page.locator('#control-picker').getAttribute('aria-expanded') === 'false', 'Phone tool selection closes picker and focuses placement');
            if (width <= 768) await placeButton.tap();
            else await placeButton.click();
          };
          const assignment = key => page.locator(`[data-place="${key}"]`).getAttribute('data-assigned');
          const unique = async label => {
            const assigned = await active.locator('[data-place]').evaluateAll(places => places.map(p => p.getAttribute('data-assigned')).filter(Boolean));
            check(new Set(assigned).size === assigned.length, label, assigned);
          };
          check(await page.locator('#control-location option').count() === 6, 'Situation selector contains all six cases');
          await selectSituation('h1');
          await page.locator('#control-next').click();
          check(await page.locator('#control-location').inputValue() === 'h2' && await active.locator('[data-control-card="h2"]').isVisible(), 'Next situation advances the selected case');
          await page.locator('#control-prev').click();
          check(await page.locator('#control-location').inputValue() === 'h1' && await active.locator('[data-control-card="h1"]').isVisible(), 'Previous situation returns to selected case');
          await workbenchFit('unsubmitted first case');
          if (await page.locator('#control-check').isEnabled()) await page.locator('#control-check').click();
          check((await tally()).answered === 0 && (await tally()).right === 0, 'Incomplete workbench earns no grading credit');
          await openToolkit();
          await page.locator('[data-tool="h1"]').focus();
          await page.keyboard.press('Enter');
          if (width <= 640) check(await active.locator('[data-tool]:visible').count() === 0 && await page.locator('[data-place="h1"]').evaluate(el => document.activeElement === el), 'Keyboard tool selection closes phone picker and focuses placement');
          await page.locator('[data-place="h1"]').focus();
          await page.keyboard.press('Space');
          check(await assignment('h1') === 'h1', 'Keyboard Enter and Space place selected control');
          await workbenchFit('placed first case before grading');
          await selectSituation('h2');
          await selectSituation('h1');
          check(await assignment('h1') === 'h1' && (await tally()).answered === 0, 'Switching situations preserves unsubmitted placement');
          await place('h2', 'h2');
          await place('h1', 'h2');
          check(await assignment('h1') === 'h2' && await assignment('h2') === 'h1', 'Occupied destination swaps previously placed controls');
          await unique('Control swap preserves tool uniqueness');
          await selectSituation('h1');
          await page.locator('[data-remove="h1"]').click();
          await expectText('#hoc-score', /Placed 1 of 6\./, 'Removing a control reduces placed count');
          check(!(await assignment('h1')), 'Remove clears its destination');
          await place('h2', 'h2');
          check(await assignment('h2') === 'h2' && await page.locator('[data-tool="h1"]').getAttribute('data-location') === '', 'Unassigned tool replaces occupant without duplicating it');
          await unique('Replacement preserves tool uniqueness');
          await page.locator('#control-reset').click();
          await expectText('#hoc-score', /Placed 0 of 6\./, 'Workbench reset clears placements');
          for (const key of keys) await place(key, key === 'h1' ? 'h2' : key === 'h2' ? 'h1' : key);
          check((await tally()).answered === 0, 'Unsubmitted complete workbench earns no grading credit');
          await page.locator('#control-check').click();
          await expectText('#hoc-score', /4 of 6 controls matched\./, 'Wrong complete workbench gets accurate score');
          check((await active.locator('.control-feedback').allTextContents()).filter(t => t.trim().length > 10).length === 6, 'Workbench provides feedback for every placement');
          await selectSituation('h1');
          check((await tally()).right === 4, 'Switching graded situation preserves wrong-result score');
          await workbenchFit('wrong feedback');
          const explanation = active.locator('[data-control-card="h1"] details.control-explanation');
          check(await explanation.getAttribute('open') === null, 'Submitted explanation initially collapsed');
          await explanation.locator('summary').click();
          check(await explanation.locator('.control-feedback').isVisible() && (await explanation.locator('.control-feedback').textContent()).trim().length > 10, 'Learner can open submitted explanation');
          await page.screenshot({ path: path.join(out, `controls-wrong-feedback-${width}x${height}.png`) });
          await explanation.locator('summary').click();
          check(await explanation.getAttribute('open') === null, 'Learner can collapse submitted explanation');
          await place('h1', 'h1');
          check((await tally()).answered === 0 && (await tally()).right === 0, 'Changing graded placement invalidates result');
          await expectText('#hoc-score', /Placed 6 of 6\./, 'Changed placement restores ungraded score');
          await selectSituation('h6');
          await page.locator('[data-remove="h6"]').click();
          if (width >= 900) {
            // Settle scrolling before mouse-down and use fresh centers so the
            // pointer begins its native drag on the actual source location.
            const source = page.locator('[data-tool="h6"]');
            const destination = page.locator('[data-place="h6"]');
            await destination.scrollIntoViewIfNeeded();
            const sourceBox = await source.boundingBox();
            const destinationBox = await destination.boundingBox();
            const dragPoints = [sourceBox, destinationBox].map(box => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 }));
            const geometry = await page.evaluate(points => points.map((point, index) => {
              const selector = index ? '[data-place="h6"]' : '[data-tool="h6"]';
              const element = document.querySelector(selector);
              const hit = document.elementFromPoint(point.x, point.y);
              return { ...point, visible: point.x >= 0 && point.x < innerWidth && point.y >= 0 && point.y < innerHeight, unobstructed: Boolean(hit && (hit === element || element.contains(hit))) };
            }), dragPoints);
            check(geometry.every(point => point.visible && point.unobstructed), 'Native drag source and destination visible and unobstructed', geometry);
            await source.evaluate(el => {
              window.__safetyNativeDrag = { start: false, drop: false };
              el.addEventListener('dragstart', () => { window.__safetyNativeDrag.start = true; }, { once: true });
              document.querySelector('[data-control-card="h6"]').addEventListener('drop', () => { window.__safetyNativeDrag.drop = true; }, { once: true });
            });
            await page.mouse.move(dragPoints[0].x, dragPoints[0].y);
            await page.mouse.down();
            await page.mouse.move(dragPoints[1].x, dragPoints[1].y, { steps: 10 });
            await page.mouse.up();
            check(await page.evaluate(() => window.__safetyNativeDrag.start && window.__safetyNativeDrag.drop), 'Real pointer emits native dragstart and drop');
            check(await assignment('h6') === 'h6', 'Desktop drag places the control');
          } else await place('h6', 'h6');
          await unique('Final workbench has six unique controls');
          await page.locator('#control-check').click();
          await expectText('#hoc-score', /6 of 6 controls matched\./, 'Corrected workbench earns full score');
          await page.locator('#tab-8a').click();
          await page.locator('#tab-8b').click();
          check((await tally()).right === 6 && (await tally()).answered === 6, 'Reopening workbench preserves submitted state');
          for (const key of keys) {
            await selectSituation(key);
            check(await assignment(key) === key && (await tally()).right === 6 && (await tally()).answered === 6, 'Graded placement survives scenario switch ' + key);
            await workbenchFit('graded ' + key);
          }
          if (width >= 900) {
            await page.locator('#control-reset').focus();
            let reachedPlacement = false;
            // The control rack follows the situation in DOM order; reverse
            // traversal crosses its six tools before reaching the placement.
            for (let step = 0; step < 14; step++) {
              await page.keyboard.press('Shift+Tab');
              reachedPlacement = await page.evaluate(() => document.activeElement.hasAttribute('data-place'));
              if (reachedPlacement) break;
            }
            check(reachedPlacement, 'Reverse keyboard navigation reaches last control placement');
            const focused = await page.evaluate(() => {
              const el = document.activeElement;
              const r = el.getBoundingClientRect();
              const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
              return { key: el.getAttribute('data-place'), top: r.top, bottom: r.bottom, unobstructed: Boolean(hit && (hit === el || el.contains(hit))), blocker: hit?.className || null };
            });
            check(focused.key === 'h6' && focused.unobstructed, 'Reverse-focused last placement center is unobstructed', focused);
            await page.screenshot({ path: path.join(out, `controls-reverse-focus-${width}x${height}.png`) });
          }
          await horizontal('completed control workbench');
          await page.screenshot({ path: path.join(out, `controls-completed-${width}x${height}.png`) });
        }

        if (screen === 9) {
          const keys = Array.from({ length: 8 }, (_, i) => 'g' + (i + 1));
          const tally = () => page.evaluate(k => window.safetyActivities.tally(k), keys);
          const inspect = async key => {
            const location = page.locator(`[data-finding="${key}"]`);
            if (width <= 768) await location.tap();
            else await location.click();
            check(await page.locator(`[data-finding="${key}"]`).getAttribute('data-inspected') === 'true', 'Audit inspection recorded ' + key);
            check((await page.locator('#audit-detail').textContent()).trim().length > 20, 'Audit shows location evidence ' + key);
            check(await page.locator('.audit-evidence-title').evaluate(el => document.activeElement === el), 'Audit location moves focus to field notes ' + key);
          };
          if (await page.locator('#audit-check').isEnabled()) await page.locator('#audit-check').click();
          check((await tally()).answered === 0 && (await tally()).right === 0, 'Uninspected audit earns no grading credit');
          await inspect('g1');
          await page.locator('#audit-back').click();
          check(await page.locator('[data-finding="g1"]').evaluate(el => document.activeElement === el), 'Field notes return control restores selected location focus');
          await inspect('g1');
          await page.locator('#audit-flag').focus();
          await page.keyboard.press('Space');
          check(await page.locator('#audit-flag').getAttribute('aria-pressed') === 'true', 'Keyboard marks audit hold');
          await page.locator('#audit-reset').click();
          await expectText('#sg-score', /Inspected 0 of 8\. 0 holds\./, 'Audit reset clears inspections and holds');
          const wrongHolds = new Set(['g1', 'g4', 'g5', 'g8']);
          for (const key of keys) {
            await inspect(key);
            if (wrongHolds.has(key)) await page.locator('#audit-flag').click();
          }
          check((await tally()).answered === 0, 'Fully inspected unsubmitted audit earns no credit');
          await page.locator('#audit-check').click();
          await expectText('#sg-score', /6 of 8 decisions supported\./, 'Flagged safe location and missed hazard score six');
          check(await page.locator('#audit-results .audit-result[data-result]').count() === 8, 'Audit returns feedback for all eight locations');
          await page.screenshot({ path: path.join(out, `audit-wrong-feedback-${width}x${height}.png`) });
          await inspect('g1');
          check(await page.locator('#audit-flag').getAttribute('aria-pressed') === 'true' && (await tally()).right === 6, 'Reopening audited location preserves hold and grade');
          await page.locator('#audit-flag').click();
          check((await tally()).answered === 0 && (await tally()).right === 0, 'Changing audit hold invalidates previous grade');
          await inspect('g2');
          check(await page.locator('#audit-flag').getAttribute('aria-pressed') === 'false', 'Missed hazard remains unflagged until corrected');
          await page.locator('#audit-flag').click();
          await page.locator('#audit-check').click();
          await expectText('#sg-score', /8 of 8 decisions supported\./, 'Corrected audit earns full score');
          check((await tally()).answered === 8 && (await tally()).right === 8, 'Audit completion tally uses submitted result');
          await horizontal('completed site audit');
          await page.screenshot({ path: path.join(out, `audit-completed-${width}x${height}.png`) });
        }

        if (screen === 10) {
          await page.locator('#tab-10a').click();
          const boxes = active.locator('input[type="checkbox"]:visible');
          await boxes.first().check();
          await boxes.nth(1).check();
          await page.locator('#tab-10b').click();
          check((await page.locator('#card-body').textContent()).trim().length > 30, 'Checklist builds card');
          await horizontal('completed checklist');
        }

        if (axePath) {
          const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })));
          result.axe.push({ screen, violations });
          check(!violations.length, 'Axe screen ' + screen, violations);
        }
        if ([1, 5, 7, 9, 10].includes(screen)) {
          const names = { 1: 'cover', 5: 'teaching', 7: 'hunt-feedback', 9: 'quiz', 10: 'final-card' };
          await page.screenshot({ path: path.join(out, `${names[screen]}-${width}x${height}.png`) });
        }
        await page.locator('#next').click();
      }
      check(result.topics.length === 9 && new Set(result.topics.map(topic => topic.src)).size === 9, 'All nine topic visuals are unique and exercised');
      check(await page.locator('#done').evaluate(el => el.open), 'Finish opens summary');
      await expectText('#done-hunt', /6 of 6/, 'Finish hunt score');
      await expectText('#done-controls', /6 of 6/, 'Finish controls score');
      await expectText('#done-calls', /8 of 8/, 'Finish calls score');
      await expectText('#done-checks', /2/, 'Finish checklist count');
      await page.locator('#done-restart').click();
      check(await page.locator('#screen-1').isVisible(), 'Restart returns to cover');
      check(await page.locator('[data-q]').count() === 0, 'Legacy multiple-choice quiz controls removed');
      check(await page.locator('[data-place]').evaluateAll(places => places.every(p => !p.getAttribute('data-assigned'))), 'Restart clears every control placement');
      check(await page.locator('[data-finding]').evaluateAll(findings => findings.every(f => f.getAttribute('data-inspected') === 'false' && f.getAttribute('data-hold') === 'false')), 'Restart clears every audit inspection and hold');
      const resetTally = await page.evaluate(() => window.safetyActivities.tally(['h1','h2','h3','h4','h5','h6','g1','g2','g3','g4','g5','g6','g7','g8']));
      check(resetTally.answered === 0 && resetTally.right === 0, 'Restart clears both submitted activity scores', resetTally);
      check(await page.locator('input[type="checkbox"]:checked').count() === 0, 'Restart clears checklist');
      await expectText('#hunt-counter', /Found 0 of 6/, 'Restart clears hunt');
      for (let i = 1; i < 7; i++) await page.locator('#next').click();
      check(await page.locator('#next').isDisabled(), 'Restart restores hunt gate');
      await page.locator('#reveal').click();
      await expectText('#hunt-counter', /Found 6 of 6/, 'Assistance reveals all');
      check(await page.locator('#next').isEnabled(), 'Assistance unlocks next');
      await page.locator('.spot[data-spot="cord"]').click();
      await expectText('#hunt-counter', /Found 6 of 6/, 'Assisted selection does not double-count');
      check((await page.locator('#hunt-verdict').textContent()).includes('Next move'), 'Assisted locations still teach');
      check(result.errors.length === 0, 'No runtime errors', result.errors);
      check(result.badResponses.length === 0, 'No failed local assets', result.badResponses);
    } catch (error) {
      report.failures.push({ viewport: `${width}x${height}`, label: 'Test interrupted', detail: error.stack });
      await page.screenshot({ path: path.join(out, `failure-${width}x${height}.png`) }).catch(() => {});
    } finally { await context.close(); }
    console.log(`${width}x${height}: ${result.checks} checks, ${result.screens.length} screens, ${result.audio.length} audio files`);
  }
  const noScriptContext = await browser.newContext({ viewport: { width: 360, height: 800 }, javaScriptEnabled: false });
  const noScriptPage = await noScriptContext.newPage();
  const noScript = { viewport: '360x800', checks: 0, examples: 0, errors: [], badResponses: [] };
  report.noScript = noScript;
  const checkNoScript = (ok, label, detail) => {
    noScript.checks++;
    if (!ok) report.failures.push({ viewport: '360x800 without JavaScript', label, detail });
  };
  await noScriptPage.route('**/*', route => {
    if (route.request().url().startsWith(origin + '/')) return route.continue();
    noScript.errors.push('Blocked external request: ' + route.request().url());
    return route.abort();
  });
  noScriptPage.on('response', response => { if (response.status() >= 400) noScript.badResponses.push({ status: response.status(), url: response.url() }); });
  try {
    await noScriptPage.goto(origin + '/training-samples/safety/', { waitUntil: 'networkidle' });
    const examples = noScriptPage.locator('.practice-fallback article');
    noScript.examples = await examples.count();
    checkNoScript(noScript.examples === 14 && await noScriptPage.locator('.practice-fallback article:visible').count() === 14, 'All fourteen static worked examples available');
    checkNoScript(await noScriptPage.locator('.control-rack:visible, .control-board:visible, .audit-layout:visible, .activity-actions:visible, .activity-intro:visible').count() === 0, 'JavaScript-dependent activity instructions and controls hidden');
    checkNoScript(await noScriptPage.locator('[data-tool]:visible, [data-place]:visible, [data-remove]:visible, [data-finding]:visible, #audit-flag:visible, #control-check:visible, #control-reset:visible, #control-location:visible, #control-prev:visible, #control-next:visible, #control-picker:visible, #audit-check:visible, #audit-reset:visible').count() === 0, 'No dead interactive activity controls shown');
    for (let i = 0; i < noScript.examples; i++) {
      const example = examples.nth(i);
      await example.locator('summary').click();
      checkNoScript(await example.locator('details').getAttribute('open') !== null && await example.locator('details p').isVisible(), 'Native worked-example disclosure opens without JavaScript ' + (i + 1));
    }
    await noScriptPage.screenshot({ path: path.join(out, 'no-javascript-worked-examples-360x800.png') });
    checkNoScript(noScript.errors.length === 0 && noScript.badResponses.length === 0, 'No failed local fallback assets', { errors: noScript.errors, badResponses: noScript.badResponses });
  } catch (error) {
    report.failures.push({ viewport: '360x800 without JavaScript', label: 'Fallback test interrupted', detail: error.stack });
  } finally { await noScriptContext.close(); }
} finally {
  await browser.close();
  await close();
  report.passed = report.failures.length === 0;
  await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify({ passed: report.passed, failures: report.failures, report: path.join(out, 'report.json') }, null, 2));
process.exitCode = report.passed ? 0 : 1;
