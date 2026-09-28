'use strict';
window.Gallery=(()=>{
 const sets=[{name:'기본 차림',looks:[0,1]},{name:'외출 차림',looks:[2]},{name:'편안한 일상',looks:[3]},{name:'산책 차림',looks:[4]},{name:'특별한 데이트',looks:[5]},{name:'일상 속 첫 만남',looks:[6,7,8]}];
 const validKey=k=>typeof k==='string'&&CAST.some(c=>Array.from({length:9},(_,i)=>c.id+':'+i).includes(k));
 function clean(a){return Array.isArray(a)?[...new Set(a.filter(validKey))]:[];}
 function merge(...a){return clean(a.flat());}
 function seen(s){if(!s)return[];const out=[];const add=(id,n)=>{if(Number.isInteger(n)&&n>=0&&n<=8)out.push(id+':'+n);};
 for(const c of CAST){for(let i=0;i<(s.progress?.[c.id]||0);i++)add(c.id,c.moods[i]);for(let i=0;i<(s.dates?.[c.id]||0);i++)add(c.id,c.outingMoods[i]);if(s.gifts?.[c.id])add(c.id,8);}
 if(s.scene)add(s.scene.id,s.scene.mood);
 if(s.ending&&s.ending.id!=='solo'){const c=CAST.find(c=>c.id===s.ending.id);if(c){if(s.ending.kind==='good')ROMANCE_ENDINGS[c.id].slice(0,(s.ending.page||0)+1).forEach(p=>add(c.id,p[3]??2));else add(c.id,c.normalMood??2);}}
 return clean(out);}
 function outfits(c){const used=new Set([...c.moods,...c.outingMoods,...ROMANCE_ENDINGS[c.id].map(p=>p[3]??2),c.normalMood??2,8]);if(used.has(0)||used.has(1)){used.add(0);used.add(1);}return sets.map(g=>({...g,looks:g.looks.filter(n=>used.has(n)||(n>=6))})).filter(g=>g.looks.length);}
 function fromEndings(entries){const out=[];if(!Array.isArray(entries))return out;for(const c of CAST){if(entries.includes(c.id+'-good')){out.push(c.id+':'+c.moods[0]);for(const p of ROMANCE_ENDINGS[c.id])out.push(c.id+':'+(p[3]??2));}if(entries.includes(c.id+'-normal'))out.push(c.id+':'+c.moods[0],c.id+':'+(c.normalMood??2));}return clean(out);}
 return{clean,merge,seen,outfits,fromEndings};
})();
