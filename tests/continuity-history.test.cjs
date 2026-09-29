'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ctx=vm.createContext({window:{}});
// Exercise the actual production script order, rather than a test-only selection.
const html=fs.readFileSync('dist/index.html','utf8');
const scripts=[...html.matchAll(/<script[^>]+src="([^"?]+)(?:\?[^"]*)?"[^>]*>/g)].map(m=>m[1]);
assert(scripts.some(s=>s.endsWith('story-continuity.js')),'continuity patches must ship in index.html');
for(const script of scripts){
 if(script.endsWith('app.js'))continue;
 vm.runInContext(fs.readFileSync(`dist/${script.replace(/^\.\//,'')}`,'utf8'),ctx,{filename:script});
 Object.assign(ctx,ctx.window);
}
const {CAST,Game:G}=ctx;
const clone=x=>JSON.parse(JSON.stringify(x));
function available(s,c){let n=0;while(G.availability(s,c)&&n++<6)G.pass(s);assert.equal(G.availability(s,c),null);}
function toChoice(s){let n=0;while(s.scene.step<s.scene.lines.length&&n++<20)G.next(s);assert(s.scene.choice);}
function complete(s){let n=0;while(s.scene&&n++<30){if(s.scene.choice&&s.scene.step===s.scene.lines.length)G.choose(s,0);else G.next(s);}assert.equal(s.scene,null);}
function history(s){const before=JSON.stringify(s),lines=G.currentConversation(s);assert.equal(JSON.stringify(s),before,'history lookup is read-only');return clone(lines);}
assert.equal(CAST.length,11);
for(const c of CAST){
 const s=G.fresh('기록 검증');assert.deepEqual(history(s),[]);available(s,c);assert(G.visit(s,c.id));
 const first=clone(s.scene.lines);assert.equal(history(s).length,1);assert.equal(history(s)[0].text,first[0][1]);
 assert(!history(s).some(l=>l.text===first.at(-1)[1]),`${c.id}: future line hidden`);
 const mutable=G.currentConversation(s);mutable[0].text='외부 수정';assert.equal(history(s)[0].text,first[0][1],'returned history detached from save');
 G.next(s);assert.equal(history(s).length,2);
 const resumed=G.migrate(clone(s));assert(resumed);assert.deepEqual(history(resumed),history(s));
 // Saves before logStart existed still have per-scene metadata.
 const legacy=clone(resumed);delete legacy.scene.logStart;assert.deepEqual(history(G.migrate(legacy)),history(s));
 // Older saves without any reliable scene metadata safely show only the current visible lines.
 const old=clone(legacy);for(const l of old.log){delete l.characterId;delete l.sceneTurn;delete l.sceneTitle;}
 old.log.unshift({speaker:'',text:'이전 편의 문장',day:1});
 const oldHistory=history(G.migrate(old));assert.equal(oldHistory.length,2);assert(!oldHistory.some(l=>l.text==='이전 편의 문장'));
 toChoice(s);assert.equal(history(s).length,first.length,`${c.id}: choosing does not reveal options as spoken dialogue`);
 const picked=clone(s.scene.options[0]),unchosen=clone(s.scene.options[1]);assert(G.choose(s,0));
 let h=history(s);assert.equal(h.length,first.length+2);assert.equal(h.at(-2).text,picked.text);assert.equal(h.at(-1).text,picked.reply);
 assert(!h.some(l=>l.text===unchosen.reply),`${c.id}: unselected answer is never recorded`);
 assert.deepEqual(history(G.migrate(clone(s))),h);
 G.next(s);h=history(s);assert.equal(h.length,first.length+3);complete(s);assert.deepEqual(history(s),[]);
 available(s,c);assert(G.visit(s,c.id));h=history(s);assert.equal(h.length,1);assert.equal(h[0].sceneTitle,c.events[1][0]);assert(!h.some(l=>l.text===picked.text),`${c.id}: next episode excludes previous choices`);
}
console.log('PASS: all 11 members have read-only, seen-only current-episode history, selected answers, save/reload and conservative legacy fallback.');

