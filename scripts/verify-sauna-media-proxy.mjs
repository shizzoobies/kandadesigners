// Local-only fault fixture. First narration request fails, then retries stream normally.
import http from 'node:http';
import { serveDist } from './lib/serve-dist.mjs';
const source = await serveDist('public');
let failed = false;
const server = http.createServer((request, response) => {
  if (!failed && request.url.includes('/assets/audio/')) {
    failed = true;
    response.writeHead(503, { 'content-type': 'text/plain' }).end('Intentional media failure for local verification');
    return;
  }
  const upstream = http.request(source.origin + request.url, { method: request.method, headers: request.headers }, incoming => {
    response.writeHead(incoming.statusCode, incoming.headers);
    incoming.pipe(response);
  });
  upstream.on('error', () => response.writeHead(502).end());
  request.pipe(upstream);
});
server.listen(62144, '127.0.0.1', () => console.log('Local audio retry fixture http://127.0.0.1:62144/training-samples/sauna/'));
