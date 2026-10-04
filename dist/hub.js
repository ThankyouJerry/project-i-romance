'use strict';
(()=>{
const romance=new URLSearchParams(location.search).get('game')==='romance';
if(romance){
 document.body.classList.remove('game-hub');document.querySelector('#game-picker').hidden=true;
 // Keep the return link on the original title screen, away from dialogue/choice controls.
 const addReturn=()=>{const footer=document.querySelector('#app .hero footer');if(!footer||footer.querySelector('.hub-return'))return;const link=document.createElement('a');link.className='hub-return';link.href='./';link.textContent='← 게임 선택';footer.append(link)};
 new MutationObserver(addReturn).observe(document.querySelector('#app'),{childList:true,subtree:true});addReturn();
}else{document.title='우리 동네 오락실 · 게임 선택';document.querySelector('#app').setAttribute('inert','');}
})();
