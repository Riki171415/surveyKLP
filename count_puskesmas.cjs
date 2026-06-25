const fs=require('fs');
const lines=fs.readFileSync('v_fasyankes.csv','utf8').split('\n');
let c=0;
for(const l of lines){
  if(l.includes('"Puskesmas"')) c++;
}
console.log('Puskesmas in v_fasyankes:', c);
