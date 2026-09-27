const fs=require('fs'),path=require('path');
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist',{recursive:true});
for(const f of ['index.html','styles.css','app.js']) fs.copyFileSync(f,path.join('dist',f));
console.log('AI PRO CAR static build complete');
