const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ctx=vm.createContext({window:{}});
for(const file of ['story','chapters','chapters-more','world','endings','wardrobe','reactions','route-revisions','gift-memories','story-continuity','engine']){
 vm.runInContext(readFileSync(`dist/${file}.js`,'utf8'),ctx,{filename:`${file}.js`});
 for(const key of Object.keys(ctx.window))ctx[key]=ctx.window[key];
}
const {CAST,Game:G}=ctx;
const clone=value=>JSON.parse(JSON.stringify(value));
function available(s,c){let attempts=0;while(G.availability(s,c)&&attempts++<5)G.pass(s);assert.equal(G.availability(s,c),null);}
function choices(s){let steps=0;while(s.scene&&s.scene.step<s.scene.lines.length&&steps++<20)G.next(s);assert(s.scene?.choice);}
function complete(s){let steps=0;while(s.scene&&steps++<30){if(s.scene.choice&&s.scene.step===s.scene.lines.length)G.choose(s,s.scene.options.findIndex(o=>o.score===2));else G.next(s);}assert.equal(s.scene,null);}

assert.equal(CAST.length,11);
const ids=new Set();
for(const c of CAST){
 const s=G.fresh('선물 기록');assert.equal(G.giftMemory(s,c.id),null,`${c.id}: no unread clue`);
 available(s,c);assert(G.visit(s,c.id));
 const firstScene=clone(s.scene.lines);complete(s);
 const memory=G.giftMemory(s,c.id);assert(memory,`${c.id}: clue after first episode`);
 for(const field of ['id','name','clue','quote','reply'])assert.equal(typeof memory[field],'string',`${c.id}/${field}`);
 assert(memory.cost>0);assert(!ids.has(memory.id),'unique gift id');ids.add(memory.id);
 assert(firstScene.some(([speaker,text])=>speaker===c.name&&text.includes(memory.quote)),`${c.id}: clue came from spoken first-scene dialogue`);
 const legacy=G.fresh('이전 저장');legacy.progress[c.id]=1;
 assert.equal(G.giftMemory(G.migrate(legacy),c.id),null,`${c.id}: progress alone cannot reveal a preference`);
 const oldCopy=clone(legacy);available(oldCopy,c);assert(G.visit(oldCopy,c.id));
 assert.equal(G.giftMemory(oldCopy,c.id),null);complete(oldCopy);
 assert.equal(G.giftMemory(oldCopy,c.id),null,'unrelated later chapters never inject missing preferences');
 assert.equal(legacy.log.length,0,'reading memory never fabricates dialogue');
 assert.equal(memory.source.title,c.events[0][0]);assert.equal(memory.source.day,s.log.find(l=>l.text===memory.quote).day);
 const wrong=G.fresh('다른 사람의 말');wrong.progress[c.id]=8;wrong.log.push({speaker:'나',text:memory.quote,day:1,characterId:c.id});assert.equal(G.giftMemory(wrong,c.id),null);
 const early=G.fresh('아직 만남 전');available(early,c);assert.equal(G.gift(early,c.id,memory.id),false);
 available(s,c);const money=s.money,before=s.affinity[c.id];
 assert(G.gift(s,c.id,memory.id));assert.equal(s.money,money-memory.cost);assert.equal(s.affinity[c.id]-before,8);
 assert(s.scene.lines.some(([,text])=>text.includes(memory.name)),`${c.id}: selected item delivered`);
 assert(s.scene.lines.some(([speaker,text])=>speaker===c.name&&text===memory.reply),`${c.id}: personal welcome`);
 const saved=G.migrate(clone(s));assert(saved);complete(saved);assert.equal(saved.affinity[c.id],before+8);
 available(saved,c);assert.equal(G.gift(saved,c.id,memory.id),false,`${c.id}: one-gift limit`);
}
assert.equal(G.giftMemory(G.fresh('오류'),'missing'),null);
console.log('PASS: 11 remembered gifts have spoken first-episode provenance, notebook clues, strict heard-only unlocks, costs, warm replies and one-gift save protection.');

