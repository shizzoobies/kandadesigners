// Local-only fixture: fail the first narration request to verify the visible retry path.
// Open the printed URL, select Play introduction, then Play audio to retry.
import http from 'node:http';
import { serveDist } from './lib/serve-dist.mjs';
const source=await serveDist('public');let failed=false;
const proxy=http.createServer((req,res)=>{
  if(!failed&&req.url.includes('/strength/assets/audio/screen-1.mp3')){failed=true;res.writeHead(503,{'content-type':'text/plain','cache-control':'no-store'}).end('Intentional local recovery fixture');return;}
  const upstream=http.request(source.origin+req.url,{method:req.method,headers:req.headers},reply=>{res.writeHead(reply.statusCode,reply.headers);reply.pipe(res);});
  upstream.on('error',()=>res.writeHead(502).end());req.pipe(upstream);
});
proxy.listen(62149,'127.0.0.1',()=>console.log('Recovery fixture: http://127.0.0.1:62149/training-samples/strength/'));
process.on('SIGINT',()=>{proxy.close();source.close().then(()=>process.exit());});
