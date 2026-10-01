'use strict';
window.Gallery=(()=>{
 const sets=[{name:'일상 속 첫 만남',looks:[6,7,8,0,1]},{name:'외출 차림',looks:[2]},{name:'편안한 일상',looks:[3]},{name:'산책 차림',looks:[4]},{name:'특별한 데이트',looks:[5]}];
 const validKey=k=>typeof k==='string'&&CAST.some(c=>Array.from({length:9},(_,i)=>c.id+':'+i).includes(k));
 function clean(a){return Array.isArray(a)?[...new Set(a.filter(validKey))]:[];}
 function merge(...a){return clean(a.flat());}
 function sources(a){if(!a||typeof a!=='object'||Array.isArray(a))return{};return Object.fromEntries(Object.entries(a).filter(([k,v])=>validKey(k)&&v&&Number.isInteger(v.day)&&v.day>=1&&v.day<=28&&typeof v.title==='string'&&v.title.length<=300&&['event','date','gift','afterstory','ending'].includes(v.kind)));}
 function seen(s){return Object.keys(sources(s?.looks));}
 function record(s){if(!s)return[];let id,mood,title,kind;const sc=s.scene;
 if(sc){({id,mood,type:kind}=sc);title=(sc.type==='event'?`${sc.index+1}화 · `:sc.type==='afterstory'?'후일담 · ':'')+sc.title;}
 else if(s.ending&&s.ending.id!=='solo'){id=s.ending.id;kind='ending';const c=CAST.find(c=>c.id===id);if(!c)return seen(s);const p=Game.endingPages(s)?.[s.ending.page||0];mood=p?.[3]??c.normalMood??2;title=p?'연애 결말 · '+p[1]:'우정 결말 · '+c.normal[0];}
 if(!validKey(id+':'+mood))return seen(s);if(mood<2)mood+=6;
 s.looks=sources(s.looks);const key=id+':'+mood;if(!s.looks[key])s.looks[key]={day:Game.day(s),title,kind};return seen(s);}
 function outfits(c){return sets.map(g=>({...g,name:c.id==='ori'&&g.looks[0]===3?'집에서도 정장':g.name,looks:[...g.looks]}));}
 // A historical ending flag proves neither which pages nor which clothes were seen.
 function fromEndings(){return[];}
 return{clean,merge,sources,seen,record,outfits,fromEndings};
})();
