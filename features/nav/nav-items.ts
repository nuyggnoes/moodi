export type NavItem = { href: string; label: string };

/**
 * 드로어 메뉴. `/profile/[id]` 는 프로필 페이지가 생기는 이슈에서 추가한다(아직 라우트 없음).
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "홈" },
  { href: "/record", label: "기록하기" },
  { href: "/diary", label: "다이어리" },
  { href: "/search", label: "검색" },
];

/** 현재 경로가 해당 메뉴에 속하는지. `/` 는 정확히 일치할 때만 활성. */
export function isActiveNavItem(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
