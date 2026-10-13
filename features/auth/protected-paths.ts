/**
 * 로그인 없이 접근할 수 있는 경로. 여기에 없는 경로는 모두 로그인이 필요하다(기본 차단).
 * welcome 페이지가 생기면 이 목록에 추가한다.
 */
const PUBLIC_PATHS = ["/login", "/signup"];

/** 로그인만 되면 접근 가능한 경로(프로필 완료 여부는 무관). */
const PROFILE_OPTIONAL_PATHS = ["/profile/setup"];

function matches(pathname: string, paths: string[]): boolean {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** `/api` 이하 Route Handler 경로인지. 비로그인 시 리다이렉트 대신 401을 준다. */
export function isApiPath(pathname: string): boolean {
  return matches(pathname, ["/api"]);
}

/** 로그인이 필요한 경로: 공개 경로를 제외한 전부. */
export function requiresAuth(pathname: string): boolean {
  return !matches(pathname, PUBLIC_PATHS);
}

/** 로그인 + 프로필(`public.users` 행) 완료가 모두 필요한 경로. */
export function requiresProfile(pathname: string): boolean {
  return (
    requiresAuth(pathname) &&
    !matches(pathname, PROFILE_OPTIONAL_PATHS) &&
    !isApiPath(pathname)
  );
}

/** 전역 네비게이션 바를 숨기는 경로: 공개 경로와 프로필 설정(아직 앱 안으로 들어오기 전). */
export function hidesNav(pathname: string): boolean {
  return !requiresAuth(pathname) || matches(pathname, PROFILE_OPTIONAL_PATHS);
}
