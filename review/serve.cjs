/* Tiny localhost-only reviewer for the static teaching site. */
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.md':'text/markdown; charset=utf-8'};
http.createServer((req,res)=>{
  let relative;
  try{relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  const target=path.resolve(root,'.'+relative);
  if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const file=fs.existsSync(target)&&fs.statSync(target).isDirectory()?path.join(target,'index.html'):target;
  fs.stat(file,(error,stat)=>{
    if(error||!stat.isFile()){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    fs.createReadStream(file).pipe(res);
  });
}).listen(4173,'127.0.0.1',()=>console.log('FTIR preview http://127.0.0.1:4173/'));
