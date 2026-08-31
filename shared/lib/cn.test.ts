import { cn } from "./cn";

describe("cn", () => {
  it("문자열들을 공백으로 join 한다", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("falsy 값을 걸러낸다", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("조건부 클래스를 처리한다", () => {
    const isActive = true;
    const disabled = false;
    expect(cn("btn", isActive && "btn--active", disabled && "opacity-50")).toBe(
      "btn btn--active",
    );
  });

  it("인자가 없으면 빈 문자열을 반환한다", () => {
    expect(cn()).toBe("");
  });
});
