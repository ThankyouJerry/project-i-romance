'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({window:{}});
for(const f of ['story','chapters','chapters-more','world','endings','wardrobe','reactions','route-revisions','gift-memories','story-continuity','addressing','after-stories','engine']){
 vm.runInContext(fs.readFileSync(`dist/${f}.js`,'utf8'),ctx,{filename:f+'.js'});Object.assign(ctx,ctx.window);
}
const {Game:G,CAST}=ctx,clone=x=>JSON.parse(JSON.stringify(x));
const honey=G.byId('honey'),tokens=/\{\{(?:name|polite|civil|call)\}\}/;
function available(s,c){let n=0;while(G.availability(s,c)&&n++<5)G.pass(s);assert.equal(G.availability(s,c),null);}
function options(s){let n=0;while(s.scene.step<s.scene.lines.length&&n++<20)G.next(s);assert(s.scene.choice);}
function complete(s){let n=0;while(s.scene&&n++<50){if(s.scene.choice&&s.scene.step===s.scene.lines.length)G.choose(s,s.scene.addressPrompt?1:s.scene.options.findIndex(o=>o.score===2));else G.next(s);}assert.equal(s.scene,null);}
function resources(s){return clone({turn:s.turn,money:s.money,affinity:s.affinity,progress:s.progress,choices:s.choices,dates:s.dates,gifts:s.gifts,lastVisit:s.lastVisit,journal:s.journal});}
for(const [name,expected] of [['민수','민수야'],['민준','민준아'],['허니비','허니비야'],['Jerry','Jerry'],['별🙂','별🙂'],['<>&"\'','<>&"\''],['민준','민준아']]){
 const s=G.fresh(name);assert.equal(G.formatText(s,'{{call}}'),expected);
 assert.equal(G.formatText(s,'{{name}}|{{polite}}|{{civil}}'),`${s.name}|${s.name}님|${s.name} 씨`);
 const before=JSON.stringify(s);G.formatText(s,'{{name}}');assert.equal(JSON.stringify(s),before,'formatting is pure');
 available(s,honey);assert(G.visit(s,'honey'));assert(s.scene.lines.some(([,t])=>t.includes(s.name+'님')),'initial Honey addresses selected name politely');assert(!tokens.test(JSON.stringify(s.scene)));
 assert.equal(s.log[0].text,s.scene.lines[0][1]);
}
console.log('PASS: NFC Korean vocatives, polite/civil forms, Latin/emoji/HTML-character names and resolved initial scenes.');

for(const pick of [0,1]){
 const s=G.fresh('민준');s.progress.honey=4;s.affinity.honey=48;available(s,honey);
 s.log.push({speaker:honey.name,text:'예전에 나눈 대화',day:1,characterId:'honey',sceneTitle:'이전 편',sceneTurn:0});const past=clone(s.log);
 const before=resources(s);assert(G.visit(s,'honey'));assert.equal(s.scene.addressPrompt,true);assert.equal(s.scene.lines.length,2);assert.equal(s.scene.options.length,2);assert.deepEqual(resources(s),before);
 assert.equal(G.choose(s,pick),false,'cannot grant permission before prompt was read');
 G.next(s);const saved=G.migrate(clone(s));assert(saved);assert(saved.scene.addressPrompt);assert.deepEqual(clone(G.currentConversation(saved)),clone(G.currentConversation(s)));
 options(s);const promptHistory=clone(G.currentConversation(s)),chosen=s.scene.options[pick].text;assert(G.choose(s,pick));assert.equal(s.honeyAddress,pick===0?'casual':'formal');assert(!s.scene.addressPrompt);assert.equal(s.scene.index,4);assert.deepEqual(resources(s),before,'permission is not an episode completion, affinity choice or paid action');
 assert.deepEqual(clone(s.log.slice(0,past.length)),past,'old log unchanged');
 const h=G.currentConversation(s);assert.deepEqual(clone(h.slice(0,promptHistory.length)),promptHistory);assert.equal(h[promptHistory.length].text,chosen);assert(!h[promptHistory.length].observation,'permission does not invent an affinity observation');assert.equal(h.at(-1).text,s.scene.lines[0][1]);
 assert(s.scene.lines[0][1].includes(pick===0?'민준아':'민준님'));assert(!tokens.test(JSON.stringify(s.scene)));
 const resumed=G.migrate(clone(s));assert(resumed);assert.equal(resumed.honeyAddress,s.honeyAddress);assert.deepEqual(clone(G.currentConversation(resumed)),clone(h));assert.deepEqual(resources(resumed),before);
 options(resumed);const choiceIndex=resumed.scene.options.findIndex(o=>o.score===2),choice=clone(resumed.scene.options[choiceIndex]);assert(G.choose(resumed,choiceIndex));assert.equal(resumed.affinity.honey,60);assert.equal(resumed.progress.honey,4,'normal reply still awaits episode completion');
 assert.equal(G.observations(resumed,'honey').at(-1).reply,resumed.scene.lines[0][1]);assert.equal(resumed.scene.lines[0][1],choice.reply);assert(!tokens.test(JSON.stringify(resumed.log)));
 complete(resumed);assert.equal(resumed.progress.honey,5);assert.equal(resumed.turn,before.turn+1);assert.equal(resumed.honeyAddress,pick===0?'casual':'formal');
 available(resumed,honey);assert(G.visit(resumed,'honey'));assert(!resumed.scene.addressPrompt,'permission is not repeated in later chapters');
}
console.log('PASS: both consent answers preserve budget/time/bond/progress, survive mid-prompt and post-answer saves, preserve history, and resume the real fifth episode.');

