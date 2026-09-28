const {readFileSync}=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({window:{}});
for(const file of ['story','chapters','chapters-more','world','endings','wardrobe','reactions','route-revisions','gift-memories','engine']){vm.runInContext(readFileSync(`dist/${file}.js`,'utf8'),ctx);for(const k of ['CAST','EXTRA_CHAPTERS','WORLD','GIFTS','ROMANCE_ENDINGS','LOOK_LABELS','CHARACTER_REACTIONS','Game'])if(ctx.window[k])ctx[k]=ctx.window[k];}
const {CAST,Game:G}=ctx,clone=x=>JSON.parse(JSON.stringify(x));
function available(s,c){let guard=0;while(G.availability(s,c)&&!G.over(s)&&guard++<5)G.pass(s);assert.equal(G.availability(s,c),null);}
function complete(s,best=true){let guard=0;while(s.scene&&guard++<30){if(s.scene.choice&&s.scene.step===s.scene.lines.length){const scores=s.scene.options.map(o=>o.score);G.choose(s,scores.indexOf(best?Math.max(...scores):Math.min(...scores)));}else G.next(s);assert.ok(G.valid(s),'save remains valid');}assert.equal(s.scene,null);}
assert.equal(CAST.length,11);
for(const c of CAST){assert.equal(c.events.length,8);assert.equal(c.outings.length,2);assert.equal(new Set(c.events.map(e=>e[0])).size,8);
 for(const best of [true,false]){const s=G.fresh('검증');for(let n=0;n<8;n++){available(s,c);assert.ok(G.visit(s,c.id));assert.equal(s.scene.title,c.events[n][0]);assert.equal(s.scene.place,c.places[n]);complete(s,best);assert.equal(s.progress[c.id],n+1);assert.ok(!G.visit(s,c.id),'same day unavailable');}assert.ok(G.finish(s,c.id));assert.equal(s.ending.kind,best?'good':'normal');assert.ok(G.valid(s));if(best){assert.equal(s.affinity[c.id],100);assert.ok(s.turn<56);}}
 const d=G.fresh('데이트');d.progress[c.id]=1;available(d,c);const money=d.money;assert.ok(G.outing(d,c.id));assert.equal(d.money,money-2000);complete(d);assert.equal(d.affinity[c.id],10);available(d,c);G.outing(d,c.id);complete(d,false);assert.equal(d.affinity[c.id],8);available(d,c);assert.equal(G.outing(d,c.id),false);assert.ok(G.gift(d,c.id,c.gift));complete(d);assert.equal(d.affinity[c.id],16);available(d,c);assert.equal(G.gift(d,c.id,c.gift),false);
}
const early=G.fresh('고백');early.affinity.honey=100;early.progress.honey=2;assert.ok(G.finish(early,'honey'));assert.ok(early.ending.early);assert.ok(G.valid(early));assert.match(G.endingInfo(early)[1],/사귀고 싶어/);
const solo=G.fresh('혼자');while(!G.over(solo))G.pass(solo);assert.ok(G.finish(solo,'solo'));assert.ok(G.valid(solo));
const old={version:1,name:'기존',turn:28,progress:Object.fromEntries(CAST.map(c=>[c.id,3])),affinity:Object.fromEntries(CAST.map(c=>[c.id,6])),scene:null,log:[],journal:[],ending:{id:'honey',kind:'good'}};
const migrated=G.migrate(old);assert.ok(migrated);assert.equal(migrated.progress.honey,3);assert.equal(migrated.affinity.honey,36);assert.equal(migrated.ending,null);assert.equal(old.version,1);available(migrated,CAST[0]);G.visit(migrated,'honey');assert.equal(migrated.scene.index,3);assert.equal(migrated.scene.title,'박수가 끝난 자리');
const mid=G.fresh('중간');G.pass(mid);G.visit(mid,'honey');while(mid.scene.step<mid.scene.lines.length)G.next(mid);G.choose(mid,mid.scene.options.findIndex(o=>o.score===2));const resumed=G.migrate(clone(mid));assert.ok(resumed);const affinity=resumed.affinity.honey;complete(resumed);assert.equal(resumed.affinity.honey,affinity);assert.equal(resumed.progress.honey,1);
const broken=clone(resumed);broken.journal.push({id:'missing',title:'bad',day:1});assert.equal(G.migrate(broken),null);const badScene=clone(mid);badScene.scene.choice=true;badScene.scene.options=null;assert.equal(G.migrate(badScene),null);
const broke=G.fresh('예산');broke.money=0;broke.progress.aya=1;assert.equal(G.outing(broke,'aya'),false);assert.equal(G.gift(broke,'aya','keyring'),false);G.pass(broke,true);assert.equal(broke.money,6000);
for(const score of [0,2]){const e=G.fresh('기억');e.progress.honey=4;e.choices.honey[3]=score;G.pass(e);G.visit(e,'honey');assert.ok(e.scene.lines.some(l=>l[1].includes(score===2?'케이크를 나눠':'너무 빨리')));}
console.log('PASS: 88 chapters; 22 outings/both branches; 23 endings plus early max-bond ending; schedule, budget, gifts, anti-repeat, save migration, reaction resume, prior-choice callbacks, malformed saves.');

