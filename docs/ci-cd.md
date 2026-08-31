# Moodi - CI/CD 워크플로우 초안 (1주차 세팅 → 개발 전 기간 사용)

Vercel Git 연동 자동배포는 끄고, GitHub Actions가 검증(CI)과 배포(CD)를 모두 통제하는 구조.
main으로 push되면 lint/typecheck/build/test를 통과해야만 `production` 환경 승인 게이트를 거쳐 Vercel로 배포된다.

**세팅 시점**: 1주차 프로젝트 스캐폴딩 직후 바로 구성한다. CI/CD는 "완성 후 붙이는 마무리 작업"이 아니라 개발 기간 내내 매 커밋/PR을 검증하고 배포하는 인프라이므로, 앱이 빈 껍데기 상태여도 먼저 파이프라인부터 갖추고 그 위에 기능을 쌓아가는 순서가 맞다. (`e2e` Playwright 잡만 화면이 어느 정도 갖춰지는 2주차 이후에 추가)

## 사전 준비

1. Vercel 프로젝트 설정에서 **production 자동배포만 끄고 PR 프리뷰 배포는 유지**
   - Settings → Git → Ignored Build Step에 아래 스크립트 등록:
     ```bash
     if [ "$VERCEL_ENV" == "production" ]; then exit 0; else exit 1; fi
     ```
   - `exit 0`이면 빌드 skip, `exit 1`이면 정상 빌드 진행 → main push(production) 때만 Vercel 자체 자동배포가 스킵되고, PR/브랜치 push는 그대로 프리뷰 URL이 자동 생성됨. 이 프리뷰 URL로 merge 전에 미리 확인 가능.
2. Vercel 토큰 발급: `vercel login` → `vercel link` (로컬에서 1회 실행해 `.vercel/project.json` 생성 후 `orgId`, `projectId` 확인)
3. GitHub repo → Settings → Secrets and variables → Actions 에 등록
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. GitHub repo → Settings → Environments → `production` 생성
   - **Required reviewers**에 본인(또는 팀원) 지정 → main 배포 전 수동 승인 단계 생김
   - 필요하면 Deployment branches를 `main`으로 제한

## `.github/workflows/ci-cd.yml`

```yaml
name: CI/CD

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: Lint / Typecheck / Build / Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck # package.json: "typecheck": "tsc --noEmit"

      - name: Unit test
        run: npm run test -- --ci

      - name: Build
        run: npm run build

  e2e:
    name: Playwright smoke test
    runs-on: ubuntu-latest
    needs: verify
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Run smoke tests
        run: npx playwright test --project=chromium
        env:
          # 프리뷰 배포 대신 로컬 빌드 산출물로 스모크 테스트 (예: next start & 로 띄운 뒤 접근)
          BASE_URL: http://localhost:3000

  deploy:
    name: Deploy to Vercel (production)
    runs-on: ubuntu-latest
    needs: [verify, e2e]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment: production # 여기서 Settings > Environments 승인 게이트가 적용됨
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Pull Vercel environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Build for production
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 동작 흐름

- **PR 생성 시**: `verify` + `e2e` 잡만 실행 (배포는 안 됨). 이 결과를 branch protection의 required status check로 걸어두면 CI 통과 없이는 merge가 막힘.
- **main에 merge(push) 시**: `verify` → `e2e` → `deploy` 순서로 실행되고, `deploy` 잡 진입 시 `production` 환경의 required reviewer 승인을 기다림. 승인하면 Vercel CLI로 실제 배포.

## MVP 범위에서 생략 가능한 부분

- `e2e` 잡(Playwright)은 시간이 부족하면 4주차 막판에 스킵하고 `verify`만으로 CD를 붙여도 무방 — 이후 여유 생기면 추가하는 걸로 README에 "TODO"로 남겨도 어필 포인트가 됨.
- 최소 구성만 먼저 돌려보고 싶다면 `deploy` 잡의 `needs`에서 `e2e`를 빼고 `verify`만 넣으면 됨.

## 브랜치 전략: GitHub Flow

Git Flow(main/develop 이원화 + release/hotfix 라인)는 버전을 나눠 주기적으로 릴리즈하는 제품에 맞는 전략이라, main merge마다 바로 배포되는 이 프로젝트의 continuous deployment 구조와는 안 맞음. 대신 GitHub Flow를 사용한다.

- `main`만 유지, 항상 배포 가능한 상태를 유지
- 기능/수정 단위로 `main`에서 짧게 브랜치 생성: `feature/record-page`, `feature/ai-mood-suggest`, `fix/mood-tag-bug` 등
- PR 오픈 시 위 `verify`(및 `e2e`) 잡이 자동 실행되고, **branch protection**으로 이 상태 체크 통과 없이는 merge 불가하게 설정
- `main`에 merge되는 즉시 `deploy` 잡이 실행되어 `production` 환경 승인 게이트 → Vercel 배포로 이어짐

**MVP 개발 단계에서 미완성 상태 노출 방지**:
- 커스텀 도메인(`xxx.com`)은 MVP 완성 전까지 Vercel 프로젝트에 연결하지 않는다. 그 전까지는 Vercel 기본 제공 URL(`*.vercel.app`)만 존재하고, 이 주소는 본인만 알기 때문에 사실상 비공개 상태다. 자소서/포트폴리오에 링크를 등록하는 시점이 곧 실질적인 "공개" 시점이 된다.
- MVP 공개 이후에도 계속 기능을 추가할 때는 `production` Environment 승인 게이트를 활용해 merge 시점과 실제 go-live 시점을 분리하고, PR을 "화면에 아직 연결 안 된 상태로도 merge 가능한 단위"로 쪼개서 작업한다 (예: API/로직 먼저 merge → UI 연결은 별도 PR로 나중에).
- 이런 이유로 `develop` 브랜치를 별도로 두지 않는다 — develop을 둬도 "언제 main으로 승격할지"는 똑같이 고민해야 해서, 승인 게이트가 이미 있는 솔로 개발 상황에서는 관리 브랜치만 늘어나는 오버헤드가 된다.

**Branch protection 설정 (GitHub repo → Settings → Branches → main)**:
- Require a pull request before merging
- Require status checks to pass before merging → `verify` (및 도입 시 `e2e`) 체크 지정
- (선택) Require branches to be up to date before merging

## 설계 근거

- **Vercel 자동배포 대신 GitHub Actions로 배포 트리거**: 배포 시점을 "CI 통과 + 수동 승인"이라는 조건에 명시적으로 묶고, production 배포 통제권을 코드/설정으로 관리하기 위함.
- `concurrency`로 동일 브랜치의 중복 워크플로우 실행을 취소해 리소스 낭비와 배포 경합을 방지.
- `environment` 승인 게이트로 실수 배포를 차단.
- **Git Flow 대신 GitHub Flow**: main merge마다 즉시 배포되는 continuous deployment 구조라 release/hotfix 라인을 별도 관리할 필요가 없고, 솔로 개발이라 여러 릴리즈 라인을 병렬 유지할 이유도 없어 단순화함.
