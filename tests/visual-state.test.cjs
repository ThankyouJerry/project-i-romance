const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({window:{}});
for(const f of ['story','chapters','chapters-more','world','endings','wardrobe','reactions','route-revisions','engine']){vm.runInContext(fs.readFileSync(`dist/${f}.js`,'utf8'),ctx);Object.assign(ctx,ctx.window)}
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
