import { describe,it,expect } from 'vitest';
import { makeTimeD1 } from './helpers/time-d1.js';
import { importTime,saveTime,listTime,timeTotals,summary,csv,interval,validateImport,overlaps } from '../src/lib/time.js';
import { authorizeTimeSync,readLimited } from '../src/lib/time-sync.js';
import { POST } from '../src/pages/api/time-sync.js';
import { GET } from '../src/pages/hours/export.js';
const user={id:1,role:'owner'};
const now='2026-11-05T18:00:00.000Z';
const record=(over={})=>({version:1,sourceKey:'a'.repeat(64),workstream:'aec-punch',start:'2026-11-05T10:00:00.000Z',end:'2026-11-05T11:00:00.000Z',...over});
const form=(over={})=>new URLSearchParams({intent:'approve',id:'1',revision:'1',workstream:'aec-punch',start:'2026-11-05T10:00',end:'2026-11-05T11:00',description:'Reviewed work',...over});
describe('hours records in SQLite',()=>{
  it('keeps history inaccessible when a removed person ID is reused',async()=>{
    const db=makeTimeD1();await importTime(db,user,[record()],now);
    db.sqlite.exec("DELETE FROM people WHERE id=1; INSERT INTO people(id,name,email,role,created_at) VALUES(1,'Replacement','new@example.test','owner','now')");
    expect(await listTime(db,user)).toEqual([]);
    expect((await db.prepare('SELECT * FROM time_entry_history').all()).results).toHaveLength(2);
    expect((await db.prepare('SELECT user_id FROM time_entries').first()).user_id).toBeNull();
  });
  it('paginates without losing all-time totals or off-page overlap warnings',async()=>{
    const db=makeTimeD1();
    await importTime(db,user,[record()],now);await saveTime(db,user,form({billable:'on'}),now);
    const records=Array.from({length:100},(_,i)=>record({sourceKey:(i+2).toString(16).padStart(64,'0')}));
    await importTime(db,user,records,now);
    expect(await listTime(db,user)).toHaveLength(101);
    expect(await listTime(db,user,2)).toHaveLength(1);
    expect((await listTime(db,user))[0].has_overlap).toBe(1);
    expect(await timeTotals(db,user)).toEqual({'aec-punch':{seconds:3600,billable:3600,pending:100},'aec-finance':{seconds:0,billable:0,pending:0}});
    await expect(listTime(db,user,0)).rejects.toThrow('page');
  });
  it('imports only reviewable activity and repeated delivery preserves corrections',async()=>{
    const db=makeTimeD1();
    expect(await importTime(db,user,[record()],now)).toBe(1);
    let rows=await listTime(db,user);
    expect(rows[0]).toMatchObject({status:'pending',billable:0});
    expect(summary(rows)['aec-punch']).toEqual({seconds:0,billable:0,pending:1});
    await saveTime(db,user,form({start:'2026-11-05T10:30',billable:'on'}),now);
    expect(await importTime(db,user,[record()],now)).toBe(0);
    rows=await listTime(db,user);
    expect(rows[0].observed_start).toBe(record().start);
    expect(rows[0].started_at).toBe('2026-11-05T10:30:00.000Z');
    expect(summary(rows)['aec-punch']).toEqual({seconds:1800,billable:1800,pending:0});
    expect((await db.prepare('SELECT * FROM time_entry_history').all()).results).toHaveLength(2);
  });
  it('prevents overlapping approvals across workstreams and supports exclusion',async()=>{
    const db=makeTimeD1();
    await importTime(db,user,[record(),record({sourceKey:'b'.repeat(64),workstream:'aec-finance'})],now);
    expect(overlaps((await listTime(db,user))[0],await listTime(db,user))).toBe(true);
    await saveTime(db,user,form(),now);
    await expect(saveTime(db,user,form({id:'2',workstream:'aec-finance'}),now)).rejects.toThrow('overlaps');
    await saveTime(db,user,form({intent:'exclude',revision:'2'}),now);
    await saveTime(db,user,form({id:'2',workstream:'aec-finance'}),now);
    expect(summary(await listTime(db,user))['aec-finance'].seconds).toBe(3600);
  });
  it('enforces overlap at the database boundary, allows adjacent intervals',async()=>{
    const db=makeTimeD1();
    await importTime(db,user,[record(),record({sourceKey:'b'.repeat(64)})],now);
    await saveTime(db,user,form(),now);
    await expect(db.prepare("UPDATE time_entries SET status='approved' WHERE id=2").run()).rejects.toThrow('time_overlap');
    await saveTime(db,user,form({id:'2',start:'2026-11-05T11:00',end:'2026-11-05T12:00'}),now);
    expect(summary(await listTime(db,user))['aec-punch'].seconds).toBe(7200);
  });
  it('rejects stale edits and protects source evidence',async()=>{
    const db=makeTimeD1();await importTime(db,user,[record()],now);
    await saveTime(db,user,form(),now);
    await expect(saveTime(db,user,form(),now)).rejects.toThrow('changed');
    await expect(db.prepare("UPDATE time_entries SET observed_start='changed' WHERE id=1").run()).rejects.toThrow('immutable');
  });
  it('isolates owners and denies clients/staff at every public function',async()=>{
    const db=makeTimeD1();await importTime(db,user,[record()],now);
    db.sqlite.exec("INSERT INTO people(id,name,email,role,created_at) VALUES(2,'Other owner','other@example.test','owner','now')");
    expect(await listTime(db,{id:2,role:'owner'})).toEqual([]);
    await expect(saveTime(db,{id:2,role:'owner'},form(),now)).rejects.toThrow('changed');
    for(const role of ['staff','client',undefined]) {
      await expect(importTime(db,{id:1,role},[record()],now)).rejects.toThrow('authorized');
      await expect(listTime(db,{id:1,role})).rejects.toThrow('authorized');
      await expect(saveTime(db,{id:1,role},form(),now)).rejects.toThrow('authorized');
    }
  });
  it('creates manual pending entries and saving approved entries removes their totals',async()=>{
    const db=makeTimeD1();await saveTime(db,user,form({intent:'create'}),now);
    expect((await listTime(db,user))[0].source).toBe('manual');
    await saveTime(db,user,form({billable:'on'}),now);
    await saveTime(db,user,form({intent:'save',revision:'2'}),now);
    expect(summary(await listTime(db,user))['aec-punch']).toEqual({seconds:0,billable:0,pending:1});
  });
  it('rejects invalid site IDs and descriptions without partial writes',async()=>{
    const db=makeTimeD1();
    await expect(saveTime(db,user,form({intent:'create',siteId:'999'}),now)).rejects.toThrow('site');
    await expect(saveTime(db,user,form({intent:'create',description:''}),now)).rejects.toThrow('Describe');
    await expect(importTime(db,user,[record(),record({workstream:'wrong'})],now)).rejects.toThrow('Choose');
    expect(await listTime(db,user)).toEqual([]);
  });
  it('exports approved hours only with CSV formula protection',async()=>{
    const db=makeTimeD1();await importTime(db,user,[record(),record({sourceKey:'b'.repeat(64)})],now);
    await saveTime(db,user,form({description:'=SUM(A1:A2)'}),now);
    const text=csv(await listTime(db,user));
    expect(text.split('\r\n')).toHaveLength(2);expect(text).toContain("'=SUM(A1:A2)");
    expect((await GET({locals:{user:{role:'staff'}}})).status).toBe(403);
    const response=await GET({locals:{user,runtime:{env:{DB:db}}}});
    expect(response.headers.get('cache-control')).toBe('no-store');expect(await response.text()).toContain('1.00');
  });
});
describe('validation and write-only sync',()=>{
  it('rejects impossible/future dates, reversed and overlong intervals',()=>{
    for(const r of [record({start:'2026-02-30T10:00:00.000Z'}),record({end:record().start}),record({end:'2030-01-01T00:00:00.000Z'}),record({end:'2026-11-05T15:00:00.000Z'})]) expect(()=>validateImport([r],Date.parse(now))).toThrow();
    expect(()=>interval('2026-11-05T10:00Z',record().end)).toThrow();
    expect(()=>validateImport(Array(101).fill(record()))).toThrow();
    expect(()=>validateImport([])).toThrow();
  });
  it('sync is disabled by default; accepts only a valid token for an active owner',async()=>{
    const db=makeTimeD1(),token='s'.repeat(48),env={DB:db,TIME_SYNC_TOKEN:token,TIME_SYNC_USER_ID:'1'};
    const request=(headers={},method='POST')=>new Request('https://admin.test/api/time-sync',{method,headers:{authorization:`Bearer ${token}`,...headers}});
    expect(await authorizeTimeSync(request(),{DB:db})).toBeNull();
    expect(await authorizeTimeSync(request({authorization:'Bearer bad'}),env)).toBeNull();
    expect(await authorizeTimeSync(request({origin:'https://admin.test'}),env)).toBeNull();
    expect(await authorizeTimeSync(request({},'GET'),env)).toBeNull();
    expect(await authorizeTimeSync(request(),env)).toMatchObject(user);
    db.sqlite.exec("UPDATE people SET role='client' WHERE id=1");
    expect(await authorizeTimeSync(request(),env)).toBeNull();
    db.sqlite.exec('DELETE FROM people WHERE id=1');
    expect(await authorizeTimeSync(request(),env)).toBeNull();
  });
  it('bounds request bytes even without content length',async()=>{
    await expect(readLimited(new Request('https://a.test',{method:'POST',body:'12345'}),4)).rejects.toThrow('large');
  });
  it('API refuses unauthenticated input and validates import JSON',async()=>{
    const db=makeTimeD1();
    const req=(body,type='application/json')=>new Request('https://admin.test/api/time-sync',{method:'POST',headers:{'content-type':type},body});
    const locals={timeSyncUser:user,runtime:{env:{DB:db}}};
    expect((await POST({request:req('[]'),locals:{}})).status).toBe(403);
    expect((await POST({request:req('{'),locals})).status).toBe(400);
    expect((await POST({request:req('[]','text/plain'),locals})).status).toBe(415);
    const r=await POST({request:req(JSON.stringify([record()])),locals});
    expect(r.status).toBe(200);expect(await r.json()).toEqual({ok:true,inserted:1});
  });
});
