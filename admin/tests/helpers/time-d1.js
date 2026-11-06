import { createRequire } from 'node:module';
import { readFileSync,readdirSync } from 'node:fs';
const { DatabaseSync }=createRequire(import.meta.url)('node:sqlite');
export function makeTimeD1(through = '9999') {
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  const dir=new URL('../../migrations/',import.meta.url);
  for(const f of readdirSync(dir).filter(f=>f.endsWith('.sql') && f.slice(0,4)<=through).sort()) sqlite.exec(readFileSync(new URL(f,dir),'utf8'));
  sqlite.exec("INSERT INTO people(id,name,email,role,created_at) VALUES(1,'Test owner','owner@example.test','owner','now')");
  return {sqlite,prepare(sql){
    let args=[];
    return {bind(...v){args=v;return this;},async first(){const r=sqlite.prepare(sql).get(...args);return r?{...r}:null;},
      async all(){return {results:sqlite.prepare(sql).all(...args).map(r=>({...r}))};},
      async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}};
  },async batch(statements){sqlite.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());sqlite.exec('COMMIT');return out;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
}
