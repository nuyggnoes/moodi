# Moodi - 프로젝트 기획서

## 개요
기분에 맞는 음악을 기록하고, 팔로우한 친구들과 실시간으로 음악 취향을 공유하는 소셜 음악 다이어리 서비스.
AI가 메모를 분석해 기분 태그를 추천하고, 하루의 기록을 감성 코멘트로 요약해주는 기능을 포함한다.

## 기술 스택
- **Frontend**: Next.js, TypeScript, Tailwind CSS, TanStack Query, Zustand
- **Backend**: Supabase (DB, Auth, Realtime, Storage)
- **External API**: iTunes Search API (Apple) — 음악 검색, 앨범아트, 30초 미리듣기 (인증 불필요)
- **AI**: LLM API (OpenAI/Claude) — Next.js Route Handler를 통한 서버사이드 호출

## 핵심 기능

### 1. 인증
- Supabase Auth 이메일 로그인/회원가입
- 프로필 설정 (닉네임, 프로필 이미지)

### 2. 음악 기록
- iTunes Search API로 음악 검색
- 오늘의 음악 등록
  - 곡명, 아티스트, 앨범아트, 30초 미리듣기
  - 기분 태그 선택 (설레는, 차분한, 신나는, 우울한, 집중되는)
  - 한 줄 메모
- 공개 범위: 전체 공개 고정

### 3. AI 기분 태그 추천
- 사용자가 메모를 입력하면(debounce 후) 메모 텍스트를 LLM에 전달해 5개 기분 태그 중 가장 어울리는 태그를 추천
- 추천 결과는 배지 형태로 표시되고, 사용자는 그대로 채택하거나 직접 다른 태그로 변경 가능
- 저장 시 `mood_source`(`user` | `ai`)를 함께 기록 — 사용자가 AI 제안을 얼마나 채택하는지 데이터로 남길 수 있음
- API: `POST /api/ai/mood-suggest { memo, trackName, artist } → { suggestedMood, reason }`

### 4. AI 오늘의 감성 코멘트
- 기록이 저장되면 그날의 곡 + 무드 태그 + 메모를 조합해 LLM이 한 줄 코멘트를 생성 (예: "잔잔하게 스며드는 하루였네요")
- 생성은 비동기로 처리 — 기록 저장은 즉시 완료되고, 코멘트는 스켈레톤 UI 이후 도착하는 대로 갱신 (낙관적 업데이트 + 스트리밍 UX 어필 포인트)
- 달력 화면에서 날짜 클릭 시 해당 코멘트를 툴팁/카드로 노출
- API: `POST /api/ai/daily-comment { trackName, artist, mood, memo } → { comment }`

### 5. 실시간 피드 (Supabase Realtime)
- 팔로우한 유저가 음악을 기록하면 피드에 실시간으로 표시
- 좋아요 반응 (실시간 카운트 업데이트)

### 6. 달력 히스토리
- 날짜별로 내가 기록한 음악 조회
- 달력에 기분 태그 컬러로 시각화
- AI 코멘트 노출

### 7. 소셜
- 단방향 팔로우 (팔로우/팔로워 목록)
- 유저 검색 (닉네임 기준)
- 유저 프로필 페이지 (기록한 음악 목록 공개)

## 페이지 구성
- `/` 실시간 피드 (팔로우한 유저들의 기록)
- `/record` 오늘의 음악 기록 (AI 기분 추천 포함)
- `/diary` 내 음악 달력 (AI 코멘트 포함)
- `/search` 음악 검색 / 유저 검색
- `/profile/[id]` 유저 프로필

## DB 테이블 구조 (Supabase)
- `users` 유저 정보 (id, nickname, avatar_url)
- `records` 음악 기록
  - id, user_id, track_id, track_name, artist, album_art, preview_url
  - mood, mood_source(`user`|`ai`), memo
  - ai_comment (nullable, 비동기 생성)
  - created_at
- `follows` 팔로우 관계 (follower_id, following_id)
- `likes` 좋아요 (user_id, record_id)

## AI 연동 설계 메모
- API 키 보호를 위해 클라이언트에서 LLM을 직접 호출하지 않고, Next.js Route Handler를 프록시로 사용 (외부 음악 API도 클라이언트에서 직접 호출하지 않고 Route Handler 경유 — iTunes는 키가 없지만 rate-limit 완화·서버 캐시 목적)
- mood 추천은 동기 호출(기록 저장 전 즉시 응답 필요), 코멘트 생성은 기록 저장 후 비동기(fire-and-forget + 클라이언트 재조회)로 분리해 저장 흐름이 AI 응답 속도에 막히지 않도록 설계
- LLM 호출 실패 시 mood 추천은 조용히 스킵(사용자가 수동 선택), 코멘트는 재시도 버튼 노출 — AI 기능이 핵심 플로우(기록 저장)를 막지 않는 것을 원칙으로 함

## 개발 순서

### MVP (1차, 목표 1개월)
1. Supabase 프로젝트 세팅 + DB 테이블/RLS 정책 생성
2. Auth 구현 (로그인/회원가입/프로필 설정)
3. iTunes Search API 연동 (음악 검색)
4. 음악 기록 기능 + AI 기분 태그 추천
5. 달력 기반 내 기록 조회 + AI 코멘트 노출
6. 팔로우 & 유저 검색 (기초)

### 2차 (여유 있을 시)
7. Supabase Realtime 피드
8. 좋아요 실시간 반응
9. UI 다듬기, 접근성/성능 보완
