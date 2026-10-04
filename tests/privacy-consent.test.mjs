import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hasConsent} from '../lib/privacy-consent.js';
import {leadSource} from '../lib/lead-email.js';
import {onRequestPost} from '../functions/api/course-event.js';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

function request(cookie = '', body = {c:'direction',e:'view'}, origin = 'https://ka-performancefl.com') {
  return new Request('https://ka-performancefl.com/api/course-event', {method:'POST', headers:{Cookie:cookie, Origin:origin, 'Content-Type':'application/json'}, body:JSON.stringify(body)});
}
function database() {
  const rows = [];
  return {rows, prepare(sql) {
    assert.match(sql,/^INSERT INTO course_events/);
    return {bind(...values) { return {async run() { rows.push(values); }}; }};
  }};
}
test('absent, malformed, old-version and ambiguous consent fail closed', () => {
  for (const value of ['', 'true','v0.a1.m1','v1.a1.m1.extra','v1.a2.m1','v1.a1.m2','v1.a0.m0']) {
    for (const category of ['analytics','marketing']) assert.equal(hasConsent(request('ka_privacy='+value),category),false);
  }
  assert.equal(hasConsent(request('ka_privacy=v1.a1.m1'),'chosen'),false);
});
test('analytics and marketing are independent affirmative choices', () => {
  assert.equal(hasConsent(request('ka_privacy=v1.a1.m0'),'analytics'),true);
  assert.equal(hasConsent(request('ka_privacy=v1.a1.m0'),'marketing'),false);
  assert.equal(hasConsent(request('ka_privacy=v1.a0.m1'),'analytics'),false);
  assert.equal(hasConsent(request('ka_privacy=v1.a0.m1'),'marketing'),true);
});
test('existing referral cookie is ignored without current marketing permission', () => {
  for (const value of ['', 'ka_privacy=v1.a1.m0; ','ka_privacy=invalid; ']) {
    assert.equal(leadSource(request(value+'ka_src=existing-partner')),'direct');
  }
  assert.equal(leadSource(request('ka_privacy=v1.a0.m1; ka_src=partner')),'partner');
});
test('current browser denial overrides stale accepted cookies for events and referrals', async () => {
  const req = request('ka_privacy=v1.a1.m1; ka_src=existing-partner; ka_course=existing-token');
  req.headers.set('X-KA-Privacy','v1.a0.m0');
  assert.equal(leadSource(req),'direct');
  assert.equal(hasConsent(req,'analytics'),false);
  const db = database();
  await onRequestPost({request:req,env:{ADMIN_DB:db}});
  assert.equal(db.rows.length,0);
  req.headers.set('X-KA-Privacy','invalid');
  assert.equal(hasConsent(req,'marketing'),false);
  const withoutCookie = request('ka_src=old');
  withoutCookie.headers.set('X-KA-Privacy','v1.a1.m1');
  assert.equal(hasConsent(withoutCookie,'marketing'),false);
});
test('course access and marketing permission alone cannot cause analytics writes', async () => {
  const db = database();
  for (const value of ['', 'ka_privacy=v1.a0.m0; ','ka_privacy=v1.a0.m1; ']) {
    assert.equal((await onRequestPost({request:request(value+'ka_course=existing-token'),env:{ADMIN_DB:db}})).status,204);
  }
  assert.deepEqual(db.rows,[]);
});
test('accepted analytics records a validated event using the existing access token', async () => {
  const db = database();
  const result = await onRequestPost({request:request('ka_privacy=v1.a1.m0; ka_course=existing-token'),env:{ADMIN_DB:db}});
  assert.equal(result.status,204);
  assert.equal(db.rows.length,1);
  assert.deepEqual(db.rows[0].slice(0,3),['existing-token','direction','view']);
});
test('withdrawal stops future events without altering prior rows', async () => {
  const db = database();
  await onRequestPost({request:request('ka_privacy=v1.a1.m0; ka_course=existing-token'),env:{ADMIN_DB:db}});
  const before = structuredClone(db.rows);
  await onRequestPost({request:request('ka_privacy=v1.a0.m0; ka_course=existing-token'),env:{ADMIN_DB:db}});
  assert.deepEqual(db.rows,before);
});
test('cross-origin, invalid events and oversize event bodies never write', async () => {
  const db = database();
  const consent = 'ka_privacy=v1.a1.m1';
  for (const req of [request(consent,undefined,'https://other.example'), request(consent,{c:'bad',e:'view'}), request(consent,{c:'direction',e:'bad'}), request(consent,{c:'direction',e:'view',extra:'x'.repeat(25000)})]) {
    assert.equal((await onRequestPost({request:req,env:{ADMIN_DB:db}})).status,204);
  }
  assert.equal(db.rows.length,0);
});
test('memory-only rejection survives focus and storage synchronization without reloading stale consent', () => {
  const listeners = {}, nodes = new Map(), commands = [];
  let reloads = 0, scripts = 0;
  const node = () => ({addEventListener(type, callback) { this[type] = callback; }, remove() { nodes.delete(this.id); }});
  for (const id of ['ka-privacy-banner','ka-choice-analytics','ka-choice-marketing','ka-privacy-dialog','ka-privacy-error']) nodes.set(id,node());
  const document = {
    readyState:'complete', activeElement:null,
    get cookie() { return 'ka_privacy=v1.a1.m1; ka_course=existing-access'; },
    set cookie(value) { /* Simulate a browser refusing every cookie write. */ },
    getElementById(id) { return nodes.get(id); },
    createElement:node,
    addEventListener() {},
    body:{append(element) { nodes.set(element.id,element); }},
    head:{append(element) { nodes.set(element.id,element); scripts++; }},
  };
  const storage = {getItem() {throw Error('storage blocked');},setItem() {throw Error('storage blocked');},removeItem() {throw Error('storage blocked');}};
  const window = {addEventListener(type,callback) {listeners[type]=callback;},dispatchEvent() {}};
  const location = {protocol:'https:',hostname:'ka-performancefl.com',pathname:'/',search:'',reload() {reloads++;}};
  runInNewContext(readFileSync(new URL('../public/privacy-consent.js',import.meta.url),'utf8'), {window,document,location,sessionStorage:storage,localStorage:storage,URLSearchParams});
  assert.equal(window.KAPrivacy.allows('marketing'),true);
  assert.equal(scripts,1);
  window.fbq.callMethod = (...args) => commands.push(args);
  nodes.get('ka-privacy-root').click({target:{closest() {return {dataset:{kaChoice:'reject'}};}}});
  assert.equal(window.KAPrivacy.allows('marketing'),false);
  assert.equal(reloads,0);
  listeners.focus();
  listeners.storage({key:'ka_privacy_sync'});
  assert.equal(reloads,0);
  assert.equal(scripts,1);
  assert.equal(window.KAPrivacy.allows('marketing'),false);
  assert.equal(window.KAPrivacy.requestHeaders()['X-KA-Privacy'],'v1.a0.m0');
  assert.ok(commands.some(args=>args[0]==='consent'&&args[1]==='revoke'));
  assert.match(nodes.get('ka-privacy-error').textContent,/could not be saved/);
});
