#!/usr/bin/env node
/**
 * scripts/dev.js — Development server
 * Starts a static file server with live-reload for index.html.
 * Usage:  node scripts/dev.js [port=3000]
 */
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';

const PORT = parseInt(process.argv[2] ?? process.env.PORT ?? '3000', 10);
const ROOT = fileURLToPath(new URL('..', import.meta.url));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.woff2':'font/woff2',
  '.ico':  'image/x-icon',
};

const server = createServer((req, res) => {
  let path = req.url === '/' ? '/index.html' : req.url;
  path = path.split('?')[0]; // strip query string
  const full = join(ROOT, path);
  if (!existsSync(full)) { res.writeHead(404); res.end('Not found'); return; }
  const ext  = extname(full);
  const type = MIME[ext] ?? 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(readFileSync(full));
});

server.listen(PORT, () => {
  console.log(`Zolto Studio  →  http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});
