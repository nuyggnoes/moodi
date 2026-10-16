import { act, render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "./Sidebar";

let mockPathname = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));
jest.mock("@/features/auth/actions", () => ({
  signOut: jest.fn(),
}));
jest.mock("@/entities/user/useUserProfile", () => ({
  useUserProfile: () => ({ data: { nickname: "무디", avatar_url: null } }),
}));

type Listener = () => void;
let narrow = false;
const listeners = new Set<Listener>();

function setNarrow(next: boolean) {
  narrow = next;
  listeners.forEach((l) => l());
}

beforeEach(() => {
  mockPathname = "/";
  narrow = false;
  listeners.clear();
  window.matchMedia = jest.fn().mockImplementation(() => ({
    get matches() {
      return narrow;
    },
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  }));
});

function toggle() {
  return screen.getByRole("button", { name: "사이드바 접기/펼치기" });
}

describe("Sidebar", () => {
  it("shows the nickname, menu links and logout", () => {
    render(<Sidebar userId="u1" />);

    expect(screen.getByText("무디")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "다이어리" })).toHaveAttribute("href", "/diary");
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
  });

  it("starts expanded on a wide screen", () => {
    render(<Sidebar userId="u1" />);

    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("complementary", { name: "메뉴" })).toHaveAttribute("data-collapsed", "auto");
  });

  it("collapses and expands with the toggle button", () => {
    render(<Sidebar userId="u1" />);

    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("complementary", { name: "메뉴" })).toHaveAttribute("data-collapsed", "closed");

    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("complementary", { name: "메뉴" })).toHaveAttribute("data-collapsed", "open");
  });

  it("is a rail on a narrow screen and can still be expanded manually", () => {
    narrow = true;
    render(<Sidebar userId="u1" />);

    expect(toggle()).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
  });

  it("drops a manual choice when the width crosses the breakpoint", () => {
    render(<Sidebar userId="u1" />);
    fireEvent.click(toggle());
    expect(screen.getByRole("complementary", { name: "메뉴" })).toHaveAttribute("data-collapsed", "closed");

    act(() => setNarrow(true));

    expect(screen.getByRole("complementary", { name: "메뉴" })).toHaveAttribute("data-collapsed", "auto");
  });
});
