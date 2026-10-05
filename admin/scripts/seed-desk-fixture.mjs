// Seeds the LOCAL D1 and R2 (.wrangler/state, the same store `astro dev`
// reads through platformProxy) with a small Post Desk for ka-performance:
// a reel, a carousel with both versions, a LinkedIn post, a story, a native
// post and an ask, mixed waiting / approved / changes, plus a Stories
// checklist with a row in every phone state (posted, due now, later today,
// tomorrow, one with a condition, +3 days, and one with a very long sticker).
// Re-running resets that desk to the fixture, and re-times today's rows
// around the clock it runs at. Local only: no Cloudflare account is touched.
//
//   node ./node_modules/wrangler/bin/wrangler.js d1 migrations apply ka-sites --local
//   node scripts/seed-desk-fixture.mjs
//
// Also adds two local-only client logins for checking access levels:
// approver@desk-fixture.test (approve) and viewer@desk-fixture.test (view).
// Set DEV_EMAIL in .dev.vars to either to see the desk as them.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getPlatformProxy } from 'wrangler';

if (process.argv.includes('--remote')) {
  console.error('This fixture is local only. There is no --remote.');
  process.exit(1);
}

const ADMIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA = path.join(ADMIN, 'seed/desk-fixture');
const SLUG = 'ka-performance';
const now = new Date();
const iso = now.toISOString();
// Post dates start tomorrow (Eastern), so nothing reads as already gone out.
const day = (n) => {
  const d = new Date(now.getTime() + n * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(d);
};
// The clock in Gainesville as HH:MM, moved by some minutes and kept inside
// today, so "due now" stays in the past and "later today" in the future.
const nyMinutes = (() => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(now).map((x) => [x.type, x.value]));
  return Number(p.hour) * 60 + Number(p.minute);
})();
const at = (shift) => {
  const m = Math.min(23 * 60 + 59, Math.max(0, nyMinutes + shift));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
const key = (item, file) => `${SLUG}/${item}/${file}`;
const media = (item, file, role, alt = '') => ({ src: key(item, file), role, alt, v: 'fixture-1' });

const reel = `${day(1)}-reel`, carousel = `${day(2)}-carousel`, linkedin = `${day(2)}-linkedin`;
const reel2 = `${day(3)}-reel`, native = `${day(3)}-native`, story = `${day(1)}-story`;

// Each item: [list, kind, date, time, title, payload, files to upload].
const ITEMS = [
  ['approve', 'reel', day(1), '09:00', 'Tempo squats for stronger knees', {
    hook: 'Slow the way down to get stronger on the way up', pillar: 'Training',
    facebook: 'Three seconds down, one second up. Tempo squats build strength around the knee without heavy loads.\n\nTry 3 sets of 8 this week and tell us how they feel.',
    instagram: 'Three seconds down, one second up.\n\nTempo squats build strength around the knee without heavy loads. Save this for leg day.\n\n#strengthtraining #kneehealth',
    firstComment: 'Book a movement screen: https://ka-performancefl.com',
    music: 'Steady Groove (licensed)', ai: { voice: false, visuals: false },
    questions: ['OK to tag the athlete in the first comment?'],
    media: [media(reel, 'reel.mp4', 'video'), media(reel, 'reel-thumb.jpg', 'thumbnail')],
    scheduled: { facebook: { id: 'mc-1001', draft: true } },
  }, [['reel.mp4', 'video/mp4'], ['reel-thumb.jpg', 'image/jpeg']]],
  ['approve', 'carousel', day(2), '12:00', 'Five warm-up mistakes', {
    hook: 'Five warm-up mistakes that cost you your best set', pillar: 'Education',
    facebook: 'Most warm-ups are too short, too static, or skipped. Here are five fixes.',
    instagram: 'Swipe for five warm-up fixes. Number 4 surprises most people.\n\n#warmup #mobility',
    ai: { voice: false, visuals: false },
    media: [
      media(carousel, 'slide-1.jpg', 'image', 'Slide 1: mistake one'),
      media(carousel, 'slide-2.jpg', 'image', 'Slide 2: mistake two'),
      media(carousel, 'slide-3.jpg', 'image', 'Slide 3: mistake three'),
      media(carousel, 'carousel-fb.mp4', 'video'),
    ],
  }, [['slide-1.jpg', 'image/jpeg'], ['slide-2.jpg', 'image/jpeg'], ['slide-3.jpg', 'image/jpeg'], ['carousel-fb.mp4', 'video/mp4']]],
  ['approve', 'linkedin', day(2), '08:30', 'What a movement screen tells a coach', {
    hook: 'What a movement screen tells a coach in ten minutes', pillar: 'Authority',
    networks: ['linkedin'],
    linkedin: 'A ten minute movement screen tells us more than an hour of guessing.\n\nHere is what we look for, page by page.',
    linkedinComment: 'Full write-up on the blog.',
    ai: { voice: false, visuals: false },
    media: [media(linkedin, 'li-1.jpg', 'image', 'Page 1'), media(linkedin, 'li-2.jpg', 'image', 'Page 2')],
  }, [['li-1.jpg', 'image/jpeg'], ['li-2.jpg', 'image/jpeg']]],
  ['approve', 'reel', day(3), '17:30', 'Client win: first pull-up', {
    hook: 'Twelve weeks to a first pull-up', pillar: 'Community',
    facebook: 'Twelve weeks ago she could not hang for ten seconds. Today: a full pull-up.',
    instagram: 'Twelve weeks. One pull-up. Huge.\n\n#clientwin',
    ai: { voice: true, visuals: false },
    media: [media(reel2, 'reel.mp4', 'video'), media(reel2, 'reel-thumb.jpg', 'thumbnail')],
  }, [['reel.mp4', 'video/mp4'], ['reel-thumb.jpg', 'image/jpeg']]],
  ['approve', 'native', day(3), '19:00', 'Facebook event reminder', {
    hook: 'Saturday open gym reminder', pillar: 'Community',
  }, []],
  ['approve', 'story', day(1), '09:30', 'Story with link sticker', {
    stickerText: 'Book a screen', stickerUrl: 'https://ka-performancefl.com/?utm_source=ig_story',
    src: key(story, 'story.jpg'), v: 'fixture-1',
  }, [['story.jpg', 'image/jpeg']]],
  ['approve', 'ask', null, null, 'Which track for the pull-up reel?', {
    detail: 'Two licensed options: Steady Groove or Bright Lift. Which fits better?',
    placeholder: 'Steady Groove or Bright Lift',
  }, []],
];
const IDS = [reel, carousel, linkedin, reel2, native, story, 'ask-reel-track'];

// The Stories checklist (its own tab on K&A's desk), in date order. Only
// today and later: past-dated rows are purged when the desk opens, so the
// "Not ticked" state is covered by tests/desk-stories.test.js instead.
// [id, date, time, sticker text, sticker URL, condition, file, ticked]
const LONG_URL = 'https://ka-performancefl.com/programs/youth-athlete-strength-and-conditioning/summer-2026-registration?utm_source=ig_story&utm_medium=link_sticker&utm_campaign=youth_summer_registration_final_week&utm_content=story_6';
const STORIES = [
  [`${day(0)}-story-am`, day(0), at(-120), 'Book a screen', 'https://ka-performancefl.com/?utm_source=ig_story', '', ['story-2.jpg', 'image/jpeg'], true],
  [`${day(0)}-story`, day(0), at(-60), 'Tempo squats, full video', 'https://ka-performancefl.com/blog/tempo-squats?utm_source=ig_story', '', ['story-3.jpg', 'image/jpeg'], false],
  [`${day(0)}-story-pm`, day(0), at(120), 'Saturday open gym', 'https://ka-performancefl.com/open-gym?utm_source=ig_story', '', ['story-4.jpg', 'image/jpeg'], false],
  [story, day(1), '09:30', 'Book a screen', 'https://ka-performancefl.com/?utm_source=ig_story', '', null, false],
  [`${day(2)}-story`, day(2), '12:30', 'Five warm-up fixes', 'https://ka-performancefl.com/blog/warm-up?utm_source=ig_story',
    'Only once the carousel is up. If the carousel moves, post this after it.', ['story-5.jpg', 'image/jpeg'], false],
  [`${day(3)}-story`, day(3), '17:45', 'First pull-up story', 'https://ka-performancefl.com/results?utm_source=ig_story', '', ['story.jpg', 'image/jpeg'], false],
  [`${day(5)}-story`, day(5), '08:15', 'Last week to sign up for youth summer strength and conditioning, spots are limited so grab one today', LONG_URL, '', ['story-6.png', 'image/png'], false],
];
for (const [id, date, time, stickerText, stickerUrl, condition, file] of STORIES) {
  // Tomorrow's row is the approval list's Story too, and shares its image.
  const src = file ? key(id, file[0]) : key(story, 'story.jpg');
  ITEMS.push(['stories', 'story', date, time, 'Story', { stickerText, stickerUrl, src, v: 'fixture-1', condition }, file ? [file] : []]);
  IDS.push(id);
}
const TICKED = STORIES.filter((r) => r[7]).map((r) => r[0]);

// Decisions: [item, decision, note, who]. The rest stay waiting.
const DECISIONS = [
  [linkedin, 'approved', '', 'alex@ka-performancefl.com'],
  [reel2, 'changes', 'Trim the first two seconds and use her first name only.', 'alex@ka-performancefl.com'],
];

const { env, dispose } = await getPlatformProxy({ configPath: path.join(ADMIN, 'wrangler.jsonc'), persist: true, remoteBindings: false });
try {
  const db = env.DB;
  const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'desk_items'").first();
  if (!tables) throw new Error('No desk tables in the local D1. Run: node ./node_modules/wrangler/bin/wrangler.js d1 migrations apply ka-sites --local');

  // The same owner and site rows as seed/seed.sql; INSERT OR IGNORE keeps edits.
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO people (name, email, role, created_at) VALUES ('Alex Anderson', 'alex@ka-performancefl.com', 'owner', ?)").bind(iso),
    db.prepare("INSERT OR IGNORE INTO people (name, email, role, created_at) VALUES ('Fixture Approver', 'approver@desk-fixture.test', 'client', ?)").bind(iso),
    db.prepare("INSERT OR IGNORE INTO people (name, email, role, created_at) VALUES ('Fixture Viewer', 'viewer@desk-fixture.test', 'client', ?)").bind(iso),
    db.prepare("INSERT OR IGNORE INTO sites (slug, name, live_url, hosting, created_at, updated_at) VALUES (?, 'K & A Performance', 'https://ka-performancefl.com', 'pages', ?, ?)").bind(SLUG, iso, iso),
  ]);
  const site = await db.prepare('SELECT id FROM sites WHERE slug = ?').bind(SLUG).first();
  const person = async (email) => (await db.prepare('SELECT id FROM people WHERE email = ?').bind(email).first()).id;
  const grant = async (email, level) => db.prepare(
    `INSERT INTO desk_access (person_id, site_id, level, granted_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(person_id, site_id) DO UPDATE SET level = excluded.level`,
  ).bind(await person(email), site.id, level, iso).run();
  await grant('approver@desk-fixture.test', 'approve');
  await grant('viewer@desk-fixture.test', 'view');

  // Reset this desk, then push the fixture in order (rowid is push order).
  const stmts = ['desk_decisions', 'desk_story_checks', 'desk_items', 'desk_meta']
    .map((t) => db.prepare(`DELETE FROM ${t} WHERE site_id = ?`).bind(site.id));
  ITEMS.forEach(([list, kind, date, time, title, payload], i) => {
    const id = IDS[i];
    const p = list === 'stories' || kind === 'story' ? { id, date, time, ...payload } : { id, date, time, kind, title, ...payload };
    if (kind === 'ask') delete p.date;
    stmts.push(db.prepare('INSERT INTO desk_items (site_id, item_id, list, kind, post_date, post_time, title, payload, pushed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(site.id, id, list, kind, date, time, title, JSON.stringify(p), iso));
  });
  for (const [id, decision, note, who] of DECISIONS) {
    stmts.push(db.prepare('INSERT INTO desk_decisions (site_id, item_id, decision, note, decided_by, decided_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(site.id, id, decision, note, await person(who), iso));
  }
  for (const id of TICKED) {
    stmts.push(db.prepare('INSERT INTO desk_story_checks (site_id, item_id, posted, checked_by, checked_at) VALUES (?, ?, 1, ?, ?)')
      .bind(site.id, id, await person('alex@ka-performancefl.com'), iso));
  }
  stmts.push(db.prepare('INSERT INTO desk_meta (site_id, pushed_at, built_at, stories_paused) VALUES (?, ?, ?, 0)').bind(site.id, iso, iso));
  await db.batch(stmts);

  // Media into the local DESK_MEDIA bucket, keyed <slug>/<item>/<file>.
  let n = 0;
  for (const [i, item] of ITEMS.entries()) {
    for (const [file, type] of item[6]) {
      await env.DESK_MEDIA.put(key(IDS[i], file), readFileSync(path.join(MEDIA, file)), { httpMetadata: { contentType: type } });
      n += 1;
    }
  }
  console.log(`Seeded the local ${SLUG} desk: ${ITEMS.length} items (${STORIES.length} on the Stories checklist, ${TICKED.length} ticked), ${DECISIONS.length} decisions, ${n} media files.`);
} finally {
  await dispose();
}
