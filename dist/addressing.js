/* Dialogue-only address variants. Engine resolves tokens when a scene is created. */
(()=>{
  const honey=window.CAST.find(c=>c.id==='honey');
  const copy=x=>JSON.parse(JSON.stringify(x));
  const formal={events:{},outings:{},endings:window.ROMANCE_ENDINGS.honey.map(p=>p[2])};
  for(let i=0;i<honey.events.length;i++){
    const e=honey.events[i];
    formal.events[i]={lines:copy(e[6]||e.slice(1,4)),replies:[e[4][2],e[5][2]]};
  }
  const speech=(mode,index,lines,replies)=>{
    for(const [at,text] of Object.entries(lines))mode.events[index].lines[Number(at)]=text;
    mode.events[index].replies=replies;
  };
  speech(formal,0,{
    1:'새로 이사 온 {{polite}} 맞죠? 잠깐만요. 회사 연락 하나만 확인하고요.',
    5:'우산 있으면 같이 가요. 대신 길 안내는 제가 할게요.'
  },['…눈치가 빠르시네요. 회사에서도 그 정도면 제가 같이 일하자고 했겠어요.','좋아요. 그런데 저는 이 골목이 처음이에요. 지도는 볼 줄 아시죠?']);
  // Episode one's gift clue at lines[3] stays byte-for-byte unchanged.
  speech(formal,1,{
    1:'업무는 끝났는데 이 미니게임만 안 돼요. 버튼은 또 왜 도망가는 거예요?'
  },['한 판만이에요. …방금 건 연습이니까 한 번만 더 해요.','빨리 끝나긴 하겠네요. 그래도 제 손으로 해보고 싶었는데요.']);
  speech(formal,2,{
    1:'내일은 잘해야 해요. 다들 저 믿고 준비했거든요.'
  },['그 말… 생각보다 위험하네요. 정말 기대고 싶어지잖아요.','고마워요. 그럼 조금만 더 정리하고 갈게요.']);
  speech(formal,3,{
    1:'성공했대요. 팀장님도 좋았다고 하셨고요. 그러니까 이제 기뻐하면 되는데요.',
    3:'다 끝나면 아무 생각 없이 쉬고 싶었거든요. 막상 끝나니까 뭘 해야 할지 모르겠어요.',
    5:'오늘은 유능한 조언 말고… 뭐라도 같이 해줄래요?'
  },['그럼 제일 큰 조각은 제 거예요. 오늘 그 정도 욕심은 내도 되죠?','맞는 말이에요. 그런데 오늘만큼은 다음이라는 말을 조금 늦게 듣고 싶었어요.']);
  speech(formal,4,{
    1:'오늘 남은 시간은 {{polite}}이 맡아봐요. 예약도 없고, 목적도 없어요. 이상하게 조금 불안하네요.',
    3:'안 받아도 됐는데요. 제가 없을 때 문제가 생기면 제 잘못 같아서요.',
    5:'약속 중에 미안해요. 다음에는 잘할게요.'
  },['한 시간은 연락 안 보기. 이 정도부터는 해볼 수 있겠어요. 옆에 있어줘요.','마음은 고마워요. 그래도 먼저 제가 답해볼게요. 어려우면 그때 도와줘요.']);
  speech(formal,5,{
    1:'자료는 저쪽에 놓아줘요. 그리고 잠깐만 기다려요.',
    3:'왜 화났는지는 알겠어요. 그런데 회사에서는 늘 이렇게 말하다 보니… {{polite}}한테도 그랬네요.',
    5:'오늘 일을 없었던 걸로 하자고 하면 안 되겠죠?'
  },['알겠어요. 그리고 기다리게 하면 시간을 먼저 말할게요. 다음엔 제 일정만큼 약속한 시간도 챙길게요.','정말 괜찮은 거예요? {{polite}}은 참아주는 건데 저 혼자 괜찮아졌다고 생각할까 봐 걱정돼요.']);
  speech(formal,6,{
    1:'오늘 한 가지 부탁해도 돼요? 마음에 안 들면 안 된다고 해도 되고요.',
    3:'제가 고른 걸 {{polite}}도 좋아해줬으면 좋겠어요. 그런데 정답 맞히듯 고르지는 말아줘요.',
    5:'이상하네요. 취향이 다른데도 같이 있는 건 좋아요.'
  },['저도요. 모르는 게 남아 있어서 다음에 또 만나고 싶어지네요.','맞춰주기보다 알려줘요. {{polite}}이 뭘 좋아하는지도 기억하고 싶으니까요.']);
  speech(formal,7,{
    1:'오늘은 {{polite}}이 올 때까지 메일 안 봤어요. 칭찬받으려고 하는 말은… 조금 맞아요.',
    3:'저랑 만나면 앞으로도 바쁜 날이 많을 거예요. 그래도 핑계로 쓰지는 않을게요.',
    5:'다음에는 가고 싶었던 곳에도 데려가줘요. 퇴근길 말고, 쉬는 날에도요.'
  },['좋아요. 다음에는 {{polite}}이 좋아하는 곳에서 만나봐요.','괜찮아요. 대답부터 정해놓고 만날 필요는 없죠.']);
  formal.outings={
    0:{line:'오늘은 누구도 저한테 결과를 요구하지 않았으면 좋겠어요.',replies:['처음으로 시간을 안 재고 책을 골랐어요. 이런 날도 필요했네요.','오늘은 조금 쉬고 싶었어요. 다음에는 빈 시간을 남겨줘요.']},
    1:{line:'오늘은 제가 아니라 {{polite}}이 좋아하는 곳도 가보고 싶어요.',replies:['서로 하나씩이요. 앞으로 약속 정할 때도 그렇게 해요.','제가 편한 것만 고르지는 말아줘요. 취향도 알고 싶거든요.']}
  };
  const casual=copy(formal);
  speech(casual,4,{
    1:'{{call}}, 오늘 남은 시간은 네가 맡아봐. 예약도 없고, 목적도 없어. 이상하게 조금 불안하네.',
    3:'안 받아도 됐는데. 내가 없을 때 문제가 생기면 내 잘못 같아서.',
    5:'약속 중에 미안해. 다음에는 잘할게.'
  },['한 시간은 연락 안 보기. 이 정도부터는 해볼 수 있겠어. 옆에 있어줘.','마음은 고마워. 그래도 먼저 내가 답해볼게. 어려우면 그때 도와줘.']);
  speech(casual,5,{
    1:'자료는 저쪽에 놓아줘. 그리고 잠깐만 기다려.',
    3:'왜 화났는지는 알겠어. 그런데 회사에서는 늘 이렇게 말해서… 너한테도 그랬네.',
    5:'오늘 일을 없었던 걸로 하자고 하면 안 되겠지?'
  },['알겠어. 그리고 기다리게 하면 시간을 먼저 말할게. 다음엔 네 시간도 내 일정만큼 챙길게.','정말 괜찮은 거야? 네가 참아주는 건데 나 혼자 괜찮아졌다고 생각할까 봐 걱정돼.']);
  speech(casual,6,{
    1:'오늘 한 가지 부탁해도 돼? 마음에 안 들면 안 된다고 해도 되고.',
    3:'내가 고른 책도 마음에 들었으면 좋겠어서. 그런데 정답 맞히듯 고르지는 말아줘.',
    5:'이상하네. 취향이 다른데도 같이 있는 건 좋다.'
  },['나도. 모르는 게 남아 있어서 다음에 또 만나고 싶어지네.','맞춰주기보다 알려줘. 좋아하는 것도 기억하고 싶으니까.']);
  speech(casual,7,{
    1:'{{call}}, 오늘은 네가 올 때까지 메일 안 봤어. 칭찬받으려고 하는 말은… 조금 맞고.',
    3:'나랑 만나면 앞으로도 바쁜 날이 많을 거야. 그래도 핑계로 쓰지는 않을게.',
    5:'다음에는 가고 싶었던 곳에도 데려가줘. 퇴근길 말고, 쉬는 날에도.'
  },['좋아. 다음에는 좋아하는 곳에서 만나보자.','괜찮아. 대답부터 정해놓고 만날 필요는 없지.']);
  casual.outings={
    0:{line:'오늘은 누구도 나한테 결과를 요구하지 않았으면 좋겠어.',replies:['처음으로 시간을 안 재고 책을 골랐어. 이런 날도 필요했네.','오늘은 조금 쉬고 싶었는데. 다음에는 빈 시간을 남겨줘.']},
    1:{line:'오늘은 내가 아니라 네가 좋아하는 곳도 가보고 싶어.',replies:['서로 하나씩. 앞으로 약속 정할 때도 그렇게 하자.','내가 편한 것만 고르지는 말아줘. 네 취향도 알고 싶거든.']}
  };
  const replace=(text,pairs)=>pairs.reduce((s,[from,to])=>s.replace(from,to),text);
  formal.endings[0]=replace(formal.endings[0],[
    ['나 오늘 좀 이상하지? 너한테 할 말을 세 번이나 고쳤어. 회의에서는 이런 적 없는데.','저 오늘 좀 이상하죠? {{polite}}한테 할 말을 세 번이나 고쳤어요. 회의에서는 이런 적 없는데요.'],
    ['네가 잘해서 곁에 두고 싶은 게 아니야. 잘 안 되는 날에도 네가 제일 먼저 생각나. 좋아해요. 너랑 사귀고 싶어요.','잘해서 곁에 두고 싶은 게 아니에요. 잘 안 되는 날에도 {{polite}}이 제일 먼저 생각나요. 좋아해요. 저랑 사귀어요.'],
    ['그럼 지금은 내가 기대도 되겠네.','그럼 지금은 제가 기대도 되겠네요.']
  ]);
  formal.endings[1]=replace(formal.endings[1],[
    ['연애를 시작하자마자 일정을 통보하면 싫어할 것 같아서. 오늘 뭐 하고 싶어?','연애를 시작하자마자 일정을 통보하면 싫어할 것 같아서요. 오늘 뭐 하고 싶어요?'],
    ['좋아. 그런데 하나는 정하고 가자.','좋아요. 그런데 하나는 정하고 가요.'],
    ['밖에서 손잡아도 돼?','밖에서 손잡아도 돼요?'],
    ['회의보다 이게 훨씬 떨리네.','회의보다 이게 훨씬 떨리네요.']
  ]);
  formal.endings[2]=replace(formal.endings[2],[
    ['오늘은 좀 못했어. 잠깐 만나도 될까.','오늘은 좀 못했어요. 잠깐 만나도 될까요?'],
    ['연인한테까지 유능한 척하려니까 너무 피곤해.','연인한테까지 유능한 척하려니까 너무 피곤해요.'],
    ['오늘 제일 잘한 일은 너한테 온 거네.','오늘 제일 잘한 일은 {{polite}}한테 온 거네요.']
  ]);
  casual.endings[0]=replace(casual.endings[0],[
    ['나 오늘 좀 이상하지? 너한테 할 말을 세 번이나 고쳤어.','{{call}}, 나 오늘 좀 이상하지? 너한테 할 말을 세 번이나 고쳤어.'],
    ['좋아해요. 너랑 사귀고 싶어요.','좋아해. 너랑 사귀고 싶어.']
  ]);
  casual.endings[2]=casual.endings[2].replace('잠깐 만나도 될까.','잠깐 만나도 될까?');
  casual.endings[2]=casual.endings[2].replace('오늘 제일 잘한 일은 너한테 온 거네.','{{call}}, 오늘 제일 잘한 일은 너한테 온 거네.');
  formal.giftReply='이거, 제가 말했던 노트네요. 기억하고 있었어요? 고마워요, {{polite}}. 첫 장에는 오늘 고마웠던 일부터 적어야겠어요.';
  casual.giftReply='내가 말했던 노트네. 기억하고 있었구나. 고마워, {{call}}. 첫 장에는 오늘 고마웠던 일부터 적어야겠다.';
  formal.giftOther='저 생각하면서 고른 거예요? 고마워요, {{polite}}. 이렇게 챙겨주는 마음이 좋네요.';
  casual.giftOther='내 생각하면서 골랐구나. 고마워, {{call}}. 이렇게 챙겨주는 마음이 좋아.';
  window.ADDRESSING_HONEY={formal,casual};

  // Localized replacements only; retain every other member's established voice.
  const endingLine=(id,page,from,to)=>{
    window.ROMANCE_ENDINGS[id][page][2]=window.ROMANCE_ENDINGS[id][page][2].replace(from,to);
  };
  endingLine('aya',0,'당신이 자꾸 보고 싶어요.','{{civil}}가 자꾸 보고 싶어요.');
  endingLine('rose',0,'당신의 연인이 되고 싶어서 계속 만나고 싶었어요.','{{name}}의 연인이 되고 싶어서 계속 만나고 싶었어요.');
  endingLine('rose',1,'저도 당신이 좋아요.','{{name}}, 저도 좋아해요.');
  endingLine('mone',1,'선배가 내 이름을 부를 때마다 처음 듣는 것처럼 마음이 뛰었다.','선배가 내 쪽으로 돌아서며 불렀다. “{{call}}, 다음에는 네가 가고 싶은 곳으로 가자.” 익숙한 이름인데도 처음 듣는 것처럼 마음이 뛰었다.');
  endingLine('popo',0,'오늘은 주인님 말고 니 이름 부르고 싶어서 나왔다.','오늘은 주인님 말고 니 이름 부르고 싶어서 나왔다. {{call}}, 니 보니까 또 떨리네.');
  const siho=window.CAST.find(c=>c.id==='siho').events[7];
  siho[6][5]=siho[6][5].replace('당신이 자꾸 생각나요.','{{polite}}이 자꾸 생각나요.');
  const ori=window.CAST.find(c=>c.id==='ori');
  ori.events[1][4][2]='그럼 이번엔 {{civil}}가 골라줘요. 어떤 소리를 좋아하는지 궁금해졌어요.';
  ori.events[3][6][5]='늦어지면 먼저 연락할게요. {{civil}} 시간도 소중하니까요.';
  ori.events[5][6][3]='누가 시켜서 바꾼 건 아니에요. 약속이 잡히면 고를 옷이 하나 더 있으면 좋겠다 싶었어요.';
  ori.events[6][6][5]='일 끝나기를 기다리게 하는 대신, 이제는 제가 먼저 만나러 가고 싶어요.';
  ori.events[7][6][3]='새 옷 때문만은 아닌 것 같아요. {{civil}} 보러 오는 길이라 자꾸 거울을 봤거든요.';
  ori.events[7][6][5]='일이 없어도 {{civil}}를 만나고 싶어요. 오늘은 그런 마음이 있다는 걸 먼저 말해보고 싶었어요.';
  // Summary: Honey formal episodes 1–4, permission-dependent 5–8, both outing
  // and ending registers; exact episode-one gift quote preserved. Five targeted
  // member-name references replace distant pronouns or unspoken name cues.
  // Siho's post-romance pet-name pages remain entirely owned by the engine.
})();
