'use strict';
// Run the shipping UI against a small event/Canvas harness; browser QA remains separate.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const physics=require('../dist/merge-physics.js');
const noop=()=>{},draw=new Proxy({}, {get:()=>noop,set:()=>true});
function element(){return {hidden:false,textContent:'',children:[],listeners:{},getContext:()=>draw,setAttribute:noop,append(...x){this.children.push(...x)},focus:noop,setPointerCapture:noop,getBoundingClientRect:()=>({left:16,width:288}),addEventListener(n,f){this.listeners[n]=f}}}
(async()=>{
 const els={},events={},windowEvents={},storage=new Map([['afterglow-v1-auto','existing save'],['neighbors-merge-best-v1','10']]);let frame;
 const context={console,Math,Promise,MergePhysics:physics,document:{hidden:false,querySelector(s){return els[s]??=(element())},createElement:element,createTextNode:x=>x,addEventListener(n,f){events[n]=f}},window:{addEventListener(n,f){windowEvents[n]=f}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:f=>frame=f,Image:class{width=1000;height=2000;set src(v){queueMicrotask(()=>this.onload())}}};
 vm.runInNewContext(fs.readFileSync('dist/merge.js','utf8').replace('const world=new World(),','const world=globalThis.testWorld=new World(()=>0),'),context);
 await new Promise(r=>setImmediate(r));const w=context.testWorld;let t=100;const advance=(n=1)=>{for(let i=0;i<n;i++){t+=1000/120;frame(t)}};
 assert(els['#overlay'].hidden);assert.equal(els['#faces'].children.length,10);assert.equal(els['#best'].textContent,10);
 const board=els['#board'];const pointer=(type,x,id=1)=>board.listeners[type]({button:0,pointerId:id,clientX:x,pointerType:'touch',preventDefault:noop});
 pointer('pointerdown',30);pointer('pointermove',160);pointer('pointerup',160);assert.equal(w.balls.length,1);assert.equal(w.balls[0].x,200,'mobile CSS coordinates map to physics space');pointer('pointerup',160);assert.equal(w.balls.length,1,'release cannot double-drop');
 advance(70);pointer('pointerdown',30);board.listeners.pointercancel();pointer('pointerup',30);assert.equal(w.balls.length,1,'cancelled touch never drops');
 board.listeners.keydown({key:'ArrowLeft',preventDefault:noop});board.listeners.keydown({key:' ',repeat:false,preventDefault:noop});assert.equal(w.balls.length,2);assert.equal(w.balls[1].x,26,'keyboard remains clamped at wall');
 els['#pause'].onclick();let before=w.time;advance(30);assert.equal(w.time,before);assert(!els['#overlay'].hidden);els['#resume'].onclick();advance(10);assert(w.time>before);
 context.document.hidden=true;events.visibilitychange();before=w.time;advance(20);assert.equal(w.time,before,'hidden tab pauses');context.document.hidden=false;els['#resume'].onclick();windowEvents.blur();before=w.time;advance(20);assert.equal(w.time,before,'window switch pauses');els['#resume'].onclick();
 els['#restart'].onclick();assert.equal(els['#overlayTitle'].textContent,'새 게임을 시작할까요?');els['#again'].onclick();assert.equal(w.balls.length,0);assert.equal(w.score,0);assert.equal(storage.get('neighbors-merge-best-v1'),'10');
 w.add(2,190,300);w.add(2,210,300);advance(3);assert.equal(w.score,8);w.add(3,200,300);advance(3);assert.equal(w.score,24);assert.equal(storage.get('neighbors-merge-best-v1'),'24');
 w.balls=[];const b=w.add(0,200,20);b.age=5;b.danger=1.999;advance(3);assert(w.over);assert.equal(els['#overlayTitle'].textContent,'오늘의 만남은 여기까지');els['#again'].onclick();assert(!w.over);assert.equal(w.balls.length,0);
 assert.equal(storage.get('afterglow-v1-auto'),'existing save','romance saves must remain untouched');
 console.log('PASS merge UI harness: touch drag/cancel/dedup, keyboard, pause/resume, hidden tab/blur, restart, score/best, game-over and separate storage');
})().catch(e=>{console.error(e);process.exitCode=1});