for(const c of CAST){const pages=ctx.ROMANCE_ENDINGS[c.id];assert.equal(pages.length,3);assert.ok(pages.every(p=>p[2].length>220));assert.match(pages[0][2],/사귀|사귈|연인/);const s=G.fresh("검증");s.affinity[c.id]=100;G.finish(s,c.id);s.ending.page=2;assert.ok(G.migrate(s));s.ending.page=3;assert.equal(G.migrate(s),null);}
console.log("PASS: 11 unique three-scene romance endings, explicit mutual romance, first date, persisted ending pagination.");
for(const gift of ctx.GIFTS){const s=G.fresh('조사 검수');s.progress.aya=1;assert(G.gift(s,'aya',gift.id));const expected={'허브 티백':'허브 티백을','꽃 책갈피':'꽃 책갈피를','간식 꾸러미':'간식 꾸러미를','작은 머그컵':'작은 머그컵을','무지 노트':'무지 노트를','작은 열쇠고리':'작은 열쇠고리를'};assert(s.scene.lines[0][1].startsWith(expected[gift.name]+' 건넸다.'));assert.equal(s.scene.lines[1][1],ctx.CHARACTER_REACTIONS.aya[gift.id==='keyring'?'giftGood':'giftOther']);}
assert(!CAST.some(c=>c.events.some(e=>JSON.stringify(e).includes('네한테'))));
console.log('PASS: gift particles and character-specific responses; reported dialogue typo regression.');

// Every gift is welcome, regardless of the character's preferred item.
for(const c of CAST)for(const gift of ctx.GIFTS){
 const s=G.fresh('선물 검수');s.progress[c.id]=1;available(s,c);const money=s.money;
 assert.ok(G.gift(s,c.id,gift.id),`${c.id}/${gift.id}`);
 assert.equal(s.affinity[c.id],8);assert.equal(s.scene.delta,8);assert.equal(s.scene.mood,8);
 assert.equal(s.money,money-gift.cost);assert.equal(s.gifts[c.id],true);
 assert.equal(s.scene.lines[1][1],ctx.CHARACTER_REACTIONS[c.id][c.gift===gift.id?'giftGood':'giftOther']);
 const resumed=G.migrate(clone(s));assert.ok(resumed);complete(resumed);assert.equal(resumed.affinity[c.id],8);
 complete(s);assert.equal(s.affinity[c.id],8);available(s,c);assert.equal(G.gift(s,c.id,gift.id),false);
}
console.log('PASS: all 66 character/gift combinations welcome gifts with +8 affinity, happy expression, correct cost, save resume and one-gift limit.');

