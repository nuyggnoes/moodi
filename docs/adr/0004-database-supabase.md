# 4. 데이터베이스: Firebase 대신 Supabase(Postgres)

- 상태: Accepted
- 날짜: 2026-08-31 (2026-09-07 스택 재검토 시 유지 확인)

## 배경

`docs/spec.md`의 DB 테이블 구조(`users`, `records`, `follows`, `likes`)를 기준으로 데이터베이스를 정해야 한다. 후보로 Firebase(Firestore)와 Supabase(Postgres)를 비교했다.

스펙이 요구하는 쿼리 패턴은 대부분 관계형이다:

- **팔로우 그래프**: `follows(follower_id, following_id)` — "내가 팔로우하는 유저들의 기록"을 가져오려면 `follows` → `records`로 조인해야 한다.
- **피드 조인**: 피드 한 화면에 기록(`records`) + 작성자(`users`) + 좋아요 수(`likes` 집계)가 함께 필요하다 — 다중 테이블 조인 + 집계.
- **캘린더 range query**: `/diary`는 특정 유저의 기록을 날짜 범위로 조회한다 — `WHERE user_id = ? AND created_at BETWEEN ? AND ?` 형태의 인덱스 친화적 range query.
- **접근 제어**: "기록은 전체 공개 읽기, 쓰기는 소유자만" — row 단위 정책이 스키마 전체에 균일하게 적용된다.

Firebase(Firestore)는 문서 지향(NoSQL)이라 위 조인들을 애플리케이션 코드에서 여러 번의 개별 조회 + 클라이언트 조합으로 풀어야 한다(비정규화 또는 N+1 조회). 보안 규칙(Security Rules)도 가능하지만 관계형 정책만큼 "테이블 단위로 한 줄" 선언이 되지 않는다.

Supabase는 Postgres 위에 Auth, Realtime(logical replication 기반), Storage, RLS(Row Level Security)를 얹은 BaaS다. 팔로우/피드/캘린더 쿼리가 SQL 조인·인덱스로 자연스럽게 풀리고, RLS 정책이 테이블당 한 번 선언으로 "공개 읽기 + 소유자만 쓰기" 요구사항에 1:1로 매핑된다.

## 결정

**데이터베이스를 Supabase(Postgres)로 한다.**

- 스키마는 관계형으로 설계한다 (`users` / `records` / `follows` / `likes`, FK로 연결).
- 접근 제어는 애플리케이션 코드가 아니라 **RLS 정책으로 DB 레이어에 강제**한다 — records는 공개 SELECT, INSERT/UPDATE/DELETE는 `auth.uid() = user_id`인 행만 허용하는 식.
- Realtime(피드 실시간 갱신)과 Auth(이메일 로그인)도 같은 프로젝트 안에서 조달해 외부 서비스를 늘리지 않는다.

## 결과

**긍정적**

- 팔로우 그래프 + 피드 조인 + 캘린더 range query가 SQL 한 번으로 풀린다 — 클라이언트에서 여러 컬렉션을 조합할 필요가 없다.
- RLS가 "공개 읽기, 소유자만 쓰기"를 테이블당 정책 몇 줄로 강제한다 — 클라이언트/서버 코드마다 권한 체크를 반복하지 않아도 된다.
- Auth, Realtime, Storage, DB가 한 프로젝트로 묶여 있어 솔로 1개월 MVP에서 연동해야 할 외부 서비스 수가 늘지 않는다.
- SQL/RLS 경험은 관계형 DB가 표준인 채용 환경에서 Firestore 경험보다 신호가 크다.

**부정적 / 트레이드오프**

- NoSQL 대비 스키마 마이그레이션 비용이 있다 — 컬럼 추가/변경 시 migration을 작성해야 한다. RLS 정책도 스키마와 함께 유지보수 대상이다.
- Firestore의 클라이언트 SDK 오프라인 캐싱·실시간 리스너 DX와 비교하면 Supabase Realtime(WebSocket 구독)은 직접 구성할 부분이 조금 더 많다.
- RLS 정책을 잘못 작성하면 "의도치 않게 공개되는 데이터"가 생길 수 있다 — 정책은 반드시 케이스별 테스트로 검증한다.

## 검토했으나 채택하지 않은 대안

- **Firebase(Firestore)**: 위 배경 참고. 관계형 쿼리 패턴(조인·집계·range query)이 스펙의 핵심인데 문서 지향 DB는 이를 비정규화나 다중 조회로 우회해야 해서 기각.
