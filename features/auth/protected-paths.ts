/** 로그인이 필요한 경로. `/profile/setup`은 로그인만 되면 접근 가능(프로필 완료 여부는 무관). */
const AUTH_REQUIRED_PATHS = ["/record", "/diary", "/profile/setup"];

/** 로그인 + 프로필(`public.users` 행) 완료가 모두 필요한 경로. */
const PROFILE_REQUIRED_PATHS = ["/record", "/diary"];

function matches(pathname: string, paths: string[]): boolean {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function requiresAuth(pathname: string): boolean {
  return matches(pathname, AUTH_REQUIRED_PATHS);
}

export function requiresProfile(pathname: string): boolean {
  return matches(pathname, PROFILE_REQUIRED_PATHS);
}
