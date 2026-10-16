import { render, screen, fireEvent } from "@testing-library/react";
import { NavMenu } from "./NavMenu";

let mockPathname = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));
jest.mock("@/features/auth/actions", () => ({
  signOut: jest.fn(),
}));

describe("NavMenu", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  it("links to every screen", () => {
    render(<NavMenu />);

    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "기록하기" })).toHaveAttribute("href", "/record");
    expect(screen.getByRole("link", { name: "다이어리" })).toHaveAttribute("href", "/diary");
    expect(screen.getByRole("link", { name: "검색" })).toHaveAttribute("href", "/search");
  });

  it("marks only the current route as active", () => {
    mockPathname = "/record";
    render(<NavMenu />);

    expect(screen.getByRole("link", { name: "기록하기" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "홈" })).not.toHaveAttribute("aria-current");
  });

  it("calls onNavigate when a link is clicked", () => {
    const onNavigate = jest.fn();
    render(<NavMenu onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole("link", { name: "검색" }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("renders a logout button", () => {
    render(<NavMenu />);
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
  });
});
