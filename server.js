const http=require('http'),fs=require('fs'),path=require('path');
const root=fs.existsSync(path.join(__dirname,'dist','index.html'))?path.join(__dirname,'dist'):__dirname;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
const port=Number(process.env.PORT||3000);
http.createServer((req,res)=>{
 const u=(req.url||'/').split('?')[0];
 if(u==='/api/health'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({ok:true,app:'AI PRO CAR',version:'0.3.4',mode:'appstudio-safe'}));}
 let rel=u==='/'?'index.html':u.replace(/^\/+/, ''); let f=path.join(root,rel);
 if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()) f=path.join(root,'index.html');
 const ext=path.extname(f);res.writeHead(200,{'content-type':types[ext]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(f).pipe(res);
}).listen(port,'0.0.0.0',()=>console.log('AI PRO CAR v0.3.4 listening on '+port));
