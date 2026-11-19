---
name: 별사탕
description: 별자리 · 사주 · 타로를 함께 읽는 쉬운 말 타로 상담
colors:
  night-table: "#1a1a2e"
  lamp-gold: "#d4af37"
  lamp-gold-bright: "#e2c25a"
  action-violet: "#7c3aed"
  tile-indigo: "#232348"
  tile-midnight: "#1c2340"
  tile-plum: "#2a2433"
  signal-amber: "#fde68a"
  ink-white: "#ffffff"
typography:
  display:
    fontFamily: "Gowun Batang, serif"
    fontSize: "clamp(2.5rem, 6vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Gowun Batang, serif"
    fontSize: "clamp(1.875rem, 4vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Gowun Batang, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  card-art: "6px"
  button: "12px"
  panel: "16px"
  pill: "9999px"
spacing:
  section: "80px"
  section-lg: "112px"
  panel: "24px"
  panel-lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.lamp-gold}"
    textColor: "{colors.night-table}"
    rounded: "{rounded.button}"
    padding: "16px 32px"
  button-primary-hover:
    backgroundColor: "{colors.lamp-gold-bright}"
    textColor: "{colors.night-table}"
  chip-element:
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  chip-element-strong:
    backgroundColor: "{colors.lamp-gold}"
    textColor: "{colors.night-table}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: 별사탕

## Overview

**Creative North Star: "밤의 카드 탁자"**

별사탕은 불을 낮춘 방에서 카드를 펼쳐 놓은 탁자다. 바탕은 화면 전체를 덮는 밤 남색이고, 그 위에 크림색 테두리의 수채·잉크 고양이 카드가 실제 물건처럼 놓인다. 화면의 색과 질감은 카드 그림이 맡고, 인터페이스는 등불 같은 금색 하나로 행동을 가리킨다.

밀도는 낮고 숨이 길다. 섹션마다 한 가지만 말하고, 제목은 카드 속 고전 세리프 글자와 어울리는 한글 세리프로 쓰며, 본문은 휴대폰에서 바로 읽히는 시스템 고딕으로 둔다. 움직임은 카드가 탁자에 놓이는 순간과 한 장이 뽑혀 세워지는 순간에만 쓴다.

**Key Characteristics:**
- 밤 남색 한 가지 바탕, 섹션마다 테마를 뒤집지 않는다
- 실제 카드 그림이 유일한 일러스트
- 금색은 화면마다 주요 행동 하나에만
- 제목은 한글 세리프, 본문은 고딕
- 깊이는 카드의 그림자와 층(가깝게·멀게)으로 만든다

## Colors

밤 남색 바탕 위에 등불 금색 하나, 같은 남색 계열을 살짝 틀어 만든 면 색 세 가지.

### Primary
- **등불 금색** (lamp-gold): 랜딩의 주요 버튼, 결과 예시 단계 번호, 사주 "많음" 칩. 화면에서 가장 먼저 눌러야 할 것에만 쓴다. 눌렀을 때와 올렸을 때는 밝은 등불 금색(lamp-gold-bright).

### Secondary
- **행동 보라** (action-violet): 앱 안쪽 화면(헤더 로그인, 리딩 단계 버튼 `.btn-primary`)의 기존 행동 색. 랜딩 본문에는 쓰지 않는다.

### Tertiary
- **신호 호박색** (signal-amber): 결과 "잠깐 기다려요" 신호 칩 글자. 신호 상태에만 쓴다.

### Neutral
- **밤 탁자** (night-table): 전체 바탕. 글이 놓이는 곳 뒤에는 같은 색을 반투명으로 한 겹 깔아 카드 위에서도 읽히게 한다.
- **남보라 면** (tile-indigo), **한밤 면** (tile-midnight), **자두 면** (tile-plum): 큰 정보 묶음(타로·별자리·사주)의 면. 셋을 서로 다르게 써서 같은 모양 카드가 반복되지 않게 한다.
- **잉크 흰색** (ink-white): 제목 100%, 본문 75%, 보조 설명 60%. 회색을 따로 만들지 않고 흰색의 불투명도로 위계를 만든다.

### Named Rules
**The One Lamp Rule.** 한 화면의 강조색은 하나다. 랜딩은 금색, 앱 안쪽 화면은 기존 보라색. 한 섹션 안에 둘을 섞지 않는다.

## Typography

**Display Font:** Gowun Batang (with serif)
**Body Font:** Inter → 시스템 한글 고딕 (with system-ui, sans-serif)

**Character:** 카드 그림 하단의 고전 세리프 이름과 맞닿는 부드러운 한글 세리프가 제목을 맡고, 본문은 기기 기본 고딕으로 가장 빨리 읽히게 둔다.

### Hierarchy
- **Display** (700, clamp(2.5rem, 6vw, 3.75rem), 1.15): 랜딩 첫 화면 제목 하나. 두 줄을 넘기지 않는다.
- **Headline** (700, clamp(1.875rem, 4vw, 2.25rem), 1.25): 섹션 제목과 결과 한 줄 결론.
- **Title** (700, 1.5rem, 1.3): 큰 면 안의 이름(타로, 별자리, 사주).
- **Body** (400, 1rem, 1.625): 설명. 휴대폰 기준 16px, 패널 안은 15px. 한 줄 28~34rem 안쪽.
- **Label** (600, 0.75rem): 결과 단계 이름(이 카드는, 나에게는, 오늘 해볼 것).

