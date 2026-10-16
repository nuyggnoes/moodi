/**
 * 사이드바 접힘 모드.
 * - auto: 폭이 좁으면(1100px 이하) 레일, 넓으면 펼침 — CSS 가 결정한다
 * - open / closed: 사용자가 토글로 고정한 상태
 */
export type CollapseMode = "auto" | "open" | "closed";

/** 지금 레일(아이콘만)로 보이는지. `narrow` 는 폭이 1100px 이하인지. */
export function isRail(mode: CollapseMode, narrow: boolean): boolean {
  return mode === "closed" || (mode === "auto" && narrow);
}

/** 토글: 지금 보이는 상태의 반대로 고정한다. */
export function toggleMode(mode: CollapseMode, narrow: boolean): CollapseMode {
  return isRail(mode, narrow) ? "open" : "closed";
}
