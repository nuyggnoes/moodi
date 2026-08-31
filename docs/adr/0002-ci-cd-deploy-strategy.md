# 2. 배포는 Vercel Git 연동에 맡기고, Actions는 검증만

- 상태: Accepted
- 날짜: 2026-09-01

## 배경

CI/CD를 두 축으로 나눠 설계했다.

- **CI (검증)**: lint · typecheck · test · build. GitHub Actions가 담당하는 데 이견 없음.
- **CD (배포)**: production 배포를 누가 트리거하느냐가 결정 대상.

초기 설계안(A)은 "Actions가 배포까지 통제"였다:

- Vercel의 Git 자동배포를 production에 한해 끔 (Ignored Build Step)
- Actions `deploy` 잡이 `verify` 통과 후 Vercel CLI(`vercel pull/build/deploy --prod`)로 배포
- GitHub `production` environment의 required reviewer로 **수동 승인 게이트**
- 근거: 배포 시점을 "CI 통과 + 수동 승인"에 명시적으로 묶고, 배포 통제권을 코드/설정으로 남김

실제로 구성하던 중, Actions용 Vercel Access Token이 CLI(`vercel` 59.x)에서 `--token`/`VERCEL_TOKEN` 양쪽 모두 `User not found`로 인증에 실패했다. 토큰 스코프(개인 계정 vs 팀) 문제로 추정되나, 재발급을 반복해도 재현됐고 로컬 브라우저 세션으로는 정상 동작했다.

## 결정

**production/프리뷰 배포를 Vercel Git 연동에 맡긴다.** Actions는 `verify`(lint · typecheck · test · build)만 수행하고, 이 체크를 branch protection의 required status check로 건다.

- PR → Vercel 프리뷰 배포
- `main` merge → Vercel production 배포
- Actions `deploy` 잡, `production` GitHub environment, `VERCEL_*` Secret 3종 제거

## 결과

**긍정적**

- 토큰·환경·CLI 버전에 얽힌 실패 지점을 통째로 제거. 솔로 1개월 MVP에서 디버깅 시간을 아낀다.
- 배포 경로가 Vercel 표준 경로 하나로 단순해져, 신규 기여자나 미래의 나에게 설명 비용이 낮다.
- 프리뷰 배포는 그대로 유지되므로 merge 전 실제 화면 확인은 가능.

**부정적 / 트레이드오프**

- **수동 승인 게이트를 잃는다.** `main` merge = 즉시 go-live. 이를 완화하려면:
  - PR을 "화면에 연결 안 된 단위"로 쪼개 merge (API/로직 먼저, UI 연결 나중)
  - 필요 시 Vercel의 Deployment Protection(Vercel Authentication 등)으로 접근 제한
- 배포 통제권이 저장소 밖(Vercel 프로젝트 설정)에 일부 존재한다. IaC 관점에서 A안보다 약함.

## 재검토 조건

아래 중 하나라도 해당되면 A안(Actions 트리거 + 승인 게이트)으로 되돌리는 것을 검토한다.

- 실사용자 트래픽이 생겨 잘못된 배포의 비용이 커질 때
- 협업자가 생겨 "merge 권한 ≠ 배포 권한" 분리가 필요할 때
- Vercel 토큰/CLI 이슈가 해소돼 구성 비용이 낮아졌을 때 (포트폴리오용 "배포 통제" 서술이 필요한 경우 포함)