### Named Rules
**The Word-Keep Rule.** 한글 제목과 안내문은 단어 단위로만 줄을 바꾸고(`word-break: keep-all`), 제목은 줄 길이를 맞춘다(`text-wrap: balance`). "볼까 / 요?"처럼 글자 하나가 다음 줄로 떨어지면 안 된다.

## Layout

본문은 최대 72rem 컨테이너 안에서 섹션마다 최대 64rem으로 모인다. 섹션 사이는 80px(넓은 화면 112px), 정보 섹션은 64px(넓은 화면 96px). 첫 화면은 뷰포트 높이에서 헤더를 뺀 만큼(최소 640px, 넓은 화면 620px)이고, 휴대폰에서는 좌우 여백을 없애 카드가 화면 끝에서 잘리게 둔다. 결과 예시는 넓은 화면에서 카드 5 : 패널 7로 나란히, 휴대폰에서는 카드 위·패널 아래로 쌓는다. 세 가지 읽기는 12칸 격자에서 타로 7칸(두 줄), 별자리·사주 5칸씩으로 나누고 휴대폰에서는 한 줄씩.

## Elevation & Depth

그림자는 카드에만 쓴다. 카드는 아래로 떨어지는 짙은 남색 그림자로 탁자 위에 뜨고, 첫 화면의 카드는 세 층으로 깊이를 만든다. 먼 층은 60% 불투명도에 1px 흐림, 중간 층은 85%, 가까운 층은 100%로 가장 크다. 패널과 면은 그림자 없이 색 차이와 1px 금색 테두리로만 구분한다.

### Shadow Vocabulary
- **탁자 위 카드** (`0 22px 40px -14px rgba(6,6,18,0.9)`): 첫 화면에 흩어진 카드.
- **뽑힌 카드** (`0 30px 60px -20px rgba(6,6,18,0.95)`): 결과 예시의 큰 카드.
- **등불 버튼** (`0 10px 30px -10px rgba(212,175,55,0.55)`): 금색 주요 버튼 아래의 따뜻한 빛.

### Named Rules
**The Cards-Only Shadow Rule.** 그림자는 실제 카드 그림과 주요 버튼에만 있다. 글 패널을 그림자로 띄우지 않는다.

## Shapes

카드 그림은 실제 카드 모서리에 맞춘 작은 둥글기(6px), 버튼은 12px, 큰 패널과 면은 16px, 칩과 신호는 완전한 알약 모양. 카드는 늘 실제 비율(320:574)을 유지하고 잘라 쓰지 않는다.

## Components

### Buttons
- **Shape:** 부드러운 사각(12px)
- **Primary:** 등불 금색 바탕에 밤 남색 글자, 16px 32px 여백, 18px 굵은 글자와 오른쪽 화살표.
- **Hover / Focus:** 올리면 밝은 금색으로 바뀌고 화살표가 4px 오른쪽으로. 키보드 초점은 금색 2px 고리와 4px 간격. 누르면 1px 내려간다.
- **기존 앱 버튼:** `.btn-primary`(보라 그라데이션)는 앱 안쪽 화면용으로 남아 있다.

### Chips
- **Style:** 알약 모양, 기본은 흰색 8% 면에 80% 글자.
- **State:** 강조(많음)는 금색 바탕에 남색 글자, 부족(적음)은 흰색 40% 점선 테두리. 색만으로 구분하지 않고 "많음·적음" 글자를 함께 쓴다.

### Cards / Containers
- **Corner Style:** 16px
- **Background:** 결과 패널은 흰색 4%, 정보 면은 남보라·한밤·자두 면
- **Shadow Strategy:** 없음 (Elevation 참고)
- **Border:** 결과 패널만 금색 25% 1px
- **Internal Padding:** 24px, 넓은 화면 32px

### 탁자 카드 (Signature)
실제 카드 그림(웹용 320px 너비)을 회전시켜 탁자 위에 흩어 놓는 장식 요소. 화면을 열면 가운데에서 한 장씩 스프링으로 놓이고, 스크롤하면 층마다 다른 속도로 올라간다. 줄인 움직임 설정에서는 처음부터 제자리에 멈춰 있다. 장식이므로 대체 글이 없다(`alt=""`).

### 결과 단계 목록
금색 25% 세로선 왼쪽에 금색 번호 원(16px)을 두고, 단계 이름(Label)과 내용(Body)을 쌓는다. 랜딩 예시에서는 카드가 세워진 뒤 단계가 흐림에서 선명하게 차례로 떠오른다.

## Do's and Don'ts

### Do:
- **Do** 실제 카드 그림을 일러스트로 쓴다. 웹용은 `client/public/landing/cards/`에 320px(큰 카드 520px) webp로 둔다.
- **Do** 금색은 화면마다 주요 행동 하나에만 쓴다 (The One Lamp Rule).
- **Do** 한글은 단어 단위로 줄을 바꾼다 (The Word-Keep Rule).
- **Do** 카드 위에 글을 올릴 때는 밤 남색을 반투명으로 한 겹 깔아 대비를 지킨다.
- **Do** 움직임에는 줄인 움직임 설정의 정지 상태를 함께 만든다.

### Don't:
- **Don't** 제목 위에 작은 라벨(아이브로우)을 얹지 않는다.
- **Don't** 같은 크기의 아이콘+제목+설명 카드를 나란히 반복해 섹션을 만들지 않는다.
- **Don't** 섹션 하나만 밝은 테마로 뒤집지 않는다. 바탕은 늘 밤 남색이다.
- **Don't** 카드 그림을 CSS 도형이나 그라데이션으로 흉내 내지 않는다.
- **Don't** 이용 후기, 이용자 수, 평점을 지어내지 않는다. 예시는 예시라고 밝힌다.
