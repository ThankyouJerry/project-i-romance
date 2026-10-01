'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({window:{}});
for(const file of ['story','chapters','chapters-more','world','endings','wardrobe','reactions','route-revisions','gift-memories','story-continuity','addressing','after-stories','engine','gallery','album-memory']){
 vm.runInContext(fs.readFileSync(`dist/${file}.js`,'utf8'),ctx,{filename:file});Object.assign(ctx,ctx.window);
}
const {CAST,Game:G,Gallery}=ctx,clone=x=>JSON.parse(JSON.stringify(x));
function ready(s,c){s.turn=c.hours[0];s.lastVisit[c.id]=-1;}
function complete(s,score){let guard=0;while(s.scene&&guard++<40){if(s.scene.choice&&s.scene.step===s.scene.lines.length){const i=s.scene.options.findIndex(o=>o.score===score);assert(i>=0);assert(G.choose(s,i));}else assert(G.next(s));assert(G.valid(s),'after-story save valid at every step');}assert.equal(s.scene,null);}
for(const c of CAST){
 const s=G.fresh('실제 의상');s.progress[c.id]=8;s.dates[c.id]=2;s.gifts[c.id]=true;
 assert.equal(Gallery.seen(s).length,0,'progress/date/gift flags do not prove clothing seen');
 s.scene={id:c.id,mood:6,title:'처음 본 장면',type:'event',index:0};
 assert.equal(Gallery.seen(s).length,0,'scene construction alone is not rendering');
 Gallery.record(s);assert.deepEqual([...Gallery.seen(s)],[c.id+':6']);
 const original=clone(s.looks[c.id+':6']);assert.equal(original.title,'1화 · 처음 본 장면');assert.equal(original.kind,'event');assert.equal(original.day,G.day(s));
 s.turn=8;s.scene.title='나중 장면';Gallery.record(s);assert.deepEqual(clone(s.looks[c.id+':6']),original,'first source is immutable');
 s.scene.mood=8;Gallery.record(s);assert(Gallery.seen(s).includes(c.id+':8'));
 const groups=Gallery.outfits(c);assert.equal(groups.length,5);assert(groups[0].looks.includes(6));assert.deepEqual(clone(groups.slice(1).map(g=>g.looks[0])),[2,3,4,5]);
 s.scene=null;s.affinity[c.id]=90;assert(G.finish(s,c.id));
 const before=clone(Gallery.seen(s));assert.deepEqual(clone(Gallery.seen(s)),before);
 const visited=new Set(before);
 for(let page=0;page<3;page++){s.ending.page=page;assert.deepEqual(new Set(Gallery.seen(s)),visited,'moving ending state does not render clothing');Gallery.record(s);const look=ctx.ROMANCE_ENDINGS[c.id][page][3]??2;visited.add(c.id+':'+(look<2?look+6:look));assert.deepEqual(new Set(Gallery.seen(s)),visited);}
 assert.equal(Gallery.fromEndings([c.id+'-good',c.id+'-normal']).length,0);
 const restored=G.migrate(clone(s));assert(restored);assert.deepEqual(clone(restored.looks),clone(s.looks));
}
console.log('PASS: all 11 clothing collections require explicit rendering, retain first source and fixed five-outfit order, and survive save restore.');
for(const c of CAST){
 for(const progress of [0,7]){const s=G.fresh('아직');ready(s,c);s.progress[c.id]=progress;assert(!G.canAfterStory(s,c.id));assert(!G.afterStory(s,c.id));}
 for(const score of [1,2])for(const affinity of [70,95])for(const finalDay of [false,true]){
  let s=G.fresh('후일담');ready(s,c);s.progress[c.id]=8;s.affinity[c.id]=affinity;if(finalDay)s.turn=G.TOTAL;
  assert(G.canAfterStory(s,c.id),`${c.id}: available after chapter 8, final=${finalDay}`);assert(G.afterStory(s,c.id));assert(!G.canAfterStory(s,c.id));assert(!s.afterStories[c.id],'not consumed until scene complete');
  s=G.migrate(clone(s));assert(s,'active after-story restores even at final turn');complete(s,score);
  assert.equal(s.progress[c.id],8);assert.equal(s.affinity[c.id],Math.min(100,affinity+(score===2?16:8)));assert.equal(s.afterStories[c.id],true);
  s=G.migrate(clone(s));assert(s);assert(!G.canAfterStory(s,c.id));assert(!G.afterStory(s,c.id));
 }
 for(const reason of ['scene','ending','resolved']){const s=G.fresh('차단');ready(s,c);s.progress[c.id]=8;if(reason==='scene')s.scene={id:c.id};if(reason==='ending')s.ending={id:c.id,kind:'normal'};if(reason==='resolved')s.resolvedRoutes[c.id]=true;assert(!G.canAfterStory(s,c.id));assert(!G.afterStory(s,c.id));}
 const sameDay=G.fresh('당일');ready(sameDay,c);sameDay.progress[c.id]=8;sameDay.lastVisit[c.id]=G.day(sameDay);assert(!G.afterStory(sameDay,c.id));
 if(c.hours.length===1){const wrongHour=G.fresh('시간');wrongHour.progress[c.id]=8;wrongHour.turn=1-c.hours[0];assert(!G.afterStory(wrongHour,c.id));}
 assert.equal(c.events.length,8,'after-story never becomes episode 9');
}
assert(!G.canAfterStory(G.fresh('잘못된 인물'),'missing'));assert(!G.afterStory(G.fresh('잘못된 인물'),'missing'));
console.log('PASS: 11 one-time after-stories, 8-chapter gate, both reward choices/cap, active save restoration, final-turn recovery, schedule and resolved-route guards.');
const A=ctx.AlbumMemory;
for(const c of CAST){
 const s=G.fresh('결말 독자');s.progress[c.id]=8;s.affinity[c.id]=90;assert(G.finish(s,c.id));let records={};
 assert(!A.complete(c.id+'-good',records[c.id+'-good']));
 for(let page=0;page<3;page++){
  s.ending.page=page;records=A.record(s,records);const r=records[c.id+'-good'];
  assert.equal(r.pages.length,page+1);assert.equal(A.complete(c.id+'-good',r),page===2);
  assert.deepEqual(clone(r.pages.map(p=>p.index)),Array.from({length:page+1},(_,i)=>i));
  assert.equal(r.pages[page].text,G.endingPages(s)[page][2]);
  const next=A.record(s,records);assert.equal(next[c.id+'-good'].pages.length,page+1,'rerender cannot duplicate a page');
 }
 const prior=clone(records[c.id+'-good']);const fresh=G.fresh('다른 독자');fresh.progress[c.id]=8;fresh.affinity[c.id]=90;G.finish(fresh,c.id);records=A.record(fresh,records);assert.deepEqual(clone(records[c.id+'-good']),prior,'unfinished replay preserves previously completed reading');
 const friend=G.fresh('우정');friend.progress[c.id]=8;assert(G.finish(friend,c.id));const normal=A.record(friend,{});assert(A.complete(c.id+'-normal',normal[c.id+'-normal']));
}
for(const petName of ['여보','오빠']){
 const s=G.fresh('호칭 독자');s.progress.siho=8;s.affinity.siho=90;G.finish(s,'siho');let records=A.record(s,{});assert(!A.complete('siho-good',records['siho-good']));
 G.choosePetName(s,petName);records=A.record(s,records);assert(!A.complete('siho-good',records['siho-good']));s.ending.page=2;records=A.record(s,records);Gallery.record(s);assert(A.complete('siho-good',records['siho-good']));
 const data={endings:['siho-good'],gallery:Gallery.seen(s),gallerySources:s.looks,endingRecords:records,endingContexts:{'siho-good':{name:s.name,petName}},sihoPetName:petName};
 const restored=A.unpack(clone(A.bundle(s,data)));assert.equal(restored.sihoPetName,petName);assert.equal(restored.state.ending.petName,petName);assert.equal(restored.endingRecords['siho-good'].context.petName,petName);
 assert(restored.endingRecords['siho-good'].pages[1].text.includes(petName+', 여기'));assert(restored.endingRecords['siho-good'].pages[2].text.includes(petName+'. 오늘은'));
 assert.deepEqual(clone(restored.gallerySources),clone(s.looks));assert.deepEqual(clone(restored.gallery),clone(data.gallery));assert.deepEqual(clone(restored.endingRecords),clone(records));
 const active=clone(A.bundle(s,data));delete active.sihoPetName;assert.equal(A.unpack(active).sihoPetName,petName,'active ending supports legacy missing global pet-name field');
 const later=G.fresh('새 회차');const carried=A.unpack(clone(A.bundle(later,data)));assert.equal(carried.sihoPetName,petName);assert(carried.endingRecords['siho-good'].pages[1].text.includes(petName));
 for(const corrupt of ['pet','record','gallery','source']){const bad=clone(A.bundle(s,data));if(corrupt==='pet')bad.sihoPetName='잘못된 호칭';if(corrupt==='record')bad.endingRecords['siho-good'].pages[0].index=99;if(corrupt==='gallery')bad.gallery.push('missing:7');if(corrupt==='source')bad.gallerySources['siho:8']={day:99,title:'미래',kind:'event'};assert.throws(()=>A.unpack(bad),corrupt+' malformed import rejected');}
}
const legacyState=G.fresh('예전 저장');legacyState.progress.siho=8;legacyState.affinity.siho=90;G.finish(legacyState,'siho');const legacyImport=A.unpack({state:legacyState,endings:['siho-good'],gallery:['siho:6']});assert.equal(Object.keys(legacyImport.endingRecords).length,0,'old ending flags do not invent all pages');assert.deepEqual(clone(legacyImport.gallery),['siho:6'],'existing clothing collection is retained');assert.equal(Object.keys(legacyImport.gallerySources).length,0,'no made-up scene sources');
console.log('PASS: ending snapshots unlock only rendered pages, preserve completed readings, retain both Siho pet names through export/import and new runs, and reject malformed collection data.');
