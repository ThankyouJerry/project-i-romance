'use strict';
window.Game=(()=>{
 const TOTAL=WORLD.days*2,MAX=WORLD.maxBond, byId=id=>CAST.find(c=>c.id===id),clone=x=>JSON.parse(JSON.stringify(x));
 const all=val=>Object.fromEntries(CAST.map(c=>[c.id,typeof val==='function'?val():val]));
 function fresh(name){return{version:2,name:String(name||'이웃').trim().slice(0,16)||'이웃',turn:0,money:WORLD.startingMoney,progress:all(0),affinity:all(0),choices:all(()=>[]),dates:all(0),gifts:all(false),lastVisit:all(-1),scene:null,journal:[],log:[],ending:null};}
 const day=s=>Math.min(WORLD.days,Math.floor(s.turn/2)+1),slot=s=>s.turn%2,over=s=>s.turn>=TOTAL;
 function availability(s,c){if(over(s))return'마지막 저녁';if(s.lastVisit[c.id]===day(s))return'오늘은 만났어요';if(!c.hours.includes(slot(s)))return c.hours[0]===0?'오후에 만나요':'저녁에 만나요';return null;}
 function canConfess(s,id){return!!byId(id)&&!s.scene&&s.affinity[id]>=MAX;}
 const bond=(s,id,n)=>{s.affinity[id]=Math.max(0,Math.min(MAX,s.affinity[id]+n));};
 function log(s){const sc=s.scene,l=sc?.lines[sc.step];if(l)s.log.push({speaker:l[0]==='나'?s.name:l[0],text:l[1],day:day(s)});}
 function scene(s,c,{title,lines,options=null,type='event',place,mood,index,delta=0}){s.scene={id:c.id,title,lines,options,type,step:0,choice:!!options,place:place||c.home,mood:mood??0,index:index??s.progress[c.id],delta};log(s);return s;}
 function visit(s,id){const c=byId(id);if(!c||s.scene||availability(s,c))return false;const p=s.progress[id];if(p>=c.events.length)return false;const e=c.events[p];const raw=e[6]||[e[1],e[2],e[3]];const lines=raw.map((v,i)=>[i%2?c.name:'',v]);const echo=e[7];if(p===0)lines.push(['',c.clue]);if(echo&&[0,1,2].includes(s.choices[id][echo.at]))lines.splice(1,0,['',s.choices[id][echo.at]===2?echo.yes:echo.no]);
 const options=[{text:e[4][0],score:e[4][1],reply:e[4][2]},{text:e[5][0],score:e[5][1],reply:e[5][2]}];if((p+CAST.indexOf(c))%2)options.reverse();
 scene(s,c,{title:e[0],lines,options,index:p,place:c.places[p],mood:c.moods[p]});return true;}
 function outing(s,id){const c=byId(id),n=s.dates[id];if(!c||s.scene||availability(s,c)||s.progress[id]<1||n>=c.outings.length||s.money<2000)return false;const o=c.outings[n];s.money-=2000;
 scene(s,c,{type:'date',index:n,title:o[0],place:c.outingPlaces[n],mood:c.outingMoods[n],lines:[['',o[1]],[c.name,o[2]]],options:o[3].map((text,i)=>({text,score:i===o[4]?2:0,reply:i===o[4]?o[5]:o[6]}))});return true;}
 function gift(s,id,gid){const c=byId(id),g=GIFTS.find(g=>g.id===gid);if(!c||!g||s.scene||availability(s,c)||s.progress[id]<1||s.gifts[id]||s.money<g.cost)return false;s.money-=g.cost;s.gifts[id]=true;const good=c.gift===gid,particle=(g.name.charCodeAt(g.name.length-1)-0xAC00)%28?'을':'를';bond(s,id,8);
 scene(s,c,{type:'gift',title:'생각나서 가져왔어',mood:8,lines:[['',`${g.name}${particle} 건넸다. ${good?'지난 대화에서 알게 된 취향을 떠올리며 고른 선물이다.':'그 사람에게 어울릴 것 같아서 골라봤다.'}`],[c.name,CHARACTER_REACTIONS[id][good?'giftGood':'giftOther']]],delta:8});return true;}
 function choose(s,i){const sc=s.scene;if(!sc?.choice||sc.step!==sc.lines.length||!Number.isInteger(i))return false;const o=sc.options[i];if(!o)return false;const delta=sc.type==='date'?(o.score===2?10:-2):(o.score===2?(sc.index===7?16:12):o.score===1?6:-3);bond(s,sc.id,delta);if(sc.type==='event')s.choices[sc.id][sc.index]=o.score;
 s.log.push({speaker:s.name,text:o.text,day:day(s)});sc.delta=delta;sc.lines=[[byId(sc.id).name,o.reply],['',CHARACTER_REACTIONS[sc.id][delta>0?'positive':'negative']]];sc.step=0;sc.choice=false;if(sc.mood>=6)sc.mood=delta>0?8:7;else if(sc.mood<2)sc.mood=delta>0?0:1;log(s);return true;}
 function next(s){const sc=s.scene;if(!sc)return false;if(sc.step<sc.lines.length-1){sc.step++;log(s);}else if(sc.choice){sc.step=sc.lines.length;}else{const c=byId(sc.id);if(sc.type==='event')s.progress[sc.id]=Math.max(s.progress[sc.id],sc.index+1);if(sc.type==='date')s.dates[sc.id]=Math.max(s.dates[sc.id],sc.index+1);s.journal.push({id:sc.id,title:sc.title,day:day(s),type:sc.type});s.lastVisit[sc.id]=day(s);s.turn=Math.min(TOTAL,s.turn+1);s.scene=null;}return true;}
 function pass(s,work=false){if(s.scene||over(s))return false;if(work)s.money+=6000;s.journal.push({id:'self',title:work?'동네 서점 정리 아르바이트 · +6,000원':'집에서 쉬며 다음 약속을 기다렸다',day:day(s),type:'rest'});s.turn++;return true;}
 function finish(s,id){if(s.scene||s.ending)return false;const c=byId(id);if(id==='solo'){if(!over(s))return false;s.ending={id,kind:'normal',early:false};return true;}if(!c)return false;
 if(canConfess(s,id)){s.ending={id,kind:'good',early:s.progress[id]<c.events.length};return true;}if(s.progress[id]>=c.events.length||(over(s)&&s.progress[id]>=3)){s.ending={id,kind:'normal',early:false};return true;}return false;}
 function choosePetName(s,name){if(s.ending?.id!=='siho'||s.ending.kind!=='good'||!['여보','오빠'].includes(name))return false;s.ending.petName=name;return true;}
 function endingPages(s){const e=s.ending;if(e?.kind!=='good'||typeof ROMANCE_ENDINGS==='undefined'||!ROMANCE_ENDINGS[e.id])return null;const pages=clone(ROMANCE_ENDINGS[e.id]);if(e.id==='siho'){
 const name=e.petName;
 pages[0][2]+='\n잠시 내 손을 만지작거리던 시호가 조심스럽게 물었다.\n“이제 우리 사귀니까… 둘이 있을 때 부르는 호칭도 정해볼까요? 여보라고 할까요, 아니면 오빠라고 해줄까요?”';
 if(name){pages[0][2]+=name==='여보'?'\n“여보라고 불러줘요.”\n“여보… 아, 제가 말하고도 부끄럽네요.”\n시호는 웃음을 참다가 내 손을 조금 더 꼭 잡았다. “아직 결혼한 건 아니지만, 우리 둘만의 애칭으로요.”':'\n“오빠라고 불러줘요.”\n“오빠.”\n시호는 내 반응을 살피더니 수줍게 웃었다. “한 번 부르니까 또 부르고 싶네요. 오빠, 조금만 더 같이 걸어요.”';
 pages[1][2]+=`\n헤어지기 전, 시호가 내 소매를 살짝 잡았다. “${name}, 다음 데이트는 제가 먼저 신청해도 돼요?”\n“당연하죠. 기다릴게요.” 그 대답에 그녀가 환하게 웃었다.`;
 pages[2][2]+=`\n전화를 끊으려는데 그녀가 한 번 더 나를 불렀다.\n“${name}, 잘 자요. 내일도 제가 먼저 연락할게요.”\n우리 둘이 고른 호칭이 평범한 밤인사를 조금 특별하게 만들었다.`;
 }}return pages;}
 function endingInfo(s){const e=s.ending,c=byId(e?.id);if(e?.id==='solo')return['익숙해진 골목','스물여덟 날 동안 낯선 골목은 돌아갈 곳이 되었다.\n아직 끝내지 못한 이야기도, 다시 만나고 싶은 이름도 남아 있다.\n누군가의 연인이 되지 않았어도 내 생활은 조금 넓어졌다.\n내일도 문을 열고 나가보기로 했다.'];if(e?.kind==='good'&&typeof ROMANCE_ENDINGS!=='undefined'&&ROMANCE_ENDINGS[e.id])return[c.good[0],endingPages(s).map(p=>p[1]+'\n'+p[2]).join('\n\n')];return c?.[e?.kind]||['',''];}
 function migrate(input){if(!input||typeof input!=='object')return null;let s=clone(input);if(s.version===1){const n=fresh(s.name);n.turn=Math.min(30,Math.max(0,s.turn||0));n.money=WORLD.startingMoney;n.log=Array.isArray(s.log)?s.log:[];n.journal=Array.isArray(s.journal)?s.journal:[];
 for(const c of CAST){n.progress[c.id]=Math.min(3,Math.max(0,s.progress?.[c.id]||0));n.affinity[c.id]=Math.min(36,Math.max(0,(s.affinity?.[c.id]||0)*6));}
 if(s.scene&&byId(s.scene.id)){const c=byId(s.scene.id),sc=s.scene;if(sc.type==='event'){n.scene={...sc,index:n.progress[c.id],place:c.places[n.progress[c.id]],mood:c.moods[n.progress[c.id]],options:sc.options?.map(o=>({text:o[0],score:o[1],reply:o[2]}))||null,delta:0};} }
 n.migrated=true;s=n;}
 return valid(s)?s:null;}
 function valid(s){const txt=v=>typeof v==='string'&&v.length<=6000,num=(v,max,min=0)=>Number.isInteger(v)&&v>=min&&v<=max;
 if(!s||s.version!==2||!txt(s.name)||s.name.length>16||!num(s.turn,TOTAL)||!num(s.money,1000000))return false;
 if(!CAST.every(c=>num(s.progress?.[c.id],c.events.length)&&num(s.affinity?.[c.id],MAX)&&num(s.dates?.[c.id],2)&&typeof s.gifts?.[c.id]==='boolean'&&num(s.lastVisit?.[c.id],WORLD.days,-1)&&Array.isArray(s.choices?.[c.id])&&s.choices[c.id].length<=8&&s.choices[c.id].every(v=>v===null||[0,1,2].includes(v))))return false;
 if(!Array.isArray(s.log)||s.log.length>5000||!s.log.every(l=>l&&txt(l.speaker)&&txt(l.text)&&num(l.day,28,1)))return false;
 if(!Array.isArray(s.journal)||s.journal.length>100||!s.journal.every(j=>j&&(j.id==='self'||byId(j.id))&&txt(j.title)&&num(j.day,28,1)))return false;
 const sc=s.scene;if(sc){if(over(s)||!byId(sc.id)||!['event','date','gift'].includes(sc.type)||!txt(sc.title)||!num(sc.index,8)||typeof sc.choice!=='boolean'||!num(sc.mood,8)||!WORLD.locations.includes(sc.place))return false;
 if(!Array.isArray(sc.lines)||sc.lines.length<1||sc.lines.length>12||!sc.lines.every(l=>Array.isArray(l)&&l.length===2&&l.every(txt))||!num(sc.step,sc.lines.length)||(!sc.choice&&sc.step===sc.lines.length))return false;
 if(sc.choice&&(!Array.isArray(sc.options)||sc.options.length<2||sc.options.length>3||!sc.options.every(o=>o&&txt(o.text)&&txt(o.reply)&&[0,1,2].includes(o.score))))return false;
 if(sc.type==='event'&&sc.index>=byId(sc.id).events.length)return false;}
 if(s.ending?.petName!==undefined&&(s.ending.id!=='siho'||s.ending.kind!=='good'||!['여보','오빠'].includes(s.ending.petName)))return false;
 if(s.ending?.page!==undefined&&!num(s.ending.page,2))return false;
 if(s.ending&&(sc||!['good','normal'].includes(s.ending.kind)||(s.ending.id!=='solo'&&!byId(s.ending.id))||(s.ending.kind==='good'&&s.affinity[s.ending.id]<MAX)))return false;return true;}
 return{TOTAL,MAX,byId,fresh,day,slot,over,availability,canConfess,visit,outing,gift,next,choose,pass,finish,choosePetName,endingPages,endingInfo,migrate,valid};
})();