for(const name of ['여보','오빠']){const s=G.fresh('호칭');s.affinity.siho=100;assert(G.finish(s,'siho'));assert(G.choosePetName(s,name));for(const page of G.endingPages(s))assert(page[2].includes(name));const saved=G.migrate(clone(s));assert.equal(saved.ending.petName,name);assert(G.endingInfo(saved)[1].includes(name));assert(!G.choosePetName(s,'invalid'));const bad=clone(s);bad.ending.petName='invalid';assert.equal(G.migrate(bad),null);}
const oldSiho=G.fresh('기존 저장');oldSiho.affinity.siho=100;G.finish(oldSiho,'siho');assert(G.migrate(oldSiho));assert(G.endingPages(oldSiho)[0][2].includes('호칭'));const other=G.fresh('다른 인물');other.affinity.aya=100;G.finish(other,'aya');assert(!G.choosePetName(other,'여보'));assert(!G.choosePetName(G.fresh('진행 중'),'오빠'));
console.log('PASS: Siho pet-name choices, three ending scenes, save compatibility, invalid-name and other-route guards.');
const notebook=G.fresh('수첩');for(const id of ['aya','siho']){const c=G.byId(id);available(notebook,c);assert(G.visit(notebook,id));complete(notebook);}
for(const id of ['aya','siho']){const groups=G.conversations(notebook,id);assert.equal(groups.length,1);assert.equal(groups[0].title,G.byId(id).events[0][0]);assert(groups[0].lines.some(l=>l.speaker==='수첩'));assert(groups[0].lines.some(l=>!l.speaker));assert(groups[0].lines.every(l=>l.characterId===id));}
assert.equal(G.conversations(notebook).reduce((n,g)=>n+g.lines.length,0),notebook.log.length);assert(G.migrate(clone(notebook)));
const legacy=clone(notebook);for(const l of legacy.log){delete l.characterId;delete l.sceneTitle;delete l.sceneTurn;delete l.observation;}assert(G.migrate(legacy));assert.equal(G.conversations(legacy).reduce((n,g)=>n+g.lines.length,0),legacy.log.length);assert(G.conversations(legacy,'siho').every(g=>g.characterId==='siho'));
console.log('PASS: character journal keeps narration, player replies and scene titles; legacy logs remain accessible without duplication.');

for(const c of CAST)for(const amount of [89,90,99,100]){const s=G.fresh('고백 기준');s.progress[c.id]=2;s.affinity[c.id]=amount;assert.equal(G.canConfess(s,c.id),amount>=90);assert.equal(G.finish(s,c.id),amount>=90);if(amount>=90){assert.equal(s.ending.kind,'good');assert(G.migrate(clone(s)));}else{const bad=clone(s);bad.ending={id:c.id,kind:'good'};assert.equal(G.migrate(bad),null);}}
console.log('PASS: all 11 romance thresholds at 89/90/99/100, early endings and saved romance validation.');

