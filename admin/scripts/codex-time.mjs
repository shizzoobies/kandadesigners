// Node 24+. No transcript/session reads. Only allowlisted fields from hook stdin.
import { readFile, writeFile, mkdir, readdir, rename } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const hash = (s) => createHash('sha256').update(s).digest('hex');
export function mappedWorkstream(cwd, roots) {
  if (typeof cwd !== 'string' || !isAbsolute(cwd)) return null;
  const matches = roots.filter((r) => {
    const rel = relative(resolve(r.path),resolve(cwd));
    return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
  });
  const streams = new Set(matches.map(r=>r.workstream));
  return streams.size === 1 ? [...streams][0] : null;
}
export async function capture(event, config, now = new Date().toISOString()) {
  if (!['UserPromptSubmit','Stop','Interrupt'].includes(event?.hook_event_name)) return;
  if (typeof event.session_id!=='string' || typeof event.turn_id!=='string' || !event.session_id || !event.turn_id) return;
  const workstream = mappedWorkstream(event.cwd,config.roots);
  if (!['aec-punch','aec-finance'].includes(workstream)) return;
  const sourceKey = hash(`${event.session_id}\n${event.turn_id}`);
  const base = resolve(config.stateDir);
  for (const dir of ['starts','pending','sent','skipped']) await mkdir(join(base,dir),{recursive:true});
  const startFile = join(base,'starts',`${sourceKey}.json`);
  if (event.hook_event_name==='UserPromptSubmit') {
    try { await writeFile(startFile,JSON.stringify({workstream,start:now}),{flag:'wx',mode:0o600}); }
    catch(e) {if(e.code!=='EEXIST') throw e;}
    return;
  }
  // A continuation may emit another Stop. The first completed interval wins.
  for (const dir of ['pending','sent','skipped']) {
    try { await readFile(join(base,dir,`${sourceKey}.json`)); return; }
    catch(e) {if(e.code!=='ENOENT') throw e;}
  }
  let start;
  try { start=JSON.parse(await readFile(startFile,'utf8')); }
  catch(e) {if(e.code==='ENOENT') return;throw e;}
  const duration=Date.parse(now)-Date.parse(start.start);
  if (start.workstream!==workstream || duration<=0 || duration>14400000) {
    await writeFile(join(base,'skipped',`${sourceKey}.json`),JSON.stringify({sourceKey,reason:'Unreliable interval; enter actual work manually.'}),{mode:0o600});
    return;
  }
  const record={version:1,sourceKey,workstream,start:start.start,end:now};
  // Atomic publication prevents a concurrent exporter reading a partial file.
  const temp=join(base,'pending',`${sourceKey}.${crypto.randomUUID()}.tmp`);
  await writeFile(temp,JSON.stringify(record),{mode:0o600});
  try {await rename(temp,join(base,'pending',`${sourceKey}.json`));}
  catch(e) {if(e.code!=='EEXIST') throw e;}
}
export async function pending(config, page = 1) {
  if (!Number.isSafeInteger(page) || page<1) throw new Error('Export page must be a positive integer.');
  const dir=join(resolve(config.stateDir),'pending');
  await mkdir(dir,{recursive:true});
  const files=(await readdir(dir)).filter(f=>/^[a-f0-9]{64}\.json$/.test(f)).sort().slice((page-1)*100,page*100);
  return {files,rows:await Promise.all(files.map(f=>readFile(join(dir,f),'utf8').then(JSON.parse)))};
}
export async function sync(config, env=process.env, fetcher=fetch) {
  const url=new URL(config.endpoint);
  if (url.protocol!=='https:' || url.pathname!=='/api/time-sync' || url.search || url.hash || url.username || url.password) throw new Error('Use the HTTPS admin /api/time-sync endpoint.');
  if (!env.KA_TIME_SYNC_TOKEN || !env.KA_ACCESS_CLIENT_ID || !env.KA_ACCESS_CLIENT_SECRET) throw new Error('Sync credentials are not configured.');
  const {files,rows}=await pending(config);
  if (!rows.length) return 0;
  const response=await fetcher(url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(1800),headers:{
    'Content-Type':'application/json',Authorization:`Bearer ${env.KA_TIME_SYNC_TOKEN}`,
    'CF-Access-Client-Id':env.KA_ACCESS_CLIENT_ID,'CF-Access-Client-Secret':env.KA_ACCESS_CLIENT_SECRET,
  },body:JSON.stringify(rows)});
  if (response.status!==200 || (await response.json()).ok!==true) throw new Error('Activity sync was not accepted. Pending records were retained.');
  await mkdir(join(config.stateDir,'sent'),{recursive:true});
  for (const f of files) {
    try {await rename(join(config.stateDir,'pending',f),join(config.stateDir,'sent',f));}
    catch(e) {if(e.code!=='ENOENT' && e.code!=='EEXIST') throw e;}
  }
  return rows.length;
}
async function main() {
  const [command,configFile,exportPage='1']=process.argv.slice(2);
  if (!['capture','export','sync'].includes(command) || !configFile) throw new Error('Usage: node codex-time.mjs capture|export|sync CONFIG.json [export-page]');
  const config=JSON.parse(await readFile(configFile,'utf8'));
  if (!isAbsolute(config.stateDir) || !Array.isArray(config.roots) || config.roots.some(r=>!isAbsolute(r.path) || !['aec-punch','aec-finance'].includes(r.workstream))) throw new Error('Invalid collector configuration.');
  if (command==='capture') {
    let input='';
    for await (const chunk of process.stdin) { input+=chunk; if(input.length>1048576) throw new Error('Hook input too large.'); }
    const event=JSON.parse(input);
    await capture(event,config);
    if (config.autoSync===true && ['Stop','Interrupt'].includes(event.hook_event_name)) {
      try {await sync(config);} catch {process.stdout.write(JSON.stringify({systemMessage:'K&A time sync is pending. Local activity was retained; retry the sync command.'}));return;}
    }
    process.stdout.write('{}');
  } else if (command==='export') process.stdout.write(JSON.stringify((await pending(config,Number(exportPage))).rows,null,2)+'\n');
  else {const n=await sync(config);process.stdout.write(`Synced ${n} activity suggestions.\n`);}
}
if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(()=>{
    // Never print raw hook payloads, config, request errors, or credentials.
    if(process.argv[2]==='capture') {process.stdout.write(JSON.stringify({systemMessage:'K&A activity capture failed. Record this work manually and check the collector setup.'}));}
    else {process.stderr.write('K&A time command failed. Check configuration and credentials; queued records are retained.\n');process.exitCode=1;}
  });
}
