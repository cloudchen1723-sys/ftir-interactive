import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.md':'text/plain; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.pdf':'application/pdf' };
export function createServer() {
  return http.createServer(async (req,res) => {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405,{'Allow':'GET, HEAD'}); res.end(); return; }
    try {
      const relative = decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
      if (relative.split(/[\\/]/).some(segment => segment.startsWith('.'))) { res.writeHead(404); res.end('Not found'); return; }
      const file = path.resolve(root, relative);
      if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end('Forbidden'); return; }
      const bytes = await readFile(file);
      res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Content-Length':bytes.length,'Cache-Control':'no-cache'});
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535');
  createServer().listen(port,'127.0.0.1',() => console.log(`FTIR classroom: http://127.0.0.1:${port}/`));
}
