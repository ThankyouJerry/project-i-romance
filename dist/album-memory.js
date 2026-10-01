'use strict';
window.AlbumMemory=(()=>{
 const clone=v=>JSON.parse(JSON.stringify(v));
 const keyOK=k=>k==='solo-normal'||CAST.some(c=>k===c.id+'-good'||k===c.id+'-normal');
 function contextOK(v,key){return !!(v&&typeof v==='object'&&!Array.isArray(v)&&typeof v.name==='string'&&v.name.length<=16&&(v.honeyAddress===undefined||['formal','casual'].includes(v.honeyAddress))&&(v.petName===undefined||key==='siho-good'&&['여보','오빠'].includes(v.petName)));}
 function validRecord(key,r){const max=key.endsWith('-good')?3:1;return keyOK(key)&&r&&contextOK(r.context,key)&&Array.isArray(r.pages)&&r.pages.length>0&&r.pages.length<=max&&new Set(r.pages.map(p=>p.index)).size===r.pages.length&&r.pages.every(p=>Number.isInteger(p.index)&&p.index>=0&&p.index<max&&typeof p.title==='string'&&p.title.length<=300&&typeof p.text==='string'&&p.text.length<=12000&&WORLD.locations.includes(p.place)&&Number.isInteger(p.mood)&&p.mood>=0&&p.mood<=8);}
 function clean(records){if(!records||typeof records!=='object'||Array.isArray(records))return{};return Object.fromEntries(Object.entries(records).filter(([k,r])=>validRecord(k,r)).map(([k,r])=>[k,clone(r)]));}
 const complete=(key,r)=>validRecord(key,r)&&r.pages.length===(key.endsWith('-good')?3:1);
 function record(s,records){const result=clean(records),e=s?.ending;if(!e)return result;const key=e.id+'-'+e.kind,c=Game.byId(e.id),pages=Game.endingPages(s),i=pages?e.page||0:0,p=pages?.[i],[title,text]=Game.endingInfo(s);
 const context={name:s.name,...(s.honeyAddress?{honeyAddress:s.honeyAddress}:{}),...(e.petName?{petName:e.petName}:{})};
 const current=validRecord(key,e.memory)?clone(e.memory):{context,pages:[]};current.context=context;
 const page={index:i,title:p?.[1]||title,text:p?.[2]||text,place:p?.[0]||c?.home||'park',mood:p?.[3]??c?.normalMood??2};current.pages=current.pages.filter(a=>a.index!==i).concat(page).sort((a,b)=>a.index-b.index);e.memory=current;
 // Preserve a previously completed reading while a new playthrough is unfinished.
 if(!complete(key,result[key])||complete(key,current))result[key]=clone(current);return result;}
 function bundle(state,data={}){return {format:2,state:clone(state),endings:(data.endings||[]).filter(keyOK),gallery:Gallery.clean(data.gallery),gallerySources:Gallery.sources(data.gallerySources),endingRecords:clean(data.endingRecords),endingContexts:data.endingContexts||{},...(['여보','오빠'].includes(data.sihoPetName)?{sihoPetName:data.sihoPetName}:{})};}
 function unpack(d){if(!d||typeof d!=='object')throw Error('save');const s=Game.migrate(d.state);if(!s||!Array.isArray(d.endings)||d.endings.some(k=>!keyOK(k)))throw Error('state');
 if(d.gallery!==undefined&&(!Array.isArray(d.gallery)||d.gallery.length>99||Gallery.clean(d.gallery).length!==d.gallery.length))throw Error('gallery');
 for(const field of ['gallerySources','endingRecords'])if(d[field]!==undefined&&(!d[field]||typeof d[field]!=='object'||Array.isArray(d[field])))throw Error(field);
 const records=clean(d.endingRecords);if(d.endingRecords&&Object.keys(records).length!==Object.keys(d.endingRecords).length)throw Error('records');
 const sources=Gallery.sources(d.gallerySources);if(d.gallerySources&&Object.keys(sources).length!==Object.keys(d.gallerySources).length)throw Error('sources');
 if(d.endingContexts!==undefined&&(!d.endingContexts||typeof d.endingContexts!=='object'||Array.isArray(d.endingContexts)||Object.entries(d.endingContexts).some(([k,v])=>!d.endings.includes(k)||!contextOK(v,k))))throw Error('contexts');
 if(d.sihoPetName!==undefined&&!['여보','오빠'].includes(d.sihoPetName))throw Error('pet name');
 const pet=d.sihoPetName||(s.ending?.id==='siho'?s.ending.petName:undefined);
 return {state:s,endings:d.endings,gallery:d.gallery||[],gallerySources:sources,endingRecords:records,endingContexts:d.endingContexts||{},sihoPetName:pet};}
 return{clean,complete,record,bundle,unpack,validRecord};
})();
