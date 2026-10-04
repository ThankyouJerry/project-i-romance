'use strict';
(() => {
const $=s=>document.querySelector(s), {World,RADII}=MergePhysics;
// Normalized square crops of existing, user-supplied reference images (no generated substitutes).
// Same order as CAST; every portrait is an original user-supplied image.
const faces=[
 ['honey','허니츄러스','jpeg',.50,.20,.20],['ohwayo','오화요','jpeg',.50,.10,.24],
 ['dragon','디디디용','jpeg',.49,.21,.28],['yui','담유이','jpeg',.50,.17,.26],
 ['aya','아야','jpeg',.50,.12,.26],['siyo-alt','하시요','jpeg',.48,.50,.48],
 ['mone','비올레타 모네','jpeg',.50,.14,.26],['rose','블레어 로즈','jpeg',.48,.10,.27],
 ['popo','포포포포','jpeg',.47,.18,.28],['siho','류시호','png',.67,.22,.24],
 ['ori-original','오리고기','png',.50,.43,.86]
].map(([id,name,ext,x,y,size])=>({id,name,src:`assets/${id}.${ext}`,x,y,size}));
const world=new World(), canvas=$('#board'),ctx=canvas.getContext('2d');let aim=200,paused=false,ready=false,last=0,acc=0,best=0,shownScore=-1,finished=false;
try{best=Number(localStorage.getItem('neighbors-merge-best-v1'))||0}catch{}
$('#best').textContent=best;
function faceDraw(c,level,x,y,r,alpha=1){const f=faces[level];c.save();c.globalAlpha=alpha;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle='#fffdf5';c.fill();c.clip();if(f.image){const im=f.image,s=im.width*f.size;c.drawImage(im,Math.max(0,f.x*im.width-s/2),Math.max(0,f.y*im.height-s/2),s,s,x-r,y-r,r*2,r*2)}c.restore();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.strokeStyle=['#ba737d','#919eb1','#ca9e4e','#68a9ba','#a28ac2','#a0ac87','#b586bb','#ba7170','#6da5b4','#c9ab73','#c3b84d'][level];c.lineWidth=3;c.stroke()}
function render(){ctx.clearRect(0,0,400,600);ctx.fillStyle='#f8f4e7';ctx.fillRect(0,0,400,600);ctx.fillStyle='#e9e9d9';for(let y=100;y<590;y+=24)for(let x=20;x<390;x+=24){ctx.beginPath();ctx.arc(x,y,1,0,7);ctx.fill()}
const danger=world.balls.some(b=>b.danger>0);ctx.strokeStyle=danger?'#c15443':'#b6bda8';ctx.lineWidth=1.5;ctx.setLineDash([5,6]);ctx.beginPath();ctx.moveTo(8,84);ctx.lineTo(392,84);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=danger?'#b44737':'#87927c';ctx.font='11px sans-serif';ctx.fillText(danger?'넘치기 전에 합쳐 주세요!':'이 선 아래로 차곡차곡',16,103);
for(const b of world.balls)faceDraw(ctx,b.level,b.x,b.y,b.r);
if(!world.over){const r=RADII[world.current];aim=Math.max(r+8,Math.min(392-r,aim));ctx.strokeStyle='#c2cbb6';ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(aim,r*2+12);ctx.lineTo(aim,582);ctx.stroke();ctx.setLineDash([]);faceDraw(ctx,world.current,aim,r+9,r,world.cooldown>0?.35:.8)}
if(shownScore!==world.score){$('#score').textContent=world.score;shownScore=world.score;if(world.score>best){best=world.score;$('#best').textContent=best;try{localStorage.setItem('neighbors-merge-best-v1',String(best))}catch{}}}
}
function preview(){const c=$('#next').getContext('2d');c.clearRect(0,0,64,64);faceDraw(c,world.next,32,32,28);$('#nextName').textContent=faces[world.next].name;$('#next').setAttribute('aria-label',`다음 얼굴: ${faces[world.next].name}`)}
function overlay(title,text,resume,again){$('#overlay').hidden=false;$('#overlayTitle').textContent=title;$('#overlayText').textContent=text;$('#resume').hidden=!resume;$('#again').hidden=!again}
function pause(){if(!ready||world.over)return;paused=true;overlay('잠깐 쉬어 가요','돌아오면 같은 자리에서 이어집니다.',true,false);$('#pause').textContent='계속하기'}
function resume(){if(!ready||world.over)return;paused=false;last=0;acc=0;$('#overlay').hidden=true;$('#pause').textContent='일시정지';canvas.focus({preventScroll:true})}
function restart(){if(!ready)return;world.reset();aim=200;finished=false;shownScore=-1;resume();preview();render();$('#status').textContent='새 게임을 시작했어요. 위치를 고르고 떨어뜨리세요.'}
function drop(){if(!ready||paused||world.over)return;if(world.drop(aim)){preview();$('#status').textContent=`${faces[world.current].name} 차례예요.`;render()}}
function position(e){const rect=canvas.getBoundingClientRect();aim=(e.clientX-rect.left)*400/rect.width;render()}
// Release to drop allows a touch player to aim by dragging without duplicate mouse events.
let pointer=null;
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||paused||!ready||world.over)return;pointer=e.pointerId;canvas.setPointerCapture(pointer);position(e);canvas.focus({preventScroll:true});e.preventDefault()});
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||pointer===e.pointerId)position(e)});
canvas.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;position(e);pointer=null;drop()});canvas.addEventListener('pointercancel',()=>pointer=null);
$('#left').onclick=()=>{aim-=20;render()};$('#right').onclick=()=>{aim+=20;render()};$('#drop').onclick=drop;$('#restart').onclick=()=>{if(!ready)return;pause();overlay('새 게임을 시작할까요?','이번 점수는 초기화되고 최고 기록은 남아요.',true,true)};$('#again').onclick=restart;$('#resume').onclick=resume;$('#pause').onclick=()=>paused?resume():pause();
canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' ','Enter','p','P'].includes(e.key))e.preventDefault();if(e.key==='p'||e.key==='P'){paused?resume():pause();return}if(paused||!ready||world.over)return;if(e.key==='ArrowLeft')aim-=12;if(e.key==='ArrowRight')aim+=12;if((e.key===' '||e.key==='Enter')&&!e.repeat)drop();render()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pointer=null;pause()}});window.addEventListener('blur',()=>{pointer=null;pause()});
function frame(t){if(!last)last=t;const elapsed=Math.min((t-last)/1000,.05);last=t;if(ready&&!paused&&!world.over){acc+=elapsed;while(acc>=1/120){world.step();acc-=1/120;if(world.over)break}render();if(world.over&&!finished){finished=true;overlay('오늘의 만남은 여기까지',`${world.score}점 · 다시 만나러 가볼까요?`,false,true);$('#status').textContent=`게임 종료. ${world.score}점.`;$('#again').focus({preventScroll:true})}}requestAnimationFrame(frame)}
Promise.all(faces.map(f=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{f.image=im;resolve()};im.onerror=reject;im.src=f.src}))).then(()=>{for(const [i,f]of faces.entries()){const li=document.createElement('li'),icon=document.createElement('canvas');icon.width=64;icon.height=64;icon.setAttribute('aria-hidden','true');li.append(icon,document.createTextNode(f.name));const n=document.createElement('small');n.textContent=`크기 ${i+1}`;li.append(n);$('#faces').append(li);faceDraw(icon.getContext('2d'),i,32,32,28)}ready=true;$('#overlay').hidden=true;preview();render();$('#status').textContent='위치를 고르고 떨어뜨리세요. 방향키와 스페이스도 사용할 수 있어요.'}).catch(()=>overlay('이미지를 불러오지 못했어요','연결을 확인하고 페이지를 새로고침해 주세요.',false,false));
requestAnimationFrame(frame);
})();
