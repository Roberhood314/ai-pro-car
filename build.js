const fs=require('fs');
if(!fs.existsSync('public/index.html')){throw new Error('Missing public/index.html');}
if(!fs.existsSync('public/app.js')){throw new Error('Missing public/app.js');}
console.log('AI PRO CAR Pi Browser build ready');
