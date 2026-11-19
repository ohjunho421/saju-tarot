---
version: 1
slug: "client-src-pages-homepage-tsx"
primary_target: "client/src/pages/HomePage.tsx"
related_targets: []
---

# 랜딩 (HomePage)

## Scope and mode
- 대상: `client/src/pages/HomePage.tsx`의 랜딩 본문. 헤더·푸터(`App.tsx`)는 범위 밖(결제 작업과 겹침).
- 방문자 모드: Persuade.

## Audience, action, proof, constraints
- 타로·사주 초보 20~30대, 휴대폰 우선. 할 일: "운세 보러 가기"로 시작(비로그인 시 로그인 창).
- 증거: 실제 고양이 카드 그림 78장, 실제 결과 화면(쉽게 보기) 모양. 후기·수치 없음, 지어내지 않음. 결과 예시는 예시라고 밝힌다.
- 기존 정보 유지: 서비스 소개, 결과 예시(이직 질문, 여사제, 이 카드는/나에게는/오늘 해볼 것), 별자리·사주·타로 설명, 이용 방법 4단계, 로그인 안내.
- 기존 세계 유지: 밤 남색 바탕, 금색 강조, 해요체.

## Direction contract
THESIS: 랜딩이 곧 카드가 펼쳐진 밤의 탁자다. 그라데이션 배경 위 가운데 제목과 같은 크기 카드 세 장이 늘어선 기본형을 거부한다.
OWN-WORLD: 밤 남색(#1a1a2e 계열) 바탕이 화면 전체를 덮고, 크림색 테두리의 실제 고양이 카드가 깊이 세 층으로 흩어져 놓인다. 강조색은 금색 하나(주요 버튼, 신호). 모서리는 카드 비율 그대로의 작은 둥글기와 큰 패널 16px 두 단계.
STORY: 카드 그림에 끌려 머무르고, 한 장이 뽑혀 실제 결과 모양으로 풀리는 것을 보고, 세 가지(별자리·사주·타로)를 함께 읽는다는 것과 네 단계를 이해한 뒤 시작한다.
FIRST VIEWPORT: 화면 전체가 탁자. 카드 8~10장이 세 층(가까울수록 크고 선명)으로 가장자리에 흩어지고, 가운데 맑은 영역에 부제(별자리 · 사주 · 타로), 제목, 20단어 이내 소개, 금색 "운세 보러 가기" 버튼. 첫 화면 안에 버튼이 보인다. 휴대폰은 위·아래 띠에 카드 5~6장.
FORM: 고양이 카드가 깔린 탁자(내 후보 7개 중 5번째, 뽑힌 패의 세 번째). seed:2d6300a64854bdb4. 대표 인터랙션: 처음 열 때 카드가 한 장씩 탁자에 놓이고(스프링), 스크롤하면 층마다 다른 속도로 움직이며, 다음 섹션에서 여사제 한 장이 똑바로 세워지며 결과가 차례로 떠오른다. 줄인 움직임 설정에서는 모두 정지 화면.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Raises kept from declined challengers
- 다층 셀 애니메이션: 글자는 늘 가장 가까운 층, 화면은 깊이 층으로 띠를 이룬다.
- 암실 현상: 결과는 한 번의 연속된 떠오름으로 드러나고, 줄인 움직임에서는 정지 화면.

## Unresolved
- 표시용 글꼴: 시스템 한글 글꼴로 간다. 그림책 느낌의 한글 세리프는 글꼴 파일 추가가 필요해 보류.
