---
feature: 챗봇
status: active
last_modified: 2026-05-25
files:
  - server/src/controllers/chat.controller.ts
  - client/src/components/ChatBot.tsx
tags: [챗봇, 채팅, 대화, AI, 리딩, 후속질문]
---

# 챗봇

## 설명

타로 리딩 결과에 대해 AI와 추가 대화할 수 있는 챗봇 기능.
리딩 결과와 대화 히스토리를 컨텍스트로 전달하여 맥락 있는 답변을 생성한다.

## 핵심 로직

- `chatWithReading(req, res)` — 챗봇 메인 컨트롤러
  - 인증 필수 (`req.user` 체크)
  - 요청 본문: `{ question, reading, chatHistory }`
  - 사용자 이름을 DB에서 조회하여 AI에 전달
  - `aiService.chatAboutReading(question, reading, chatHistory, userName)` 호출
- 대화 히스토리(`chatHistory`)를 누적 전달하여 이전 대화 맥락 유지

## 주의사항

- `reading` 객체 전체를 요청에 포함 — 클라이언트에서 리딩 결과를 전달해야 함
- 빈 질문(`question.trim()` 빈 문자열) 검증
- 대화 히스토리가 길어지면 토큰 초과 가능 — AI 호출 시 적절한 truncation 필요
- 에러 시 500 반환, 상세 에러는 서버 콘솔에만 출력

## 변경 이력

| 날짜 | 변경 내용 | 수정 파일 | 이유 |
|------|-----------|-----------|------|
| 2026-05-25 | 초기 문서화 | - | harness-init |
