// A dependency-free static server for dist/, used by the verification and
// PDF scripts so pages render exactly as Cloudflare Pages serves them
// (absolute /fonts/ and /_astro/ paths resolve; file:// would not).
//
// Directory requests map to index.html. Unknown paths 404. Ephemeral port.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
};

export function serveDist(root = path.resolve('dist'), requestedPort = 0) {
  // Normalize so a caller's forward-slash root still matches path.join's
  // backslashes on Windows; otherwise the escape guard below 403s everything.
  root = path.resolve(root);
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      let rel = decodeURIComponent(url.pathname);
      let file = path.join(root, rel);
      // Never escape the root.
      if (!file.startsWith(root)) {
        res.writeHead(403).end();
        return;
      }
      try {
        let stat = fs.existsSync(file) ? fs.statSync(file) : null;
        if (stat && stat.isDirectory()) {
          file = path.join(file, 'index.html');
          stat = fs.existsSync(file) ? fs.statSync(file) : null;
        }
        if (!stat) {
          // Astro's 404 page, so unmatched routes behave like production.
          const nf = path.join(root, '404.html');
          if (fs.existsSync(nf)) {
            res.writeHead(404, { 'content-type': MIME['.html'] });
            fs.createReadStream(nf).pipe(res);
          } else {
            res.writeHead(404).end('Not found');
          }
          return;
        }
        const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
        // Media seeking needs byte ranges, including in the local course preview.
        const media = type.startsWith('audio/') || type.startsWith('video/');
        if (media && req.headers.range) {
          const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
          let start = 0;
          let end = stat.size - 1;
          if (range && (range[1] || range[2])) {
            if (range[1]) {
              start = Number(range[1]);
              if (range[2]) end = Math.min(Number(range[2]), end);
            } else {
              start = Math.max(0, stat.size - Number(range[2]));
            }
          } else {
            start = stat.size;
          }
          if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) {
            res.writeHead(416, { 'content-range': `bytes */${stat.size}` }).end();
            return;
          }
          res.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${stat.size}`, 'content-length': end - start + 1 });
          if (req.method === 'HEAD') res.end();
          else fs.createReadStream(file, { start, end }).pipe(res);
          return;
        }
        res.writeHead(200, { 'content-type': type, 'content-length': stat.size, ...(media ? { 'accept-ranges': 'bytes' } : {}) });
        if (req.method === 'HEAD') { res.end(); return; }
        fs.createReadStream(file).pipe(res);
      } catch (err) {
        res.writeHead(500).end(String(err));
      }
    });
    server.listen(requestedPort, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port, origin: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) });
    });
  });
}
