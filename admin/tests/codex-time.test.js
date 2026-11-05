import { it,expect } from 'vitest';
import { mkdtemp,readFile,readdir,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { capture,pending,sync,mappedWorkstream } from '../scripts/codex-time.mjs';
const root=resolve('test-punch');
const start='2026-11-05T10:00:00.000Z',end='2026-11-05T10:30:00.000Z';
async function fixture(run) {
  const stateDir=await mkdtemp(join(tmpdir(),'ka-time-test-'));
  try {await run({stateDir,roots:[{path:root,workstream:'aec-punch'}],endpoint:'https://admin.example.test/api/time-sync'});}
  finally {await rm(stateDir,{recursive:true,force:true});}
}
const event=(name,over={})=>({hook_event_name:name,session_id:'s',turn_id:'t',cwd:root,prompt:'PRIVATE PROMPT',transcript_path:'DO NOT READ',last_assistant_message:'PRIVATE RESPONSE',...over});
it('collects only allowlisted timing metadata and deduplicates repeated hooks',()=>fixture(async config=>{
  await capture(event('UserPromptSubmit'),config,start);
  await capture(event('UserPromptSubmit'),config,end);
  await capture(event('Stop'),config,end);
  await capture(event('Stop'),config,'2026-11-05T10:40:00.000Z');
  const {rows}=await pending(config);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({version:1,workstream:'aec-punch',start,end});
  expect(JSON.stringify(rows)).not.toContain('PRIVATE');expect(JSON.stringify(rows)).not.toContain('DO NOT READ');
  expect(Object.keys(rows[0]).sort()).toEqual(['end','sourceKey','start','version','workstream']);
  expect((await pending(config,2)).rows).toEqual([]);
  await expect(pending(config,0)).rejects.toThrow('positive');
}));
it('ignores missing starts, other repos, subagent stops, and overlong turns',()=>fixture(async config=>{
  await capture(event('Stop'),config,end);
  await capture(event('UserPromptSubmit',{cwd:resolve('other')}),config,start);
  await capture(event('SubagentStop'),config,end);
  expect((await pending(config)).rows).toEqual([]);
  await capture(event('UserPromptSubmit'),config,start);
  await capture(event('Stop'),config,'2026-11-05T16:00:00.000Z');
  expect((await pending(config)).rows).toEqual([]);
  expect(await readdir(join(config.stateDir,'skipped'))).toHaveLength(1);
}));
it('requires unambiguous full-directory mapping',()=>{
  expect(mappedWorkstream(root+'-other',[{path:root,workstream:'aec-punch'}])).toBeNull();
  expect(mappedWorkstream(join(root,'src'),[{path:root,workstream:'aec-punch'}])).toBe('aec-punch');
  expect(mappedWorkstream(root,[{path:root,workstream:'aec-punch'},{path:root,workstream:'aec-finance'}])).toBeNull();
});
it('retains the durable outbox after failures, then acknowledges a successful retry',()=>fixture(async config=>{
  await capture(event('UserPromptSubmit'),config,start);await capture(event('Interrupt'),config,end);
  const env={KA_TIME_SYNC_TOKEN:'test',KA_ACCESS_CLIENT_ID:'id',KA_ACCESS_CLIENT_SECRET:'secret'};
  await expect(sync(config,env,async()=>new Response('denied',{status:403}))).rejects.toThrow();
  expect((await pending(config)).rows).toHaveLength(1);
  expect(await sync(config,env,async(url,options)=>{
    expect(options.redirect).toBe('error');expect(JSON.parse(options.body)[0].start).toBe(start);
    return Response.json({ok:true,inserted:1});
  })).toBe(1);
  expect((await pending(config)).rows).toHaveLength(0);
  await capture(event('Stop'),config,'2026-11-05T10:40:00.000Z');
  expect((await pending(config)).rows).toHaveLength(0);
}));
it('refuses insecure endpoints and missing credentials',()=>fixture(async config=>{
  await expect(sync({...config,endpoint:'http://example.test/api/time-sync'},{})).rejects.toThrow('HTTPS');
  await expect(sync(config,{})).rejects.toThrow('credentials');
}));
