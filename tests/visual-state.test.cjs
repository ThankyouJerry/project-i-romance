const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({window:{}});
for(const f of ['story','chapters','chapters-more','world','endings','wardrobe','reactions','route-revisions','gift-memories','story-continuity','addressing','engine']){vm.runInContext(fs.readFileSync(`dist/${f}.js`,'utf8'),ctx);Object.assign(ctx,ctx.window)}
const {CAST,Game:G,WORLD,ROMANCE_ENDINGS}=ctx;
const usedPlaces=new Set();
for(const c of CAST){
 const looks=[...c.moods,...c.outingMoods,...ROMANCE_ENDINGS[c.id].map(p=>p[3])];
 assert(looks.includes(5),`${c.id}: date outfit must be connected`);
 for(const family of ['sprite','wardrobe','role'])assert(fs.existsSync(`dist/assets/generated/${family}-${c.id}.webp`));
 for(const place of [...c.places,...c.outingPlaces,...ROMANCE_ENDINGS[c.id].map(p=>p[0])]){assert(WORLD.locations.includes(place));usedPlaces.add(place);assert(fs.existsSync(`dist/assets/generated/bg-${place}.webp`));}
 for(let index=0;index<c.events.length;index++){
  const s=G.fresh('의상 검증');s.progress[c.id]=index;while(G.availability(s,c))G.pass(s);assert(G.visit(s,c.id));const look=s.scene.mood,place=s.scene.place;
  const saved=G.migrate(JSON.parse(JSON.stringify(s)));assert(saved);assert.equal(saved.scene.mood,look);assert.equal(saved.scene.place,place);
  while(s.scene.step<s.scene.lines.length)G.next(s);G.choose(s,0);if(look>=6)assert(s.scene.mood>=6&&s.scene.mood<=8,'role expression must keep the outfit');else if(look>=2)assert.equal(s.scene.mood,look,'a reply must not change clothing');
 }
}
for(const p of ['hallway','market','gallery','photobooth','seaside','raincafe','laundromat','rainstreet'])assert(usedPlaces.has(p),`new background unused: ${p}`);
const legacy=G.fresh('이전 저장');legacy.turn=1;G.visit(legacy,'honey');legacy.scene.mood=2;legacy.scene.place='office';assert(G.migrate(legacy),'previous visual state remains readable');
console.log('PASS: all 11 date outfits connected; scene assets exist; save compatibility; clothing remains stable after a reply.');

for(const c of CAST){assert.equal(c.portraitMood,6);assert(c.moods[0]>=6,`${c.id}: first scene uses role clothing`);for(const which of [0,1]){const s=G.fresh('표정검사');while(G.availability(s,c))G.pass(s);G.visit(s,c.id);while(s.scene.step<s.scene.lines.length)G.next(s);G.choose(s,which);assert.equal(s.scene.mood,s.scene.delta>0?8:7);assert(G.migrate(s));}}
console.log('PASS: all 11 first scenes and portraits use role clothing; positive/negative expressions persist.');

for(const [id,indices] of Object.entries({honey:[0,1,2,3,5],dragon:[0,1,3,5],popo:[0,2,3,4],yui:[0,1,4,7],siyo:[0,1,3,6],mone:[0,1,4,5],ori:[0,3,4,6]}))for(const index of indices)assert(G.byId(id).moods[index]>=6,`${id} episode ${index+1}: role attire required`);
console.log('PASS: work and activity episodes retain the designated role outfit.');

// Scene geography regressions found during the second editorial review.
for(const [id,index,place] of [['honey',0,'rainstreet'],['ohwayo',4,'hallway'],['siyo',4,'market'],['popo',6,'raincafe'],['siho',7,'cafe']]){
 const s=G.fresh('맥락 검증');s.progress[id]=index;while(G.availability(s,G.byId(id)))G.pass(s);assert(G.visit(s,id));assert.equal(s.scene.place,place);const restored=G.migrate(JSON.parse(JSON.stringify(s)));assert.equal(restored.scene.place,place);
}
assert.equal(ROMANCE_ENDINGS.ohwayo[0][0],'hallway');
assert.equal(ROMANCE_ENDINGS.yui[0][0],'home');
console.log('PASS: corrected chapter and ending locations survive scene construction and save migration.');

assert.equal(G.byId('popo').events.length,8);assert.equal(G.byId('ori').events.length,8);assert.equal(G.byId('popo').moods[7],5);assert(G.byId('popo').moods.slice(0,7).every(n=>n!==5));assert.equal(G.byId('ori').moods[7],5);

