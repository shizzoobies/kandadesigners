import { describe,it,expect } from 'vitest';
import {readFileSync} from 'node:fs';
import {makeTimeD1} from './helpers/time-d1.js';
import {importTime,saveTime,listTime,timeTotals,AUTO_SKIP_REASON} from '../src/lib/time.js';
const user={id:1,role:'owner'},now='2026-11-06T12:00:00.000Z';
const start='2026-11-05T10:00:00.123Z';
const record=(ms,id=1,over={})=>({version:1,sourceKey:id.toString(16).padStart(64,'0'),workstream:'aec-punch',start,end:new Date(Date.parse(start)+ms).toISOString(),...over});
const quick=(id=1,revision=1,intent='quick-approve',over={})=>new URLSearchParams({intent,id:String(id),revision:String(revision),...over});
const edit=(over={})=>new URLSearchParams({intent:'create',workstream:'aec-finance',start:'2026-11-05T12:00',end:'2026-11-05T12:14:59.999',description:'Manual work',...over});
const row=(db,id=1)=>db.prepare('SELECT * FROM time_entries WHERE id=?').bind(id).first();
describe('quick Hours review',()=>{
  it('skips strictly below 15 minutes, never rounds the cutoff, and deduplicates delivery',async()=>{
    const db=makeTimeD1();
    await importTime(db,user,[record(1),record(899999,2),record(900000,3),record(900001,4)],now);
    expect(await row(db)).toMatchObject({status:'excluded',status_reason:AUTO_SKIP_REASON,billable:0,revision:1});
    expect((await row(db,2)).status).toBe('excluded');
    expect((await row(db,3)).status).toBe('pending');
    expect((await row(db,4)).status).toBe('pending');
    expect(await importTime(db,user,[record(899999,2)],now)).toBe(0);
    expect((await db.prepare('SELECT * FROM time_entry_history WHERE entry_id=2').all()).results).toHaveLength(1);
    expect((await timeTotals(db,user))['aec-punch']).toEqual({seconds:0,billable:0,pending:2});
    await saveTime(db,user,quick(3),now);
    expect(await row(db,3)).toMatchObject({status:'approved',billable:0});
  });
  it('applies the threshold to manual creation and edits, with recoverable evidence',async()=>{
    const db=makeTimeD1();await saveTime(db,user,edit(),now);
    expect(await row(db)).toMatchObject({status:'excluded',status_reason:AUTO_SKIP_REASON});
    await saveTime(db,user,edit({intent:'save',id:'1',revision:'1',end:'2026-11-05T12:15'}),now);
    expect(await row(db)).toMatchObject({status:'pending',status_reason:'',revision:2,observed_end:'2026-11-05T12:14:59.999Z'});
    await saveTime(db,user,edit({intent:'approve',id:'1',revision:'2',billable:'on'}),now);
    expect(await row(db)).toMatchObject({status:'excluded',billable:0,revision:3});
    const history=(await db.prepare('SELECT snapshot FROM time_entry_history WHERE entry_id=1 ORDER BY revision').all()).results;
    expect(history.map(r=>JSON.parse(r.snapshot).status)).toEqual(['excluded','pending','excluded']);
  });
  it('approves only stored fields and leaves billing off even with forged fields',async()=>{
    const db=makeTimeD1();await importTime(db,user,[record(1800000)],now);
    await saveTime(db,user,quick(1,1,'quick-approve',{billable:'on',start:'forged',end:'forged',workstream:'aec-finance'}),now);
    expect(await row(db)).toMatchObject({status:'approved',billable:0,started_at:start,workstream:'aec-punch'});
    await expect(saveTime(db,user,quick(1,2,'quick-skip'),now)).rejects.toThrow('no longer');
    expect((await row(db)).status).toBe('approved');
  });
  it('serializes simultaneous approve/skip clicks with one audit revision',async()=>{
    const db=makeTimeD1();await importTime(db,user,[record(1800000)],now);
    const results=await Promise.allSettled([saveTime(db,user,quick(),now),saveTime(db,user,quick(1,1,'quick-skip'),now)]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect(results.filter(r=>r.status==='rejected')[0].reason.status).toBe(409);
    expect((await row(db)).revision).toBe(2);
    expect((await db.prepare('SELECT * FROM time_entry_history').all()).results).toHaveLength(2);
  });
  it('prevents concurrent overlapping approvals across projects, allows adjacency and ignores skips',async()=>{
    const db=makeTimeD1();
    await importTime(db,user,[record(1800000),record(1800000,2,{workstream:'aec-finance'}),record(900000,3,{start:'2026-11-05T10:30:00.123Z',end:'2026-11-05T10:45:00.123Z'})],now);
    const results=await Promise.allSettled([saveTime(db,user,quick(1),now),saveTime(db,user,quick(2),now)]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect(results.find(r=>r.status==='rejected').reason.message).toContain('overlaps');
    await saveTime(db,user,quick(2,1,'quick-skip'),now);
    await saveTime(db,user,quick(3),now);
    expect((await timeTotals(db,user))['aec-punch'].seconds).toBe(2700);
    expect((await row(db,2)).status_reason).toBe('Skipped from the review list.');
  });
  it('denies other owners, staff and stale quick approvals after corrections',async()=>{
    const db=makeTimeD1();await importTime(db,user,[record(1800000)],now);
    await expect(saveTime(db,{id:2,role:'owner'},quick(),now)).rejects.toThrow('changed');
    await expect(saveTime(db,{id:1,role:'staff'},quick(),now)).rejects.toThrow('authorized');
    await saveTime(db,user,edit({intent:'save',id:'1',revision:'1',end:'2026-11-05T12:30'}),now);
    await expect(saveTime(db,user,quick(),now)).rejects.toThrow('changed');
    expect((await row(db)).status).toBe('pending');
  });
  it('puts actionable pending entries ahead of recent skipped entries',async()=>{
    const db=makeTimeD1();await importTime(db,user,[record(900000)],now);
    await importTime(db,user,Array.from({length:100},(_,i)=>record(1000,i+2,{start:'2026-11-05T11:00:00.000Z',end:'2026-11-05T11:00:01.000Z'})),now);
    expect((await listTime(db,user))[0].id).toBe(1);
  });
});
describe('threshold migration and rolling-release protection',()=>{
  const oldInsert=(db,id,status,end,billable=0)=>db.sqlite.prepare(`INSERT INTO time_entries(user_id,workstream,source,source_key,observed_start,observed_end,started_at,ended_at,status,billable,description,created_at,updated_at)
    VALUES(1,'aec-punch','codex',?, ?,?,?, ?,?,?, 'Preserve this description',?,?)`).run(String(id),start,end,start,end,status,billable,now,now);
  it('backfills only pending short entries with exact boundaries and an audit reason',async()=>{
    const db=makeTimeD1('0006');
    oldInsert(db,1,'pending',record(899999).end);
    oldInsert(db,2,'pending',record(900000).end);
    oldInsert(db,3,'approved',record(1000).end,1);
    oldInsert(db,4,'excluded',record(1000).end);
    const approvedBefore=await row(db,3),excludedBefore=await row(db,4);
    db.sqlite.exec(readFileSync(new URL('../migrations/0007_time_quick_review.sql',import.meta.url),'utf8'));
    expect(await row(db)).toMatchObject({status:'excluded',revision:2,status_reason:AUTO_SKIP_REASON,observed_start:start,description:'Preserve this description'});
    expect(await row(db,2)).toMatchObject({status:'pending',revision:1});
    expect(await row(db,3)).toEqual({...approvedBefore,status_reason:''});
    expect(await row(db,4)).toEqual({...excludedBefore,status_reason:''});
    const history=(await db.prepare('SELECT * FROM time_entry_history WHERE entry_id=1 ORDER BY revision').all()).results;
    expect(history).toHaveLength(2);expect(JSON.parse(history[1].snapshot).status_reason).toBe(AUTO_SKIP_REASON);
    // A previous Worker can still deliver; the database skips it atomically.
    oldInsert(db,5,'pending',record(899999).end);
    expect(await row(db,5)).toMatchObject({status:'excluded',revision:2,status_reason:AUTO_SKIP_REASON});
    expect(()=>oldInsert(db,6,'approved',record(899999).end)).toThrow('time_under_minimum');
    expect(()=>db.sqlite.exec("UPDATE time_entries SET status='approved' WHERE id=1")).toThrow('time_under_minimum');
    await expect(saveTime(db,user,quick(1,1),now)).rejects.toThrow('changed');
  });
});
