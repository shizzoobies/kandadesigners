import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/course-event.js';
const dir='public/course-app/first-session';
const files=fs.readdirSync(dir,{recursive:true}).filter(f=>fs.statSync(path.join(dir,f)).isFile());
assert(!files.some(f=>/dev.vars|production|scripts|raw/.test(f)));
for(const file of files)assert(fs.statSync(path.join(dir,file)).size<25*1024*1024,`Oversized Pages asset: ${file}`);
const html=fs.readFileSync('dist/course/index.html','utf8');let linked=0;
for(const match of html.matchAll(/(?:href|src|poster)="(\/course-app\/[^"?]+)/g)){assert(fs.existsSync('dist'+match[1]),match[1]);linked++;}
assert(html.includes('gate.js?v=20260922'));
assert(html.includes('https://ka-performancefl.com/course/'));
const lesson={window:{}};vm.runInNewContext(fs.readFileSync(dir+'/lesson.js','utf8'),lesson);
for(const chapter of lesson.window.LESSON.chapters)assert(fs.existsSync(`${dir}/assets/audio/${chapter.id}.mp3`));
const gate=fs.readFileSync(dir+'/gate.js','utf8');
for(const test of [{cookie:'',search:'',allowed:false},{cookie:'ka_course=member',search:'',allowed:true},{cookie:'',search:'?pass=member',allowed:true},{cookie:'unrelated=1',search:'?chapter=setup',allowed:false}]){
 let redirected=null;
 const sandbox={window:{},URLSearchParams,document:{cookie:test.cookie,documentElement:{style:{}}},location:{search:test.search,replace:url=>{redirected=url;}}};
 vm.runInNewContext(gate,sandbox);
 assert.equal(sandbox.window.COURSE_ACCESS,test.allowed);
 assert.equal(redirected,test.allowed?null:'/free-course/');
}
let inserted=0;
const env={ADMIN_DB:{prepare:()=>({bind:()=>({run:async()=>{inserted++;}})})}};
for(const chapter of lesson.window.LESSON.chapters){
 const response=await onRequestPost({env,request:new Request('https://example.test/api/course-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({c:chapter.id,e:'view'})})});
 assert.equal(response.status,204);
}
assert.equal(inserted,7);
await onRequestPost({env,request:new Request('https://example.test/api/course-event',{method:'POST',body:JSON.stringify({c:'invalid',e:'view'})})});
assert.equal(inserted,7);
console.log(JSON.stringify({publicFiles:files.length,linkedAssets:linked,narrationFiles:7,gateCases:4,analyticsChapters:7,invalidChapter:'ignored',result:'passed'},null,2));