// Regression: fixed rectangular thirds exposed the neighboring Rose hair in episode 2.
const clipContext={window:{}};vm.runInNewContext(fs.readFileSync('dist/sprite-clips.js','utf8'),clipContext);
const clips=clipContext.window.SPRITE_CLIPS;
function inCut(key,x,y){const points=clips[key].split(' ').map(p=>p.split(',').map(Number));let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [ax,ay]=points[i],[bx,by]=points[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside}return inside;}
assert.equal(Object.keys(clips).length,99);
for(const c of CAST)for(const f of ['sprite','role','wardrobe'])for(let i=0;i<3;i++){const key=`${f}-${c.id}-${i}`;assert(clips[key],key);assert(inCut(key,i*512+256,512),key+' retains central figure');}
for(const [x,y] of [[516,379],[534,458],[537,538],[1021,343],[1021,376]])assert(!inCut('role-rose-1',x,y),'neighbor hair must not render');
for(const [x,y] of [[866,309],[685,530],[637,755]])assert(inCut('role-rose-1',x,y),'Rose must remain visible');
const html=fs.readFileSync('dist/index.html','utf8');assert(html.indexOf('sprite-clips.js')<html.indexOf('app.js'));
console.log('PASS: all 99 sprite cuts have rendering boundaries; Rose episode 2 excludes both neighbors and retains its own figure.');

// Wardrobe prose regressions: compare the effective scripts after all overrides.
const ori=G.byId('ori');
assert.equal(ori.moods[1],3);assert.match(ori.events[1][6][0],/검정 베스트와 바지/);assert(!ori.events[1][6][0].includes('재킷은 그대로'));
assert.equal(ori.moods[5],4);assert.match(ori.events[5][6][0],/검정 카디건/);assert.match(ori.events[5][6][0],/검정 계열의 치마/);
assert(!/아이보리|푸른 치마|하늘색 원피스/.test(JSON.stringify([ori.events,ori.outings,ROMANCE_ENDINGS.ori])));
assert.match(ROMANCE_ENDINGS.ori[1][2],/검정 리본을 단 흰 블라우스와 검정 치마/);assert.equal(ROMANCE_ENDINGS.ori[1][3],2);
assert.match(ROMANCE_ENDINGS.ori[2][2],/검정 베스트와 바지/);assert.equal(ROMANCE_ENDINGS.ori[2][3],3);
assert(!/선글라스를 (가방에 넣|벗어)/.test(JSON.stringify([G.byId('rose').events,ROMANCE_ENDINGS.rose])));
assert(!ROMANCE_ENDINGS.siyo[1][2].includes('주머니'));assert.match(ROMANCE_ENDINGS.dragon[0][2],/후드 차림으로 갈아입/);
for(const f of ctx.WARDROBE_TEXT_FIXES){const s=G.fresh('기존 기록');const c=G.byId(f.id);while(G.availability(s,c))G.pass(s);G.visit(s,c.id);s.scene.lines=[['',f.from]];s.scene.step=0;s.log=[{speaker:'',text:f.from,day:1,characterId:f.id,sceneTitle:f.from}];s.journal=[{id:f.id,title:f.from,day:1}];const before=JSON.stringify(s);const saved=G.migrate(s);assert(saved);assert.equal(saved.scene.lines[0][1],f.to);assert.equal(saved.log[0].text,f.to);assert.equal(saved.log[0].sceneTitle,f.to);assert.equal(saved.journal[0].title,f.to);assert.equal(saved.scene.step,0);assert.equal(saved.turn,s.turn);assert.deepEqual(saved.affinity,s.affinity);assert.deepEqual(saved.progress,s.progress);assert.equal(JSON.stringify(s),before,'input save must remain untouched');assert.deepEqual(G.migrate(saved),saved,'migration is idempotent');}
console.log('PASS: outfit color/type/accessory prose and exact legacy text repair without progress or affinity changes.');
assert.match(G.byId('dragon').normal[1],/교대를 마치고 후드 차림으로 갈아입/);

// Friendship-ending outfits must be discoverable on a romance playthrough too.
vm.runInContext(fs.readFileSync('dist/gallery.js','utf8'),ctx);const Gallery=ctx.window.Gallery;
assert.equal(Gallery.seen(G.fresh('처음')).length,0,'fresh players have no unlocked outfits');
for(const [id,index] of [['yui',5],['siyo',7],['siho',4]]){
 for(const option of [0,1]){
  const c=G.byId(id),s=G.fresh('옷장 검사');s.progress[id]=index;s.turn=c.hours[0];
  assert(G.visit(s,id));assert.equal(s.scene.mood,2);assert(Gallery.seen(s).includes(id+':2'),'viewing this scene unlocks the cardigan');
  while(s.scene.step<s.scene.lines.length)G.next(s);G.choose(s,option);
  assert.equal(s.scene.mood,2,'both responses retain the cardigan');assert(G.migrate(s));
 }
}
for(const c of CAST){
 const reachable=[...c.moods,...c.outingMoods,...ROMANCE_ENDINGS[c.id].map(p=>p[3]??2)];
 for(const group of Gallery.outfits(c))assert(group.looks.some(n=>reachable.includes(n)),c.id+' '+group.name+' must not require a friendship ending');
}
console.log('PASS: 3 cardigans unlock during main episodes, persist after either choice, and all 55 outfits are reachable without friendship endings.');