const fanCases={honey:['허니비'],ohwayo:['하용'],dragon:['쑥떡','흑떡'],yui:['아담','특대담'],aya:['우유'],mone:['네모','동글이'],siyo:['바바'],rose:['마리'],popo:['포리'],siho:['신자','뽀신자']};
for(const [id,words] of Object.entries(fanCases))for(const word of words){const s=G.fresh('행복한'+word+'입니다');for(const c of CAST)assert.equal(s.affinity[c.id],c.id===id?10:0);assert(G.migrate(clone(s)));const old=clone(s);old.affinity[id]=3;assert.equal(G.migrate(old).affinity[id],3);}
assert.equal(G.fresh('쑥떡흑떡').affinity.dragon,10);assert.equal(G.fresh('신자뽀신자').affinity.siho,10);const mixed=G.fresh('허니비포리');assert.equal(mixed.affinity.honey,10);assert.equal(mixed.affinity.popo,10);assert.equal(G.fresh('허니비'.normalize('NFD')).affinity.honey,10);assert.equal(G.fresh('가'.repeat(16)+'허니비').affinity.honey,0);assert(Object.values(G.fresh('오리고기').affinity).every(v=>v===0));assert(Object.values(G.fresh('').affinity).every(v=>v===0));
const oldFan=clone(old);oldFan.name='허니비';assert.equal(G.migrate(oldFan).affinity.honey,36);
console.log('PASS: all fandom aliases, substring and normalized names, multiple fandoms, no stacking, stored-name limit, no Ori bonus, and no retroactive save bonus.');
vm.runInContext(readFileSync('dist/gallery.js','utf8'),ctx);const Gallery=ctx.window.Gallery;
assert.equal(Gallery.seen(G.fresh('새 게임')).length,0);
for(const c of CAST){const s=G.fresh('앨범');s.progress[c.id]=1;let keys=Gallery.seen(s);assert(keys.includes(c.id+':'+c.moods[0]));assert(!keys.includes(c.id+':5'));s.scene={id:c.id,mood:7};keys=Gallery.merge(keys,Gallery.seen(s));assert(keys.includes(c.id+':7'));s.scene=null;s.affinity[c.id]=90;G.finish(s,c.id);s.ending.page=0;keys=Gallery.seen(s);assert(keys.includes(c.id+':'+ctx.ROMANCE_ENDINGS[c.id][0][3]));s.ending.page=1;assert(Gallery.seen(s).includes(c.id+':'+ctx.ROMANCE_ENDINGS[c.id][1][3]));assert.equal(Gallery.outfits(c).filter(g=>g.looks.includes(6)||g.looks.includes(7)||g.looks.includes(8)).length,1);const combined=Gallery.merge(keys,Gallery.seen(G.fresh('다음 회차')));assert.deepEqual([...combined],[...keys]);}
assert.equal(Gallery.clean(['unknown:0','aya:9',null,{},'aya:6','aya:6']).length,1);
console.log('PASS: wardrobe discovery, locked late outfits, ending-page unlocks, expression grouping, persistent collection merge and malformed data.');

for(const c of CAST){const recovered=Gallery.fromEndings([c.id+'-good']);assert(recovered.includes(c.id+':'+c.moods[0]));for(const p of ctx.ROMANCE_ENDINGS[c.id])assert(recovered.includes(c.id+':'+(p[3]??2)));assert(recovered.every(k=>k.startsWith(c.id+':')));assert(Gallery.fromEndings([c.id+'-normal']).includes(c.id+':'+(c.normalMood??2)));assert.equal(Gallery.merge(recovered,recovered).length,recovered.length);}
assert.equal(Gallery.fromEndings(['solo-normal','unknown-good']).length,0);assert.equal(Gallery.fromEndings([]).length,0);
console.log('PASS: legacy ending-only collection restores earned outfits for all 11 characters without unlocking unrelated routes.');

let wardrobeTotal=0;for(const c of CAST){const groups=Gallery.outfits(c);assert.equal(groups.length,5,c.id);wardrobeTotal+=groups.length;const reachable=[...c.moods,...c.outingMoods,...ctx.ROMANCE_ENDINGS[c.id].map(p=>p[3]??2),c.normalMood??2,8];for(const group of groups)assert(group.looks.some(n=>reachable.includes(n)),c.id+' '+group.name+' must be obtainable');assert.equal(new Set(groups.flatMap(g=>g.looks)).size,9);}
assert.equal(wardrobeTotal,55);console.log('PASS: exactly 5 obtainable outfits per member, 55 total, all expression frames grouped without extra outfit counts.');

// Choosing a pet name advances immediately; later scenes speak to that choice in context.
for(const name of ['여보','오빠']){
 const s=G.fresh('호칭 진행');s.affinity.siho=90;assert(G.finish(s,'siho'));
 assert.equal(s.ending.page||0,0);assert(G.choosePetName(s,name));assert.equal(s.ending.page,1);
 const pages=G.endingPages(s);assert(pages[1][2].includes(name+', 여기'));
 assert(pages[2][2].includes(name+'. 오늘은 이러고 조금만 있어요.'));
 assert(pages[2][2].includes('자기 집으로 나를 초대했다'));
 assert.equal(G.migrate(clone(s)).ending.page,1);
 s.ending.page=0;assert(G.choosePetName(s,name==='여보'?'오빠':'여보'));assert.equal(s.ending.page,1);
}
console.log('PASS: both Siho pet-name choices advance to first date, retain save position and alter date and later meeting dialogue.');
