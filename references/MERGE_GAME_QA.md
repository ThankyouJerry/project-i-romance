# 얼굴 합체 게임 검증 기록

## 구현

- 기본 루트는 게임 선택 화면. `?game=romance`는 기존 미연시, `merge.html`은 별도 얼굴 합체 게임.
- 미연시의 기존 실행 스크립트 순서와 저장 키를 유지. 본편/후일담/앨범/이미지 등 기존 추적 dist 파일은 index.html을 제외하고 바이트 단위로 동일.
- 프로필 10명은 기존 sources.json의 사용자 제공 자료를 재사용. 오리고기는 사용자가 다시 첨부한 SD 원본을 받아 11번째 얼굴로 반영. 기존 미연시 11명은 모두 유지.
- 자체 고정 시간 간격 원형 물리, 같은 단계 합체, 점수/최고점수, 다음 얼굴, 터치/마우스/키보드, 일시정지/재시작/게임오버.
- 미연시로 돌아가기 전에 게임 선택으로 나가는 링크는 기존 타이틀 화면에만 추가하여 대화·선택지와 겹치지 않음.

## 통과한 검증

- Node 문법 검사: merge.js, merge-physics.js, hub.js.
- 기존 자동 테스트 6종: story, visual-state, gift-notes, continuity-history, addressing, collection-after.
- merge.test.cjs: 벽/연속 입력 제한, 쌍/세 개 동시 접촉, 연속 합체, 독립 동시 합체, 마지막 단계 유지, 생성 유예/게임오버/초기화, 지속 물리 계산.
- merge-ui.test.cjs: 실제 배포 UI 코드를 VM 이벤트/Canvas 하네스에서 실행. 288px 모바일 좌표 매핑, 터치 이동/취소/중복 방지, 키보드, 탭 이탈/창 전환/일시정지, 재시작 확인, 점수/최고 기록, 게임오버, 미연시 저장키 불변.
- 기존 추적 dist 파일의 index.html 외 파일 전부 원본과 바이트 일치.
- git diff --check.
- 1280px PC 브라우저에서 초기 게임 선택/얼굴 게임 화면 캡처. 10명 얼굴 크롭 확인. 이후 canvas의 CSS 최대 높이를 제거하여 표시와 물리 좌표 비율을 고정했으며 복귀 링크를 타이틀 footer로 이동함.

## 아직 남은 검증

- 마지막 CSS/복귀 링크 수정 이후 브라우저 재검증.
- 실제 브라우저의 PC 입력/모바일 터치/재시작/게임오버/탭 전환과 미연시 이동·저장·후일담·앨범 회귀.
- GitHub main push, CI/Pages 배포 및 공개 URL 확인.

2026-10-05 UTC: 첫 sandbox headless Chrome 시작이 SIGABRT로 종료. 정식 권한 승인 후 별도 임시 프로필 headless 실행은 두 화면 캡처를 완료하고 정상 exit 0. 기존 Chrome UI를 조작하거나 기존 사용자 프로필에 연결하지 않음. 부모의 Chrome 충돌 진단 요청에 따라 추가 브라우저 실행 중지. 부모 진단은 첫 실패 PID와 sandbox mach lookup 거부가 일치하며 시스템 부하가 매우 높다고 보고. WebKit/Firefox 실행파일은 설치되어 있지 않음. 자원 안정 후 단일 승인 브라우저 검증을 재개해야 함. VM 하네스 통과는 실제 모바일 플레이를 대체한 완료 주장으로 사용하지 않음.

## Original Ori attachment correction

The original game thread `01a0e6a0-d1b4-7f82-9806-5be16adf5d69`, turn `01a0e823-eb71-7712-8f39-8c2d3b904e0f`, contains the user's SD character attachment `codex-clipboard-a7edb192-a06e-4716-be14-aa8b57e2791a.png`. The source was supplied; the prior assumption that it was never supplied was wrong. The old temporary path no longer exists, and matching files were not found in the relevant project/temporary paths. The same path appears in `game/references/art-v6-prompts.json`. Reattachment/recovery is requested; generated art is not a substitute.

The other ten faces now use tighter Canvas source rectangles. Original image bytes remain unchanged. A lightweight native Canvas rendering of the actual shipping `faceDraw` function was inspected, including a corrected lower face center for Yui. Preview: task-3/qa/face-framing.png. No browser was launched for this framing check. Physics and UI harness tests passed after this change.

## Ori original restored

User reattached the original SD portrait and explicitly requested its use. The official Library helper materialized the PNG, and actual pixels were inspected before use. `dist/assets/ori-original.png` is an unchanged 800 x 800 RGB PNG (327278 bytes), SHA-256 `572493d024c5dd5814084fd75381bd4628c2448f8e31a8482548a88bd8dd9bb2`. Canvas crops it at normalized center (0.50, 0.43), square size 0.86 of original width. The face is the eleventh game-size stage, following existing CAST order. A native Canvas preview of the shipping drawing function verified all eleven faces without launching Chrome. The earlier missing-attachment notes above are historical and resolved.
