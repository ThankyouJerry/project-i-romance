'use strict';
// Three atlases: original 0–2, lifestyle 3–5, role outfit expressions 6–8.
window.LOOK_LABELS=['평상시','진지한 표정','외출 차림','편안한 일상 차림','산책용 겉옷','특별한 데이트 차림','역할에 맞는 차림','역할에 맞는 차림 · 걱정','역할에 맞는 차림 · 미소'];
WORLD.locations=['office','home','kitchen','store','cafe','gaming','library','park','stage','editing','hallway','market','gallery','photobooth','seaside','raincafe','laundromat','rainstreet'];
(()=>{
const art={
 honey:{moods:[6,6,7,6,4,6,2,5],places:{0:'rainstreet'},outingPlaces:['library','gallery'],outingMoods:[4,5],endingMoods:[0,5,3]},
 ohwayo:{moods:[6,7,2,6,3,4,7,5],places:{0:'hallway',1:'hallway',4:'hallway',5:'hallway'},outingPlaces:['park','cafe'],outingMoods:[4,2],endingMoods:[3,5,3]},
 dragon:{moods:[6,7,8,6,4,7,3,8],outingPlaces:['park','photobooth'],outingMoods:[4,5],endingMoods:[2,5,4]},
 yui:{moods:[6,8,3,3,7,2,5,6],places:{0:'hallway',3:'home',5:'home'},outingPlaces:['cafe','market'],outingMoods:[5,4],endingMoods:[3,5,0]},
 aya:{moods:[6,3,2,3,4,7,6,5],places:{4:'laundromat'},outingPlaces:['market','park'],outingMoods:[4,5],endingMoods:[3,5,3]},
 siyo:{moods:[6,7,3,8,4,3,7,2],places:{4:'market',5:'home',6:'gaming',7:'home'},outingPlaces:['photobooth','store'],outingMoods:[5,4],endingMoods:[0,5,3]},
 mone:{moods:[6,8,2,4,7,6,3,5],outingPlaces:['library','cafe'],outingMoods:[4,5],endingMoods:[2,5,4]},
 rose:{moods:[6,7,2,8,3,7,5,4],outingPlaces:['library','gallery'],outingMoods:[4,5],endingMoods:[2,5,3]},
 popo:{moods:[6,4,3,6,7,7,4,8],places:{6:'raincafe'},outingPlaces:['cafe','raincafe'],outingMoods:[5,4],endingMoods:[2,5,4]},
 siho:{moods:[6,3,3,4,2,7,5,3],places:{6:'gallery',7:'cafe'},outingPlaces:['gallery','cafe'],outingMoods:[4,5],endingMoods:[4,5,3]},
 ori:{moods:[6,3,2,6,7,3,8,5],outingPlaces:['park','photobooth'],outingMoods:[4,5],endingMoods:[2,5,4]}
};
for(const c of CAST){const a=art[c.id];c.moods=a.moods;c.portraitMood=6;c.outingPlaces=a.outingPlaces;c.outingMoods=a.outingMoods;for(const [i,p] of Object.entries(a.places||{}))c.places[Number(i)]=p;ROMANCE_ENDINGS[c.id].forEach((p,i)=>p[3]=a.endingMoods[i]);}
// The day off finally leads to the coast; the rainy outing remains indoors.
ROMANCE_ENDINGS.popo[1][0]='seaside';
ROMANCE_ENDINGS.popo[1][2]=ROMANCE_ENDINGS.popo[1][2].replace('가게와 반대 방향으로 걸었다.','가게와 반대 방향으로 걸어 바닷길에 도착했다.');
})();