// Actual changes, rather than raw option scores, must survive in the notebook.
for(const c of CAST)for(const [initial,score,expected] of [[30,2,12],[98,2,2],[100,2,0],[30,0,-3],[1,0,-1],[0,0,0]]){
 const s=G.fresh('반응 기록');s.affinity[c.id]=initial;
 const episode=c.events.findIndex((e,i)=>i<7&&(e[4][1]===score||e[5][1]===score));assert(episode>=0,`${c.id}: reachable score ${score}`);s.progress[c.id]=episode;available(s,c);assert(G.visit(s,c.id));choices(s);
 const option=s.scene.options.findIndex(o=>o.score===score);assert(option>=0,`${c.id}: option score ${score}`);
 const picked=clone(s.scene.options[option]),title=s.scene.title,before=s.affinity[c.id];
 assert(G.choose(s,option));assert.equal(s.affinity[c.id]-before,expected);
 const records=G.observations(s,c.id);assert.equal(records.length,1,`${c.id}: immediate note`);
 const note=records[0];assert.equal(note.characterId,c.id);assert.equal(note.title,title);assert.equal(note.choice,picked.text);assert.equal(note.reply,picked.reply);assert.equal(note.delta,expected);assert.equal(note.day,G.day(s));assert.equal(typeof note.note,'string');assert(note.note.trim().length>0);
 const resumed=G.migrate(clone(s));assert(resumed);assert.deepEqual(clone(G.observations(resumed,c.id)),clone(records));
 assert.equal(G.choose(resumed,option),false,'cannot apply the same choice twice');complete(resumed);
 assert.equal(resumed.affinity[c.id],before+expected);assert.equal(G.observations(resumed,c.id).length,1,'completion does not duplicate note');
 assert.deepEqual(clone(G.observations(G.migrate(resumed),c.id)),clone(records));
 assert.equal(G.observations(resumed,CAST.find(other=>other.id!==c.id).id).length,0,'member filtering');
}
console.log('PASS: every member records the selected reply and actual positive, negative and cap/floor-zero affinity changes immediately, exactly once across save/resume.');

const combined=G.fresh('함께 기록');
for(const c of CAST.slice(0,2)){available(combined,c);assert(G.visit(combined,c.id));complete(combined);}
assert.equal(G.observations(combined).length,2);
for(const c of CAST.slice(0,2))assert.equal(G.observations(combined,c.id).length,1);
const untouched=G.fresh('기존 기록');untouched.log.push({speaker:'이웃',text:'옛날에 나눈 대화',day:1});
assert(G.migrate(untouched));assert.equal(G.observations(G.migrate(untouched)).length,0,'no invented opinion for old logs');
console.log('PASS: all/member notebook filters and legacy logs without invented reactions.');

for(const c of CAST){
 const reading=G.fresh('대화 도중');available(reading,c);G.visit(reading,c.id);
 assert.equal(G.giftMemory(reading,c.id),null,'not yet heard preference');
 let guard=0;while(!G.giftMemory(reading,c.id)&&guard++<15)G.next(reading);
 assert(G.giftMemory(reading,c.id),'heard preference unlocks before episode completion');
 assert.equal(reading.progress[c.id],0);assert(G.giftMemory(G.migrate(reading),c.id));
 for(const [initial,delta] of [[98,2],[100,0]]){
  const s=G.fresh('선물 상한');available(s,c);G.visit(s,c.id);complete(s);s.affinity[c.id]=initial;available(s,c);
  const gift=G.giftMemory(s,c.id);assert(G.gift(s,c.id,gift.id));
  const notes=G.observations(s,c.id).filter(n=>n.title==='기억해 둔 작은 선물');assert.equal(notes.length,1);assert.equal(notes[0].delta,delta);assert.equal(notes[0].reply,gift.reply);assert.equal(s.scene.delta,delta);
  const restored=G.migrate(clone(s));assert(restored);complete(restored);assert.equal(G.observations(restored,c.id).filter(n=>n.title==='기억해 둔 작은 선물').length,1);
 }
 const noMoney=G.fresh('예산 없음');available(noMoney,c);G.visit(noMoney,c.id);complete(noMoney);noMoney.money=0;available(noMoney,c);
 assert.equal(G.gift(noMoney,c.id,G.giftMemory(noMoney,c.id).id),false);assert.equal(noMoney.gifts[c.id],false);
}
console.log('PASS: clue unlocks only when heard, mid-episode saves retain it, gift cap changes are exact and insufficient money leaves gift eligibility intact.');

// Preferences are authored in context before the final question, never appended
// to a different episode to unlock an answer for old saves.
for(const c of CAST){
 const memory=ctx.GIFT_MEMORIES[c.id],raw=c.events[0][6],at=raw.indexOf(memory.quote);
 assert(at>0&&at<raw.length-2,c.id+': return to scene question after preference');
 for(const score of [c.events[0][4][1],c.events[0][5][1]]){
  const s=G.fresh('대사 검수');available(s,c);G.visit(s,c.id);
  while(s.scene.step<at){assert.equal(G.giftMemory(s,c.id),null);G.next(s);}
  assert.equal(G.giftMemory(s,c.id).quote,s.scene.lines[s.scene.step][1]);
  choices(s);assert(G.choose(s,s.scene.options.findIndex(o=>o.score===score)));complete(s);
  available(s,c);assert(G.gift(s,c.id,memory.id));assert.equal(s.scene.lines[1][1],memory.reply);
 }
 const progressed=G.fresh('듣지 않은 저장');progressed.progress[c.id]=8;
 assert.equal(G.giftMemory(progressed,c.id),null);
 assert.equal(G.gift(progressed,c.id,memory.id),false);
}
console.log('PASS: all 11 authored gift clues precede the scene question, unlock only on the spoken line, and lead to matching gift responses for both choices.');
