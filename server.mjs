import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { existsSync, createReadStream } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const PORT = Number(process.env.PORT || 4200);
const DIST_CANDIDATES = [
  '/app/dist/miniapps-builder/browser',
  '/app/dist/miniapps-builder'
];

const staticRoot = DIST_CANDIDATES.find((dir) => existsSync(dir));

if (!staticRoot) {
  console.error('No Angular dist directory found.');
  process.exit(1);
}

const rootPath = resolve(staticRoot);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
}

function proxyRequest(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const encodedTarget = req.url.slice('/cors-proxy/'.length);
  const targetUrl = decodeURIComponent(encodedTarget);

  let url;
  try {
    url = new URL(targetUrl);
  } catch {
    setCorsHeaders(res);
    res.writeHead(400);
    res.end('Invalid URL');
    return;
  }

  const lib = url.protocol === 'https:' ? httpsRequest : httpRequest;
  const headers = {};
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
  if (req.headers['authorization']) headers['authorization'] = req.headers['authorization'];
  if (req.headers['accept']) headers['accept'] = req.headers['accept'];

  const proxyReq = lib(
    {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: req.method,
      headers
    },
    (proxyRes) => {
      const resHeaders = { ...proxyRes.headers };
      resHeaders['access-control-allow-origin'] = '*';
      res.writeHead(proxyRes.statusCode || 502, resHeaders);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    setCorsHeaders(res);
    res.writeHead(502);
    res.end(err.message);
  });

  req.pipe(proxyReq);
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === '/') pathname = '/index.html';

  const filePath = normalize(join(rootPath, pathname));
  if (!filePath.startsWith(rootPath)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (existsSync(filePath)) {
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    createReadStream(filePath).pipe(res);
    return;
  }

  // SPA fallback
  const indexPath = join(rootPath, 'index.html');
  if (existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    createReadStream(indexPath).pipe(res);
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
}

createServer((req, res) => {
  if ((req.url || '').startsWith('/cors-proxy/')) {
    proxyRequest(req, res);
    return;
  }

  serveStatic(req, res);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
  console.log(`Serving static files from ${rootPath}`);
});
