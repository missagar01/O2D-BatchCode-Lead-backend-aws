const fs=require('fs'
const lines=fs.readFileSync('config/env.js','utf8').split(/\r?\n/); 
console.log(lines.slice(0,80).map((line,i)= ${line}`).join('\n')); 
