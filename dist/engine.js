'use strict';
window.Game=(()=>{
 const TOTAL=WORLD.days*2,MAX=WORLD.maxBond,ROMANCE_THRESHOLD=90, byId=id=>CAST.find(c=>c.id===id),clone=x=>JSON.parse(JSON.stringify(x));
 const all=val=>Object.fromEntries(CAST.map(c=>[c.id,typeof val==='function'?val():val]));
 const FANDOM_BONUS=10;
 const fandoms={honey:['허니비'],ohwayo:['하용'],dragon:['쑥떡','흑떡'],yui:['아담','특대담'],aya:['우유'],mone:['네모','동글이'],siyo:['바바'],rose:['마리'],popo:['포리'],siho:['신자','뽀신자']};
 const playerName=name=>String(name||'이웃').normalize('NFC').trim().slice(0,16)||'이웃';
 function nameBonuses(name){const value=playerName(name);return CAST.filter(c=>fandoms[c.id]?.some(word=>value.includes(word))).map(c=>c.id);}
 function fresh(name){const value=playerName(name),bonus=nameBonuses(value),affinity=all(0);for(const id of bonus)affinity[id]=FANDOM_BONUS;return{version:2,name:value,turn:0,money:WORLD.startingMoney,progress:all(0),affinity,choices:all(()=>[]),dates:all(0),gifts:all(false),lastVisit:all(-1),scene:null,journal:[],log:[],ending:null};}
 const day=s=>Math.min(WORLD.days,Math.floor(s.turn/2)+1),slot=s=>s.turn%2,over=s=>s.turn>=TOTAL;
 function availability(s,c){if(over(s))return'마지막 저녁';if(s.lastVisit[c.id]===day(s))return'오늘은 만났어요';if(!c.hours.includes(slot(s)))return c.hours[0]===0?'오후에 만나요':'저녁에 만나요';return null;}
 function canConfess(s,id){return!!byId(id)&&!s.scene&&s.progress[id]>=byId(id).events.length&&s.affinity[id]>=ROMANCE_THRESHOLD;}
 const bond=(s,id,n)=>{s.affinity[id]=Math.max(0,Math.min(MAX,s.affinity[id]+n));};
 function log(s){const sc=s.scene,l=sc?.lines[sc.step];if(l)s.log.push({speaker:l[0]==='나'?s.name:l[0],text:l[1],day:day(s),characterId:sc.id,sceneTitle:sc.title,sceneTurn:s.turn});}
 function scene(s,c,{title,lines,options=null,type='event',place,mood,index,delta=0}){s.scene={id:c.id,title,lines,options,type,step:0,choice:!!options,place:place||c.home,mood:mood??0,index:index??s.progress[c.id],delta,logStart:s.log.length};log(s);return s;}
 function visit(s,id){const c=byId(id);if(!c||s.scene||availability(s,c))return false;const p=s.progress[id];if(p>=c.events.length)return false;const e=c.events[p];const variant=window.STORY_VARIANTS?.[id]?.[p],previous=variant?s.choices[id][variant.at]:undefined;const raw=variant&&[0,1,2].includes(previous)?(previous===2?variant.yes:variant.no):(e[6]||[e[1],e[2],e[3]]);const lines=raw.map((v,i)=>[i%2?c.name:'',v]);const echo=e[7];if(p===0){const memory=window.GIFT_MEMORIES?.[id];lines.push(memory?[c.name,memory.quote]:['',c.clue]);}const echoes=(Array.isArray(echo)?echo:echo?[echo]:[]).filter(x=>[0,1,2].includes(s.choices[id][x.at])).map(x=>['',s.choices[id][x.at]===2?x.yes:x.no]);lines.splice(1,0,...echoes);
 const options=[{text:e[4][0],score:e[4][1],reply:e[4][2]},{text:e[5][0],score:e[5][1],reply:e[5][2]}];if((p+CAST.indexOf(c))%2)options.reverse();
 scene(s,c,{title:e[0],lines,options,index:p,place:c.places[p],mood:c.moods[p]});return true;}
 function outing(s,id){const c=byId(id),n=s.dates[id];if(!c||s.scene||availability(s,c)||s.progress[id]<(c.outingMinProgress?.[n]||1)||n>=c.outings.length||s.money<2000)return false;const o=c.outings[n];s.money-=2000;
 scene(s,c,{type:'date',index:n,title:o[0],place:c.outingPlaces[n],mood:c.outingMoods[n],lines:[['',o[1]],[c.name,o[2]]],options:o[3].map((text,i)=>({text,score:i===o[4]?2:0,reply:i===o[4]?o[5]:o[6]}))});return true;}
 function giftMemory(s,id){const memory=window.GIFT_MEMORIES?.[id];if(!memory||!byId(id))return null;const heard=s.log.some(l=>l.characterId===id&&l.text===memory.quote);if(!heard&&s.progress[id]<1)return null;return heard?clone(memory):{...clone(memory),quote:'',clue:byId(id).clue,reply:CHARACTER_REACTIONS[id].giftOther};}
 function observations(s,id='all'){return s.log.filter(l=>l.observation&&(id==='all'||l.characterId===id)).map(l=>({characterId:l.characterId,day:l.day,title:l.sceneTitle||'함께한 대화',choice:l.text,...clone(l.observation)}));}
 function gift(s,id,gid){const c=byId(id),memory=giftMemory(s,id),remembered=memory?.id===gid,g=remembered?memory:GIFTS.find(g=>g.id===gid);if(!c||!g||s.scene||availability(s,c)||s.progress[id]<1||s.gifts[id]||s.money<g.cost)return false;s.money-=g.cost;s.gifts[id]=true;const good=c.gift===gid,particle=(g.name.charCodeAt(g.name.length-1)-0xAC00)%28?'을':'를',before=s.affinity[id];bond(s,id,8);const delta=s.affinity[id]-before,reply=remembered?memory.reply:CHARACTER_REACTIONS[id][good?'giftGood':'giftOther'];
 scene(s,c,{type:'gift',title:remembered?'기억해 둔 작은 선물':'생각나서 가져왔어',mood:8,lines:[['',`${g.name}${particle} 건넸다. ${remembered?'그날 들려준 이야기를 기억하며 고른 선물이다.':good?'지난 대화에서 알게 된 취향을 떠올리며 고른 선물이다.':'그 사람에게 어울릴 것 같아서 골라봤다.'}`],[c.name,reply]],delta});s.log[s.log.length-1].observation={reply,note:remembered?'전에 했던 말을 기억해 준 것이 반가웠던 것 같다.':'나를 생각하며 골랐다는 마음이 잘 전해진 것 같다.',delta};return true;}
 function choose(s,i){const sc=s.scene;if(!sc?.choice||sc.step!==sc.lines.length||!Number.isInteger(i))return false;const o=sc.options[i];if(!o)return false;const delta=sc.type==='date'?(o.score===2?10:-2):(o.score===2?(sc.index===7?16:12):o.score===1?6:-3);const before=s.affinity[sc.id];bond(s,sc.id,delta);const actualDelta=s.affinity[sc.id]-before;if(sc.type==='event')s.choices[sc.id][sc.index]=o.score;
 s.log.push({speaker:s.name,text:o.text,day:day(s),characterId:sc.id,sceneTitle:sc.title,sceneTurn:s.turn,observation:{reply:o.reply,note:CHARACTER_REACTIONS[sc.id][delta>0?'positive':'negative']+(delta>0?' 내 말이 반가웠던 것 같다.':' 내 말이 기대와는 달랐던 것 같다. 다음에는 조금 더 귀 기울여야겠다.'),delta:actualDelta}});sc.delta=actualDelta;sc.lines=[[byId(sc.id).name,o.reply],['',CHARACTER_REACTIONS[sc.id][delta>0?'positive':'negative']]];sc.step=0;sc.choice=false;if(sc.mood>=6)sc.mood=delta>0?8:7;else if(sc.mood<2)sc.mood=delta>0?0:1;log(s);return true;}
 function next(s){const sc=s.scene;if(!sc)return false;if(sc.step<sc.lines.length-1){sc.step++;log(s);}else if(sc.choice){sc.step=sc.lines.length;}else{const c=byId(sc.id);if(sc.type==='event')s.progress[sc.id]=Math.max(s.progress[sc.id],sc.index+1);if(sc.type==='date')s.dates[sc.id]=Math.max(s.dates[sc.id],sc.index+1);s.journal.push({id:sc.id,title:sc.title,day:day(s),type:sc.type});s.lastVisit[sc.id]=day(s);s.turn=Math.min(TOTAL,s.turn+1);s.scene=null;}return true;}
 function pass(s,work=false){if(s.scene||over(s))return false;if(work)s.money+=6000;s.journal.push({id:'self',title:work?'동네 서점 정리 아르바이트 · +6,000원':'집에서 쉬며 다음 약속을 기다렸다',day:day(s),type:'rest'});s.turn++;return true;}
 function finish(s,id){if(s.scene||s.ending)return false;const c=byId(id);if(id==='solo'){if(!over(s))return false;s.ending={id,kind:'normal',early:false};return true;}if(!c)return false;
 if(canConfess(s,id)){s.ending={id,kind:'good',early:false};return true;}if(s.progress[id]>=c.events.length||(over(s)&&s.progress[id]>=3)){s.ending={id,kind:'normal',early:false};return true;}return false;}
 function currentConversation(s){
 const sc=s?.scene;if(!sc)return [];
 if(Number.isInteger(sc.logStart))return clone(s.log.slice(sc.logStart));
 const recorded=s.log.filter(l=>l.characterId===sc.id&&l.sceneTurn===s.turn&&l.sceneTitle===sc.title);
 if(recorded.length)return clone(recorded);
 return sc.lines.slice(0,Math.min(sc.step+1,sc.lines.length)).map(([speaker,text])=>({speaker:speaker==='나'?s.name:speaker,text}));
 }
 function conversations(s,id='all'){
 const groups=new Map();for(const l of s.log){
 const visits=s.journal.filter(j=>j.day===l.day&&byId(j.id));if(s.scene&&day(s)===l.day)visits.push({id:s.scene.id,title:s.scene.title});
 const ids=[...new Set(visits.map(j=>j.id))];
 const inferred=CAST.find(c=>c.name===l.speaker)?.id;
 const characterId=l.characterId||(ids.length===1?ids[0]:inferred)||null;
 if(id!=='all'&&characterId!==id)continue;
 const title=l.sceneTitle||(ids.length===1&&visits.length===1?visits[0].title:'이전 대화 기록');
 const key=l.sceneTurn!==undefined?`${characterId}:${l.sceneTurn}`:`old:${l.day}:${characterId}`;
 if(!groups.has(key))groups.set(key,{characterId,day:l.day,title,lines:[]});groups.get(key).lines.push(l);
 }return [...groups.values()];
 }
 function choosePetName(s,name){if(s.ending?.id!=='siho'||s.ending.kind!=='good'||!['여보','오빠'].includes(name))return false;s.ending.petName=name;s.ending.page=1;return true;}
 function endingPages(s){const e=s.ending;if(e?.kind!=='good'||typeof ROMANCE_ENDINGS==='undefined'||!ROMANCE_ENDINGS[e.id])return null;const pages=clone(ROMANCE_ENDINGS[e.id]);if(e.id==='siho'){
 const name=e.petName;
 pages[0][2]+='\n잠시 내 손을 만지작거리던 시호가 조심스럽게 물었다.\n“이제 우리 사귀니까… 둘이 있을 때 부르는 호칭도 정해볼까요? 여보라고 할까요, 아니면 오빠라고 해줄까요?”';
 if(name){
 const answer=name==='여보'?'“여보라고 불러줘요.”\n“여보… 아, 제가 말하고도 부끄럽네요.”\n시호는 웃음을 참다가 내 손을 조금 더 꼭 잡았다. “아직 결혼한 건 아니지만, 우리 둘만의 애칭으로요.”':'“오빠라고 불러줘요.”\n“오빠.”\n시호는 내 반응을 살피더니 수줍게 웃었다. “한 번 부르니까 또 부르고 싶네요. 오빠, 조금만 더 같이 걸어요.”';
 pages[0][2]+='\n'+answer;
 pages[1][2]=name==='여보'?`첫 데이트 날, 조용한 카페에서 시호가 내 옆자리를 가리켰다. “여보, 여기 앉아요.”
그 말을 하고는 입가를 손으로 가렸다. “지난번엔 너무 떨려서 작게 불렀잖아요. 오늘은 제대로 불러보고 싶었어요.”
“한 번 더 불러줘도 좋은데요.” 내가 웃자 그녀가 내 컵 옆에 자기 컵을 놓았다.
“여보. …우리 컵이랑 손, 사진 찍어도 돼요? 제가 나중에 또 보고 싶어서요.”
우리는 맞잡은 손을 한 장 찍었다. 사진 속 손을 보던 그녀가 조심스럽게 물었다. “데이트 잘하고 있는지 자꾸 생각하게 돼요.”
“저도 시호 씨랑 하는 첫 데이트라 떨려요. 잘하려고 애쓰기보다 편하게 같이 있으면 좋겠어요.”
그녀가 고개를 끄덕였다. 잠깐 말이 없어져도 휴대폰 뒤로 숨지 않았다. 내 손을 잡은 채 창밖을 보다가, 눈이 마주치면 웃었다.
카페를 나서며 시호가 먼저 내 소매를 잡았다. “여보, 다음 데이트는 제가 신청할게요. 오늘 헤어지기 전에 약속부터 해요.”
나는 걸음을 늦추고 그녀 쪽으로 손을 내밀었다. “좋아요. 언제 볼까요?”`: `첫 데이트 날, 조용한 카페 창가에서 시호가 손을 들었다. “오빠, 여기예요.”
내가 다가가자 그녀는 옆자리에 두었던 가방을 치웠다. “이렇게 불러서 기다리는 거, 한번 해보고 싶었어요.”
“그럼 앞으로도 시호 씨가 불러주는 자리로 갈게요.”
그녀가 수줍게 웃으며 내 컵 옆에 자기 컵을 놓았다. “오빠, 우리 손도 같이 사진 찍어도 돼요? 어디 올리려는 건 아니고, 제가 나중에 또 보고 싶어서요.”
사진을 찍고도 손은 놓지 않았다. “데이트 잘하고 있는지 자꾸 생각하게 돼요.”
“저도 시호 씨랑 하는 첫 데이트라 떨려요. 잘하려고 애쓰기보다 편하게 같이 있으면 좋겠어요.”
그녀가 고개를 끄덕였다. 잠깐 말이 없어졌지만 이번에는 휴대폰 뒤로 숨지 않았다. 내 어깨에 살짝 기대며 작은 목소리로 말했다. “그럼 조금만 이러고 있어도 돼요?”
카페를 나올 때는 그녀가 먼저 다음 약속을 물었다. “오빠, 다음에는 제가 가고 싶은 곳으로 같이 가요.”
“좋아요. 어디든 시호 씨랑 같이 가고 싶어요.” 내 대답에 그녀가 손을 조금 더 꼭 잡았다.`;
 pages[2][2]=`며칠 뒤, 시호가 먼저 자기 집으로 나를 초대했다. 어젯밤 전화로 “${name}, 이번에는 제가 차를 준비할게요”라던 목소리가 떠올랐다.
문을 열어준 그녀는 편안한 옷차림이었다. 긴장한 듯 찻잔을 한 번 더 가지런히 놓다가 나를 보고 웃었다. “${name}, 와줘서 고마워요.”
“초대해줘서 제가 고맙죠.” 내가 옆에 앉자 그녀가 따뜻한 찻잔을 밀어주었다.
함께 게임을 고르던 시호가 화면을 보다가 조용히 말했다. “전에는 같이 접속하는 것만으로도 좋았는데, 이제는 옆에 있었으면 좋겠어요.”
나는 컨트롤러를 잠깐 내려놓고 그녀의 손을 잡았다. “오늘은 여기 있잖아요. 천천히 같이 해요.”
그녀가 내 어깨에 살짝 기댔다. “네, ${name}. 오늘은 이러고 조금만 있어요.”
처음보다 말수가 크게 늘지는 않았다. 그래도 이제는 만나고 싶은 마음을 숨기지 않았고, 나는 그 작은 목소리를 기다렸다.
돌아갈 시간이 되어 현관에서 신발을 신는데 그녀가 내 손을 다시 잡았다. “${name}, 다음에는 제가 만나러 갈게요. 오늘처럼 아무것도 안 해도 좋으니까요.”
“좋아요. 다음 주말에도 같이 있어요.”
문이 닫히기 전 그녀가 환하게 웃었다. 온라인 표시가 꺼진 뒤에도 우리는 서로의 하루에 남는 사이가 되었다.`;
 }}return pages;}
 function endingInfo(s){const e=s.ending,c=byId(e?.id);if(e?.id==='solo')return['익숙해진 골목','스물여덟 날 동안 낯선 골목은 돌아갈 곳이 되었다.\n아직 끝내지 못한 이야기도, 다시 만나고 싶은 이름도 남아 있다.\n누군가의 연인이 되지 않았어도 내 생활은 조금 넓어졌다.\n내일도 문을 열고 나가보기로 했다.'];if(e?.kind==='good'&&typeof ROMANCE_ENDINGS!=='undefined'&&ROMANCE_ENDINGS[e.id])return[c.good[0],endingPages(s).map(p=>p[1]+'\n'+p[2]).join('\n\n')];return c?.[e?.kind]||['',''];}
 function migrate(input){if(!input||typeof input!=='object')return null;let s=clone(input);if(s.version===1){const n=fresh(s.name);n.turn=Math.min(30,Math.max(0,s.turn||0));n.money=WORLD.startingMoney;n.log=Array.isArray(s.log)?s.log:[];n.journal=Array.isArray(s.journal)?s.journal:[];
 for(const c of CAST){n.progress[c.id]=Math.min(3,Math.max(0,s.progress?.[c.id]||0));n.affinity[c.id]=Math.min(36,Math.max(0,(s.affinity?.[c.id]||0)*6));}
 if(s.scene&&byId(s.scene.id)){const c=byId(s.scene.id),sc=s.scene;if(sc.type==='event'){n.scene={...sc,index:n.progress[c.id],place:c.places[n.progress[c.id]],mood:c.moods[n.progress[c.id]],options:sc.options?.map(o=>({text:o[0],score:o[1],reply:o[2]}))||null,delta:0};} }
 n.migrated=true;s=n;}
 if(!valid(s))return null;
 const repair=(text,id)=>{for(const f of window.WARDROBE_TEXT_FIXES||[])if((!id||f.id===id)&&text===f.from)return f.to;return text;};
 if(s.scene){s.scene.title=repair(s.scene.title,s.scene.id);s.scene.lines=s.scene.lines.map(([speaker,text])=>[speaker,repair(text,s.scene.id)]);}
 for(const l of s.log){l.text=repair(l.text,l.characterId);if(l.sceneTitle!==undefined)l.sceneTitle=repair(l.sceneTitle,l.characterId);}
 for(const j of s.journal)j.title=repair(j.title,j.id);
 return valid(s)?s:null;}
 function valid(s){const txt=v=>typeof v==='string'&&v.length<=6000,num=(v,max,min=0)=>Number.isInteger(v)&&v>=min&&v<=max;
 if(!s||s.version!==2||!txt(s.name)||s.name.length>16||!num(s.turn,TOTAL)||!num(s.money,1000000))return false;
 if(!CAST.every(c=>num(s.progress?.[c.id],c.events.length)&&num(s.affinity?.[c.id],MAX)&&num(s.dates?.[c.id],2)&&typeof s.gifts?.[c.id]==='boolean'&&num(s.lastVisit?.[c.id],WORLD.days,-1)&&Array.isArray(s.choices?.[c.id])&&s.choices[c.id].length<=8&&s.choices[c.id].every(v=>v===null||[0,1,2].includes(v))))return false;
 if(!Array.isArray(s.log)||s.log.length>5000||!s.log.every(l=>l&&txt(l.speaker)&&txt(l.text)&&num(l.day,28,1)))return false;
 if(s.log.some(l=>l.observation!==undefined&&(!l.observation||typeof l.observation!=='object'||!byId(l.characterId)||!txt(l.observation.reply)||!txt(l.observation.note)||!num(l.observation.delta,16,-3))))return false;
 if(s.log.some(l=>(l.characterId!==undefined&&!byId(l.characterId))||(l.sceneTitle!==undefined&&!txt(l.sceneTitle))||(l.sceneTurn!==undefined&&!num(l.sceneTurn,TOTAL))))return false;
 if(!Array.isArray(s.journal)||s.journal.length>100||!s.journal.every(j=>j&&(j.id==='self'||byId(j.id))&&txt(j.title)&&num(j.day,28,1)))return false;
 const sc=s.scene;if(sc){if(sc.logStart!==undefined&&!num(sc.logStart,s.log.length))return false;if(over(s)||!byId(sc.id)||!['event','date','gift'].includes(sc.type)||!txt(sc.title)||!num(sc.index,8)||typeof sc.choice!=='boolean'||!num(sc.mood,8)||!WORLD.locations.includes(sc.place))return false;
 if(!Array.isArray(sc.lines)||sc.lines.length<1||sc.lines.length>12||!sc.lines.every(l=>Array.isArray(l)&&l.length===2&&l.every(txt))||!num(sc.step,sc.lines.length)||(!sc.choice&&sc.step===sc.lines.length))return false;
 if(sc.choice&&(!Array.isArray(sc.options)||sc.options.length<2||sc.options.length>3||!sc.options.every(o=>o&&txt(o.text)&&txt(o.reply)&&[0,1,2].includes(o.score))))return false;
 if(sc.type==='event'&&sc.index>=byId(sc.id).events.length)return false;}
 if(s.ending?.petName!==undefined&&(s.ending.id!=='siho'||s.ending.kind!=='good'||!['여보','오빠'].includes(s.ending.petName)))return false;
 if(s.ending?.page!==undefined&&!num(s.ending.page,2))return false;
 if(s.ending&&(sc||!['good','normal'].includes(s.ending.kind)||(s.ending.id!=='solo'&&!byId(s.ending.id))||(s.ending.kind==='good'&&s.affinity[s.ending.id]<ROMANCE_THRESHOLD)))return false;return true;}
 return{TOTAL,MAX,ROMANCE_THRESHOLD,FANDOM_BONUS,nameBonuses,byId,fresh,day,slot,over,availability,canConfess,visit,outing,gift,giftMemory,observations,next,choose,pass,finish,conversations,currentConversation,choosePetName,endingPages,endingInfo,migrate,valid};
})();
