# 3. 음악 provider: Spotify 대신 iTunes Search API

- 상태: Accepted
- 날짜: 2026-09-07

## 배경

음악 기록 기능은 곡 검색 + 아티스트 정보 + 앨범아트 + 30초 미리듣기가 필요하다 (`docs/spec.md` "음악 기록"). provider 후보로 Spotify Web API와 iTunes Search API를 비교했다.

Spotify Web API:

- API 자체는 무료다. 개발자 대시보드에서 앱을 등록하고 Client Credentials 플로우(서버사이드, 사용자 OAuth 불필요)로 검색이 가능하다.
- 그러나 2024년 11월 변경으로 **`preview_url`(30초 미리듣기)이 대부분의 앱 응답에서 제거**됐다. spec이 명시적으로 요구하는 미리듣기를 확보할 수 없다.
- Client Credentials 토큰의 발급·만료·갱신·서버 캐시를 직접 관리해야 하고, dev 모드 앱은 사용 가능 사용자 수에 제한이 있다.

iTunes Search API (Apple):

- **인증·키가 전혀 없다.** `https://itunes.apple.com/search?term=&entity=song` 형태의 공개 엔드포인트.
- `previewUrl`(30초 m4a)을 대부분의 곡에 대해 제공한다.
- 응답 필드(`trackId` / `trackName` / `artistName` / `artworkUrl100` / `previewUrl`)가 `records` 스키마(`track_id` / `track_name` / `artist` / `album_art` / `preview_url`)에 거의 1:1로 매핑된다. `artworkUrl100`은 URL 문자열 치환으로 고해상도(`600x600bb.jpg`)를 얻을 수 있다.

## 결정

**음악 provider를 iTunes Search API로 한다.**

- `/api/music/search` Route Handler가 `shared/lib/music/`의 `MusicProvider` 구현(iTunes)을 감싸고, 정규화된 응답(`{ trackId, trackName, artist, albumArt, previewUrl }`)만 프론트에 반환한다.
- provider는 인터페이스로 분리한다. 나중에 다른 provider로 교체할 때 구현 파일 하나 추가 + 배선 한 줄 변경으로 끝나도록 한다.
- iTunes는 키가 없지만 프론트가 직접 호출하지 않고 Route Handler를 경유한다 — rate limit 완화(서버 캐시)와 응답 정규화를 한곳에 두기 위해서다.

## 결과

**긍정적**

- 외부 계정·토큰·시크릿이 0개다. `.env.local` / Vercel 환경변수 / GitHub Secrets에서 음악 관련 항목이 사라진다. 솔로 1개월 MVP에서 설정·디버깅 비용을 아낀다.
- 미리듣기가 실제로 동작한다 (현시점 Spotify로는 불가).
- 응답이 스키마에 바로 매핑돼 어댑터 코드가 얇다.
- Route Handler가 provider를 가리므로, 후일 교체 시 프론트 코드는 영향받지 않는다.

**부정적 / 트레이드오프**

- 검색 품질과 오타 허용이 Spotify보다 약하다. 랭킹이 스토어 판매 중심이다.
- rate limit이 약 20 req/분이고 키로 상향할 수 없다. → 서버사이드 캐시 + 클라이언트 debounce로 완화한다.
- 오디오 특성(energy, valence 등)과 추천 엔진이 없다. 현재 spec은 이를 쓰지 않으므로 무관하나, 향후 "무드 기반 곡 자동 추천" 같은 기능에는 제약이 된다.

## 재검토 조건

아래 중 하나라도 해당되면 provider 재평가(Spotify 또는 그 외)를 검토한다. provider 인터페이스가 있어 교체 비용은 낮다.

- 검색 품질이 기록 UX를 실제로 훼손할 때 (사용자가 원하는 곡을 못 찾는 사례가 반복될 때)
- rate limit에 반복적으로 부딪힐 때 (동시 사용자 증가)
- 오디오 특성 기반 기능이 로드맵에 들어올 때
- Spotify가 `preview_url` 정책을 되돌리는 등 전제가 바뀔 때
