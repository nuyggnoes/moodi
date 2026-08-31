# 1. 폴더 구조: 완전한 FSD 대신 경량 FSD

- 상태: Accepted
- 날짜: 2026-08-31

## 배경

프론트엔드 코드 조직화 방식을 정해야 한다. 후보로 Feature-Sliced Design(FSD)을 검토했다.

FSD는 `app / processes / pages / widgets / features / entities / shared` 7개 레이어로 경계와 의존 방향을 강제하는 설계로, 대규모 앱의 확장성·경계 관리를 목표로 만들어졌다. 국내에서는 아직 일부(토스 등)만 채택한 상태라 "현업 보편"이라고 보기는 어렵다.

Moodi의 규모:

- 페이지 5개 (`/`, `/record`, `/diary`, `/search`, `/profile/[id]`)
- 솔로 개발, 1개월 MVP
- Next.js App Router 사용 (라우팅·레이아웃·서버 경계는 App Router가 이미 규정)

이 규모에 7개 레이어를 모두 적용하면 폴더 구조만 복잡해지고, 레이어 분리가 주는 실질 이점(대규모 팀에서의 경계 강제)은 체감되지 않는다. App Router가 이미 `app/` 레이어 역할을 하므로 FSD의 `app / pages / processes` 레이어는 상당 부분 중복된다.

## 결정

**App Router 관례 + feature 단위 폴더링**만 채택한다. FSD의 핵심 아이디어(기능별 수직 분할, 공유 계층 분리)만 차용하고 레이어 전체 스택은 도입하지 않는다.

```
app/                Next.js 라우트 + Route Handlers (/api/*)
features/<name>/     record, feed, diary, search, follow — 기능별 UI + 훅 + 로직
entities/<name>/     user, record — 공유 도메인 모델·컴포넌트
shared/ui/           재사용 프리미티브 (mood 배지, 기록 카드 등)
shared/lib/          공용 클라이언트·유틸 (supabase 클라이언트 등)
```

의존 방향: `app → features → entities → shared` (역방향 import 금지). `widgets`, `processes` 레이어는 두지 않으며, 필요해지면 그때 `features` 안에서 컴포지션으로 해결한다.

## 결과

**긍정적**

- 폴더 뎁스가 얕아 5개 페이지 규모에서 탐색 비용이 낮다.
- App Router와 개념이 겹치지 않아 "이 파일은 어느 레이어냐" 판단이 단순하다.
- 기능별 수직 분할은 유지되므로, 나중에 완전한 FSD로 승격해야 할 때 `features`/`entities`/`shared` 경계가 이미 잡혀 있다.

**부정적 / 트레이드오프**

- 레이어 강제가 없으므로 `features` 간 직접 import 같은 규칙 위반을 도구가 막아주지 않는다 → 린트 규칙(`import/no-restricted-paths` 등)으로 최소한의 방어만 건다.
- 팀이 커지거나 페이지 수가 크게 늘면 재구조화가 필요할 수 있다. 그 시점의 신호는 "`features` 하나가 다른 여러 `features`에 의존하기 시작할 때".

## 검토했으나 채택하지 않은 대안

- **완전한 FSD (7 레이어)**: 위 배경 참고. 규모 대비 오버헤드.
- **레이어 없이 `app/` 안에 전부**: 라우트 디렉터리에 비-라우트 코드가 섞여 커지면 관리가 어려워진다. `features`/`shared` 분리만으로도 이걸 방지할 수 있다.
