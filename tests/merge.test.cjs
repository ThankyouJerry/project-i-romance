'use strict';
const assert=require('node:assert/strict');
const {World,RADII}=require('../dist/merge-physics.js');
let w=new World(()=>0);
assert(w.drop(-999));assert.equal(w.balls[0].x,26);assert(!w.drop(200));
for(let i=0;i<61;i++)w.step();assert(w.drop(999));assert.equal(w.balls[1].x,374);
w=new World(()=>0);w.add(0,180,300);w.add(0,212,300);w.step();assert.equal(w.balls.length,1);assert.equal(w.balls[0].level,1);assert.equal(w.score,2);
w=new World(()=>0);for(let i=0;i<3;i++)w.add(0,200,300);w.step();assert.deepEqual(w.balls.map(b=>b.level).sort(),[0,1]);assert.equal(w.score,2,'three simultaneous contacts must not duplicate a body');
w=new World(()=>0);w.add(0,185,300);w.add(0,215,300);w.add(1,200,300);w.step();assert.equal(w.balls.length,1);assert.equal(w.balls[0].level,2);assert.equal(w.score,6,'chain merge scores both stages');
w=new World(()=>0);for(const x of [40,72,300,332])w.add(0,x,300);w.step();assert.equal(w.balls.length,2);assert.equal(w.score,4);
w=new World(()=>0);w.add(9,150,450);w.add(9,250,450);w.step();assert.equal(w.balls.length,2);assert.equal(w.score,0,'last level stays on board');
w=new World(()=>0);const b=w.add(0,200,40);for(let i=0;i<180;i++){b.y=40;b.vy=0;w.step()}assert(!w.over,'spawn grace');for(let i=0;i<241;i++){b.y=40;b.vy=0;w.step()}assert(w.over);assert(!w.drop(200));w.reset();assert.equal(w.balls.length,0);assert.equal(w.score,0);assert(!w.over);assert(w.drop(200));
w=new World(()=>0);let q=w.add(0,200,40);q.age=5;q.danger=1.9;q.y=300;w.step();assert.equal(q.danger,0);
w=new World(()=>0);for(let i=0;i<120;i++){if(i%8===0)w.drop(80+(i%3)*100);for(let j=0;j<60;j++)w.step();for(const b of w.balls){assert(Number.isFinite(b.x+b.y+b.vx+b.vy));assert(b.x>=b.r+7.99&&b.x<=392-b.r+.01);assert(b.y<=592-b.r+.01)}}
assert.equal(RADII.length,10);
console.log('PASS merge: input/cooldown, pair, triple, chains, simultaneous pairs, final stage, danger/grace/reset and sustained physics');
