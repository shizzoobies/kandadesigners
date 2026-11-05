// Run only against this task's synthetic, loopback Worker. Never a live host.
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4397';
const token='local-test-token-only-00000000000000000000';
const record={version:1,sourceKey:'f'.repeat(64),workstream:'aec-finance',start:'2026-11-03T01:15:00.000Z',end:'2026-11-03T01:30:00.000Z'};
const post=(body,headers={})=>fetch(`${base}/api/time-sync`,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
assert.equal((await post([record])).status,403);
assert.equal((await post([record],{authorization:`Bearer ${token}`,origin:base})).status,403);
assert.equal((await fetch(`${base}/api/time-sync`,{headers:{authorization:`Bearer ${token}`}})).status,403);
let r=await post([record],{authorization:`Bearer ${token}`});assert.equal(r.status,200);assert.equal((await r.json()).ok,true);
r=await post([record],{authorization:`Bearer ${token}`});assert.equal(r.status,200);assert.equal((await r.json()).inserted,0);
r=await fetch(`${base}/hours`,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',origin:'https://evil.test'},body:'intent=create'});assert.equal(r.status,403);
r=await fetch(`${base}/hours/export`);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');
const csv=await r.text();assert.ok(csv.includes('Observed start UTC'));assert.ok(!csv.includes(record.start));
console.log('Local Worker: credential/origin/method denial, duplicate sync, CSRF denial, and approved-only CSV passed.');
