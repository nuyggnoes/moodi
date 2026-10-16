# Moodi

기분에 맞는 음악을 기록하면 AI가 무드 태그와 감성 코멘트를 붙여주는 소셜 음악 다이어리.

<!-- TODO: 스크린샷 추가 (메인 화면, 기록, 다이어리) -->

## 현재 상태

핵심 루프(가입 → 기록 → AI 무드 제안 → 다이어리 → 주간 메인 화면)가 구현되어 배포되어 있습니다. 팔로우·유저 검색·프로필 페이지와 실시간 피드는 아직 만들지 않았습니다. 구현 현황은 [`docs/spec.md`](docs/spec.md)에 있습니다.

## 주요 기능

- **음악 기록**: iTunes Search API로 곡을 찾아 기분 태그와 한 줄 메모를 남깁니다. 하루에 하나(KST 기준)이고, 같은 날 다시 저장하면 오늘 기록을 수정합니다.
- **AI 기분 추천**: 메모를 쓰면 LLM이 어울리는 기분 태그를 제안합니다. 직접 고르거나 그대로 채택할 수 있고, 채택 여부(`mood_source`)를 기록합니다.
- **AI 감성 코멘트**: 저장 후 서버가 비동기로 한 줄 코멘트를 만듭니다. 저장은 AI 응답을 기다리지 않고, 실패하면 재시도 버튼이 나옵니다.
- **메인 화면**: 최근 7일을 앨범 아트 포스터 캐러셀로 보여주고, 가운데 포스터의 무드 색이 배경으로 번집니다. 선택한 날의 상세는 우측 패널에 나옵니다.
- **다이어리**: 기분 색으로 칠해진 월간 달력과 날짜별 기록·코멘트.
- **로그인 전용**: 로그인 없이는 `/login`, `/signup`만 열립니다 (기본 차단).

## 기술 스택

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · TanStack Query · Supabase (PostgreSQL, Auth, Storage, RLS) · iTunes Search API · Gemini Flash-Lite · Jest + Testing Library · GitHub Actions · Vercel

## 설계 포인트

- **AI가 핵심 플로우를 막지 않는다**: 무드 제안은 동기(실패하면 조용히 건너뜀), 코멘트는 저장 후 `after()`로 비동기 생성합니다. → [ADR-0006](docs/adr/0006-ai-comment-policy.md)
- **API 키는 서버에만**: 클라이언트는 항상 내부 Route Handler(`/api/...`)를 부르고, LLM과 음악 API를 직접 호출하지 않습니다.
- **하루 1기록을 DB 제약으로 강제**: KST 날짜 생성 컬럼 + `unique (user_id, record_date)`와 `upsert`. → [ADR-0007](docs/adr/0007-one-record-per-day.md)
- **교체 가능한 외부 서비스**: 음악(`MusicProvider`)과 LLM(`MoodSuggester`/`CommentGenerator`)은 인터페이스 뒤에 두었습니다. → [ADR-0003](docs/adr/0003-music-provider-itunes.md), [ADR-0005](docs/adr/0005-llm-provider-gemini.md)
- **경량 FSD 구조**: `app/ → features/ → entities/ → shared/`. → [ADR-0001](docs/adr/0001-folder-structure.md)
- **작은 PR로 나눠 배포**: `main` 머지가 곧 프로덕션 배포라서, 화면에 연결하지 않는 단위로 먼저 머지합니다.

## 시작하기

필요: Node.js 22, npm, Supabase 프로젝트, Gemini API 키

```bash
npm ci
# 아래 환경변수로 .env.local 을 만든다
npm run dev   # http://localhost:3000
```

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
LLM_API_KEY=        # Gemini API 키 (서버 전용)
```

DB는 `supabase/migrations/`의 SQL을 Supabase 프로젝트에 순서대로 적용합니다 (절차: [`docs/ci-cd.md`](docs/ci-cd.md#db-마이그레이션-cicd에-포함되지-않음)). iTunes Search API는 키가 필요 없습니다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen && tsc --noEmit` |
| `npm run test` | 단위 테스트 (Jest) — CI는 `npm run test -- --ci` |

## 폴더 구조

```
app/        라우트와 Route Handler (/api/*)
features/   기능별 UI·훅·로직 (auth, comment, diary, home, nav, profile-setup, record, search)
entities/   도메인 모델·헬퍼 (user, record)
shared/     UI 프리미티브와 lib (supabase, music/ai provider, date/kst)
supabase/   DB 마이그레이션
docs/       기획서, ADR, CI/CD, 디자인 목업
```

## 문서

[기획서](docs/spec.md) · [CI/CD](docs/ci-cd.md) · [UI 설계](docs/ui-plan.md) · [ADR](docs/adr/) · [메인 화면 목업](docs/design/home-mockup.html)

## 배포

GitHub Actions(`verify`: lint → typecheck → test → build)가 모든 PR을 검증하고, Vercel이 PR마다 프리뷰를, `main` 머지 시 프로덕션을 배포합니다. 배포 주소: _(공개 시 추가)_
