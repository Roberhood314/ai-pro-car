const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'public');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const port=Number(process.env.PORT||3000);
const hardFallback='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI PRO CAR</title><style>body{margin:0;background:#071018;color:#eaf6fb;font-family:system-ui}main{max-width:960px;margin:0 auto;padding:28px}.card{background:#0d1922;border:1px solid #1e3a48;border-radius:16px;padding:22px}.ok{color:#43e08c}a{color:#5bdcff}</style></head><body><main><div class="card"><h1>AI PRO CAR</h1><p class="ok">SYSTEM ONLINE</p><p>Dashboard fallback loaded successfully.</p><p><a href="/dashboard">Open full dashboard</a></p></div></main></body></html>';
http.createServer((req,res)=>{
 const u=(req.url||'/').split('?')[0];
 console.log('[HTTP]',req.method,u,req.headers['user-agent']||'');
 if(u==='/api/health'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});return res.end(JSON.stringify({ok:true,app:'AI PRO CAR',version:'0.3.8',mode:'hard-fallback'}));}
 if(u==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});return res.end(hardFallback);}
 let rel=u==='/dashboard'?'index.html':u.replace(/^\/+/, '');
 let f=path.join(root,rel);
 if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()) f=path.join(root,'index.html');
 if(!fs.existsSync(f)){res.writeHead(500,{'content-type':'text/plain; charset=utf-8'});return res.end('AI PRO CAR public bundle missing');}
 const ext=path.extname(f);
 res.writeHead(200,{'content-type':types[ext]||'application/octet-stream','cache-control':'no-store'});
 fs.createReadStream(f).pipe(res);
}).listen(port,'0.0.0.0',()=>console.log('AI PRO CAR v0.3.8 listening on '+port));