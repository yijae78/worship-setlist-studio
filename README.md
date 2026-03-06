# Worship Setlist Studio

주제, 성경본문, 예배유형을 바탕으로 찬양콘티 초안을 생성하고, 수정·저장·출력까지 할 수 있는 Next.js 웹앱입니다.

## 핵심 전제
- DB 없음
- 브라우저 LocalStorage 저장
- GitHub + Vercel 배포
- Word/PDF 출력
- 악보는 사용자가 가진 이미지/PDF를 첨부
- 공개적으로 확인 가능한 예배 흐름을 참고한 기준팀:
  - 피아워십 (F.I.A Worship)
  - 예람워십
  - 마커스워십
  - 아이자야씩스티원

## 빠른 시작
```bash
npm install
npm run dev
```

## 권장 Node 버전
- Node.js 20.9 이상

## 주요 구조
- `app/` : App Router
- `components/` : 화면 컴포넌트
- `state/` : Zustand store
- `lib/` : 추천/출력/유틸 로직
- `data/` : 메타데이터 JSON
- `docs/` : 설계 문서

## 구현 메모
- 추천 로직은 룰 기반 + 선택적 AI 보정 구조
- 현재 샘플 곡 메타데이터는 **시작용 카탈로그**이며, 실제 운영 시 교회 상황에 맞게 보강해야 합니다.
- 앱은 참고 예배팀의 **공개적으로 확인 가능한 흐름·소개·메타정보**를 참고하지만, 공식 제휴/공식 데이터 제공을 의미하지 않습니다.

## Cursor handoff
1. 이 폴더를 Cursor로 엽니다.
2. `npm install`
3. `npm run dev`
4. UI 확인 후 `data/song-catalog.json`부터 실제 운영용 메타데이터로 확장합니다.
5. OpenAI API를 연결할 경우 `.env.local`에 `OPENAI_API_KEY`를 추가합니다.
