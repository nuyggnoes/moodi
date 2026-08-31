/**
 * 조건부 className 결합 헬퍼.
 * falsy 값(false, null, undefined, "")은 걸러내고 공백으로 join 한다.
 *
 * @example
 * cn("btn", isActive && "btn--active", disabled ? "opacity-50" : null)
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
