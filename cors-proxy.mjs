import { createServer, request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';

const PORT = 4201;

createServer((clientReq, clientRes) => {
  clientRes.setHeader('Access-Control-Allow-Origin', '*');
  clientRes.setHeader('Access-Control-Allow-Methods', '*');
  clientRes.setHeader('Access-Control-Allow-Headers', '*');

  if (clientReq.method === 'OPTIONS') {
    clientRes.writeHead(204);
    clientRes.end();
    return;
  }

  const targetUrl = decodeURIComponent(clientReq.url.slice(1));
  let url;
  try {
    url = new URL(targetUrl);
  } catch {
    clientRes.writeHead(400);
    clientRes.end('Invalid URL');
    return;
  }

  const lib = url.protocol === 'https:' ? httpsRequest : httpRequest;
  const headers = {};
  if (clientReq.headers['content-type']) headers['content-type'] = clientReq.headers['content-type'];
  if (clientReq.headers['authorization']) headers['authorization'] = clientReq.headers['authorization'];
  if (clientReq.headers['accept']) headers['accept'] = clientReq.headers['accept'];

  const proxyReq = lib({
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method: clientReq.method,
    headers
  }, (proxyRes) => {
    const resHeaders = { ...proxyRes.headers };
    resHeaders['access-control-allow-origin'] = '*';
    clientRes.writeHead(proxyRes.statusCode, resHeaders);
    proxyRes.pipe(clientRes);
  });

  proxyReq.on('error', (err) => {
    clientRes.writeHead(502);
    clientRes.end(err.message);
  });

  clientReq.pipe(proxyReq);
}).listen(PORT, () => {
  console.log(`CORS proxy running on http://localhost:${PORT}`);
});
