/* Pure, shared schedule rules. All dates and times are Asia/Seoul. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ScheduleCore=api;})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
const ZONE='Asia/Seoul';
const MEMBERS=[
 {id:'honey',name:'허니츄러스',color:'#b96d80',initial:'허'}, {id:'ohwayo',name:'오화요',color:'#8074a6',initial:'오'},
 {id:'dragon',name:'디디디용',color:'#ad782f',initial:'디'}, {id:'yui',name:'담유이',color:'#448fa2',initial:'담'},
 {id:'aya',name:'아야',color:'#bd7470',initial:'아'}, {id:'siyo',name:'하시요',color:'#6d7db2',initial:'하'},
 {id:'mone',name:'모네',color:'#6f8770',initial:'모'}, {id:'rose',name:'로즈',color:'#ae6785',initial:'로'},
 {id:'popo',name:'포포포포',color:'#658faa',initial:'포'}, {id:'siho',name:'류시호',color:'#8876ae',initial:'류'},
 {id:'ori',name:'오리고기',color:'#9e8c40',initial:'오'}
];
const memberById=Object.fromEntries(MEMBERS.map(m=>[m.id,m]));
function dateValid(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||v<'1900-01-01'||v>'2200-12-31')return false;const d=new Date(v+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===v;}
function timeValid(v){return typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);}
function seoulDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-');}
function addDays(date,n){if(!dateValid(date))throw Error('올바른 날짜가 필요해요.');const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function weekStart(date){const n=new Date(date+'T12:00:00Z').getUTCDay();return addDays(date,-((n+6)%7));}
function safeUrl(value){if(!value)return '';try{const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return '';return u.href;}catch{return '';}}
function text(v,max=100){if(typeof v!=='string')throw Error('문자열 형식을 확인해 주세요.');return v.trim().slice(0,max);}
function iso(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():null;}
function normalizeEvent(raw){
 if(!raw||typeof raw!=='object')throw Error('일정 형식이 올바르지 않아요.');
 const id=text(raw.id,80);if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw Error('일정 ID를 확인해 주세요.');
 if(typeof raw.member!=='string'||!Object.hasOwn(memberById,raw.member))throw Error('알 수 없는 멤버예요.');
 if(!dateValid(raw.date)||raw.date<'2000-01-01'||raw.date>'2100-12-31')throw Error('일정 날짜를 확인해 주세요.');
 const title=text(raw.title);if(!title)throw Error('일정 제목을 입력해 주세요.');
 const start=raw.start||'',end=raw.end||'';
 if(start&&!timeValid(start)||end&&!timeValid(end))throw Error('시간은 00:00~23:59로 입력해 주세요.');
 const nextDay=raw.nextDay===true;
 if(!start&&(end||nextDay))throw Error('종료 시각을 쓰려면 시작 시각이 필요해요.');
 if(nextDay&&!end)throw Error('다음 날 종료 시각을 입력해 주세요.');
 if(start&&end&&!nextDay&&end<=start)throw Error('종료가 자정을 넘으면 ‘다음 날 종료’를 선택해 주세요.');
 if(!['scheduled','cancelled','off'].includes(raw.status))throw Error('일정 상태를 확인해 주세요.');
 const sourceUrl=raw.sourceUrl?safeUrl(raw.sourceUrl):'';if(raw.sourceUrl&&!sourceUrl)throw Error('출처는 http 또는 https 주소만 사용할 수 있어요.');
 if(raw.verified===true&&!sourceUrl)throw Error('원문 확인 표시는 출처 링크가 필요해요.');
 return {id,member:raw.member,date:raw.date,title,start,end,nextDay,status:raw.status,sourceUrl,notes:text(raw.notes||'',500),verified:raw.verified===true,updatedAt:iso(raw.updatedAt)||new Date().toISOString()};
}
function normalizeDocument(raw){
 if(raw&&raw.sample===true)throw Error('예시 파일은 실제 시간표로 가져올 수 없어요.');
 if(!raw||raw.version!==1||raw.timezone!==ZONE||!Array.isArray(raw.events))throw Error('Project i 시간표 v1 JSON 파일이 필요해요.');
 if(raw.events.length>1500)throw Error('일정은 최대 1,500개까지 불러올 수 있어요.');
 const events=raw.events.map(normalizeEvent),ids=new Set();for(const e of events){if(ids.has(e.id))throw Error('중복된 일정 ID가 있어요.');ids.add(e.id);}
 return {version:1,timezone:ZONE,publishedAt:iso(raw.publishedAt),events};
}
function eventRange(e){if(!e.start)return null;return {start:Date.parse(`${e.date}T${e.start}:00+09:00`),end:e.end?Date.parse(`${e.nextDay?addDays(e.date,1):e.date}T${e.end}:00+09:00`):null};}
function onDate(e,date){return e.date===date||Boolean(e.status!=='off'&&e.start&&e.end&&e.nextDay&&e.end!=='00:00'&&addDays(e.date,1)===date);}
function forDate(events,date,member='all'){return events.filter(e=>(member==='all'||e.member===member)&&onDate(e,date)).sort((a,b)=>{const x=a.date===date?(a.start||'99:99'):'00:00',y=b.date===date?(b.start||'99:99'):'00:00';return x.localeCompare(y)||a.member.localeCompare(b.member);});}
function timeLabel(e,date=e.date){if(e.status==='off')return '휴방';if(!e.start)return '시간 미정';if(date!==e.date)return `전날 ${e.start} → ${e.end}`;return e.start+(e.end?` – ${e.nextDay?'익일 ':''}${e.end}`:' · 종료 미정');}
function timing(e,now=Date.now()){if(e.status==='cancelled')return '취소';if(e.status==='off')return '휴방';const r=eventRange(e);if(!r)return '시간 미정';if(now<r.start)return '예정';if(r.end&&now<r.end)return '예정 시간대';return r.end?'예정 종료 시각 지남':'시작 시각 지남';}
function demoEvents(date){const monday=weekStart(date);return MEMBERS.map((m,i)=>normalizeEvent({id:`sample-${i}`,member:m.id,date:addDays(monday,i%7),title:['같이 이야기해요','느긋한 게임 한 판','오늘의 플레이리스트','주말 잡담 & 소통','새로운 게임 도전','잠깐 쉬어가는 날','한 주 마무리'][i%7],start:i===5?'':i===8?'23:00':['19:00','20:00','21:00'][i%3],end:i===5?'':i===8?'01:00':['21:00','22:00','23:00'][i%3],nextDay:i===8,status:i===5?'off':i===9?'cancelled':'scheduled',sourceUrl:'',notes:'화면 확인을 위한 가상의 예시 일정입니다.',verified:false,updatedAt:new Date().toISOString()}));}
return {ZONE,MEMBERS,memberById,dateValid,timeValid,seoulDate,addDays,weekStart,safeUrl,normalizeEvent,normalizeDocument,eventRange,onDate,forDate,timeLabel,timing,demoEvents};
});