for(const p of [0,3,5,7]){
 const s=G.fresh('구저장');s.progress.honey=p;available(s,honey);const old=G.migrate(clone(s));assert(old);assert.notEqual(old.honeyAddress,'casual');assert(G.visit(old,'honey'));assert(!old.scene.addressPrompt,'only episode five asks');
 const formal=G.fresh('구저장');formal.progress.honey=p;formal.honeyAddress='formal';available(formal,honey);assert(G.visit(formal,'honey'));assert.deepEqual(clone(old.scene.lines),clone(formal.scene.lines),'legacy missing permission stays formal');
}
for(const invalid of ['',true,'yes',{},1]){const s=G.fresh('검증');s.honeyAddress=invalid;assert.equal(G.migrate(s),null);}
for(const address of ['formal','casual']){
 const s=G.fresh('민수');s.honeyAddress=address;available(s,honey);assert(G.visit(s,'honey'));complete(s);
 const memory=G.giftMemory(s,'honey');assert(memory);assert.equal(memory.quote,ctx.GIFT_MEMORIES.honey.quote);assert(s.log.some(l=>l.speaker===honey.name&&l.text===memory.quote),'heard exact gift quotation remains available');
 const before=clone(s.log);s.honeyAddress=address==='formal'?'casual':'formal';assert.deepEqual(clone(s.log),before);assert.equal(G.giftMemory(s,'honey').quote,memory.quote);
}
console.log('PASS: missing legacy consent remains formal, malformed consent rejected, past logs and exact heard gift clues survive style changes.');

for(const address of ['formal','casual']){
 const s={name:'민준',honeyAddress:address,ending:{id:'honey',kind:'good'}};const before=JSON.stringify(s),pages=G.endingPages(s);assert.equal(pages.length,3);assert.equal(JSON.stringify(s),before);assert(!tokens.test(JSON.stringify(pages)));assert(pages.some(p=>p[2].includes(address==='casual'?'민준아':'민준님')));
 const other=G.endingPages({...s,name:'민수'});assert(other.some(p=>p[2].includes(address==='casual'?'민수야':'민수님')));assert(!other.some(p=>p[2].includes('민준')),'ending data is not shared/mutated between player names');
 assert.deepEqual(clone(G.endingPages(s)),clone(pages));
}
assert(!tokens.test(JSON.stringify(G.endingPages({ending:{id:'honey',kind:'good'}}))),'old nameless ending callers resolve safely');
for(const name of ['여보','오빠']){
 const s=G.fresh('민준');s.honeyAddress='casual';s.progress.siho=8;s.affinity.siho=100;assert(G.finish(s,'siho'));assert(G.choosePetName(s,name));assert.equal(s.ending.page,1);
 const pages=G.endingPages(G.migrate(clone(s)));for(const p of pages)assert(p[2].includes(name));assert(!tokens.test(JSON.stringify(pages)));assert.equal(s.honeyAddress,'casual');
}
for(const c of CAST){const pages=G.endingPages({name:'민수',ending:{id:c.id,kind:'good',...(c.id==='siho'?{petName:'여보'}:{})}});assert(!tokens.test(JSON.stringify(pages)),`${c.id}: no unresolved ending tokens`);}
console.log('PASS: endings resolve each player/style without mutation; nameless old callers and both Siho pet names remain compatible.');
