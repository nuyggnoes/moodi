# Moodi — CI/CD

역할 분담:

- **CI (검증)** → GitHub Actions `.github/workflows/ci.yml`. PR / `main` push마다 lint · typecheck · test · build 실행.
- **CD (배포)** → Vercel Git 연동. PR마다 프리뷰 배포, `main` merge 시 production 배포.

**세팅 시점**: 1주차 스캐폴딩 직후. CI/CD는 "완성 후 붙이는 마무리"가 아니라 개발 기간 내내 매 커밋/PR을 검증하는 인프라이므로, 앱이 빈 껍데기여도 파이프라인부터 갖추고 그 위에 기능을 쌓는다.

## CI — `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  verify:
    name: Lint / Typecheck / Test / Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Lint
        run: npm run lint
      - name: Typecheck
        run: npm run typecheck
      - name: Unit test
        run: npm run test -- --ci
      - name: Build
        run: npm run build
```

- `typecheck`는 `next typegen && tsc --noEmit` — CI에서 `.next/types`(라우트 타입)가 없어도 먼저 생성 후 검사.
- `concurrency`로 동일 ref의 이전 실행을 취소해 리소스 낭비 방지.
- **`e2e` (Playwright smoke)** 잡은 화면이 갖춰지는 2주차 이후에 추가한다 (로그인 → 기록 → 조회 플로우 1~2개).

## CD — Vercel Git 연동

- Vercel 프로젝트 `moodi`가 GitHub `nuyggnoes/moodi`에 연결돼 있다.
- **PR** → 프리뷰 배포 URL 자동 생성. merge 전에 실제 화면 확인 가능.
- **`main` merge** → production 자동 배포 (`https://moodi-nuyggnoes-projects.vercel.app`).
- 런타임 환경변수(Supabase, LLM 키)는 **Vercel 프로젝트 Settings → Environment Variables**에 등록한다. CI의 `npm run build`가 이 값들을 요구하게 되면 GitHub Actions Secrets에도 별도로 넣어야 한다. (iTunes Search API는 키 불필요)

## 동작 흐름

- **PR 생성/갱신**: Actions `verify` + Vercel 프리뷰 배포. `verify`를 branch protection의 required check로 걸어 CI 통과 없이는 merge 불가.
- **`main`에 merge**: Vercel이 production 배포. Actions `verify`도 post-merge 안전망으로 한 번 더 실행.

## 브랜치 전략: GitHub Flow

Git Flow(main/develop 이원화 + release/hotfix 라인)는 버전을 나눠 주기적으로 릴리즈하는 제품용이라, `main` merge마다 바로 배포되는 이 프로젝트의 continuous deployment와 안 맞는다. 대신 GitHub Flow:

- `main`만 유지, 항상 배포 가능한 상태.
- 기능/수정 단위로 `main`에서 짧게 브랜치: `feature/record-page`, `feature/ai-mood-suggest`, `fix/mood-tag-bug` 등.
- PR 오픈 시 `verify`가 자동 실행되고, **branch protection**으로 통과 없이는 merge 불가.
- `develop` 브랜치는 두지 않는다 — 솔로 개발에서 "언제 main으로 승격할지"는 develop이 있어도 똑같이 고민해야 해서 관리 브랜치만 늘어나는 오버헤드.

**MVP 개발 중 미완성 노출 방지**:

- 커스텀 도메인은 MVP 완성 전까지 연결하지 않는다. 그전까지 Vercel 기본 URL(`*.vercel.app`)만 존재하고 본인만 아는 주소라 사실상 비공개. 자소서/포트폴리오에 링크를 등록하는 시점이 실질적 "공개" 시점.
- PR은 "화면에 아직 연결 안 된 상태로도 merge 가능한 단위"로 쪼갠다 (예: API/로직 먼저 merge → UI 연결은 별도 PR).

## Branch protection (Settings → Branches → main)

- Require a pull request before merging
- Require status checks to pass before merging → `verify` 지정 (도입 시 `e2e` 추가)
- Require linear history (squash merge와 짝)
- Require branches to be up to date before merging (선택)

## 설계 근거

- **CD를 Vercel Git 연동에 맡김**: Actions가 Vercel CLI로 배포를 직접 트리거하고 `production` environment 승인 게이트를 두는 구조도 검토했으나, 솔로 1개월 MVP 범위에서 토큰 관리 비용 대비 이점이 낮아 채택하지 않았다. 자세한 트레이드오프는 [`adr/0002-ci-cd-deploy-strategy.md`](adr/0002-ci-cd-deploy-strategy.md).
- **GitHub Flow (Git Flow 아님)**: `main` merge마다 즉시 배포되는 continuous deployment라 release/hotfix 라인을 따로 관리할 필요가 없고, 솔로라 여러 릴리즈 라인을 병렬 유지할 이유도 없어 단순화.
- `concurrency` 취소로 중복 워크플로우 실행 방지.