let callbackCount=0;
for(const c of CAST){
 assert.equal(c.events.length,8,`${c.id}: eight episodes preserved`);
 const callbacks=c.events.flatMap((e,p)=>(!e[7]?[]:Array.isArray(e[7])?e[7]:[e[7]]).map(echo=>({p,echo})));
 assert(callbacks.length>=2,`${c.id}: at least two meaningful callbacks`);
 for(const {p,echo} of callbacks){
  callbackCount++;assert(echo.at<p,`${c.id}: callback references an earlier episode`);assert.notEqual(echo.yes,echo.no);
  for(const score of [2,0]){
   const s=G.fresh('선택 검증');s.honeyAddress='formal';s.progress[c.id]=p;s.choices[c.id][echo.at]=score;available(s,c);assert(G.visit(s,c.id));
   const lines=s.scene.lines.map(l=>l[1]);assert(lines.includes(score===2?echo.yes:echo.no),`${c.id}/${p}: correct remembered branch`);assert(!lines.includes(score===2?echo.no:echo.yes),`${c.id}/${p}: other branch hidden`);assert(G.valid(s));
  }
 }
 const episode8=c.events[7];
 for(const o of [episode8[4],episode8[5]])assert(!/(오늘부터 (?:사귀|연인)|우리 (?:이제 )?사귀|연인이 (?:되|됐)|친구로 지내)/.test(o[0]+' '+o[2]),`${c.id}: episode 8 leaves relationship confirmation for optional ending`);
 for(const affinity of [89,90,100]){
  const s=G.fresh('결말 검증');s.affinity[c.id]=affinity;s.progress[c.id]=8;
  assert.equal(G.canConfess(s,c.id),affinity>=90);assert.equal(G.finish(s,c.id),true);
  if(affinity>=90){assert.equal(s.ending.kind,'good');assert.equal(s.ending.early,false);}
 }
}
for(const [id,variants] of Object.entries(ctx.STORY_VARIANTS||{}))for(const [p,v] of Object.entries(variants))for(const score of [2,0]){
 const c=G.byId(id),s=G.fresh('이어지는 장면');s.progress[id]=Number(p);s.choices[id][v.at]=score;available(s,c);assert(G.visit(s,id));
 const expected=score===2?v.yes:v.no,other=score===2?v.no:v.yes,lines=s.scene.lines.map(l=>l[1]);
 for(const text of expected)assert(lines.includes(text),`${id}/${p}: branch scene is present`);
 for(const text of other.filter(t=>!expected.includes(t)))assert(!lines.includes(text),`${id}/${p}: incompatible scene is absent`);
 assert(G.valid(s));
}
assert(callbackCount>=22);
console.log(`PASS: ${callbackCount} choice callbacks cover all 11 eight-episode routes; optional romance unlocks after episode 8 at 90.`);
const ori=CAST.find(c=>c.id==='ori');assert.deepEqual(clone(ori.outingMinProgress),[2,6]);
for(const [outing,threshold] of [[0,2],[1,6]])for(const progress of [threshold-1,threshold]){
 const s=G.fresh('의상 순서');s.dates.ori=outing;s.progress.ori=progress;s.money=10000;available(s,ori);const before=JSON.stringify(s);
 assert.equal(G.outing(s,'ori'),progress>=threshold);
 if(progress<threshold)assert.equal(JSON.stringify(s),before,'locked outing spends no money or turn');else assert.equal(s.money,8000);
}
console.log('PASS: Ori outings follow outfit progression at episodes 2/6 without charging for locked outings.');

assert.equal(CAST.find(c=>c.id==='popo').events[3][5][1],1,'resting after a mistake is a supportive choice');
assert(ctx.ROMANCE_ENDINGS.mone[2][2].includes('연구실 지원 결과는 아직'));
assert(ctx.ROMANCE_ENDINGS.rose[0][2].includes('천천히 손을 내렸다'));

const ohwayo=G.byId('ohwayo');
for(const p of [1,7,8]){const s=G.fresh('공연 순서');s.progress.ohwayo=p;s.dates.ohwayo=1;available(s,ohwayo);const before=JSON.stringify(s);assert.equal(G.outing(s,'ohwayo'),p===8);if(p<8)assert.equal(JSON.stringify(s),before);}
assert(!ohwayo.events[6][6][0].includes('공연 당일'));
assert(ctx.STORY_VARIANTS.ohwayo[7].no[1].includes('지난 리허설'));
assert(!G.byId('dragon').outings[0][3].some(x=>x.includes('지원서')));
assert(G.byId('mone').events[1][3].includes('원래 책갈피'));
console.log('PASS: concert follow-up waits for episode 8; rehearsal and job-application chronology and original bookmark custody are explicit.');
