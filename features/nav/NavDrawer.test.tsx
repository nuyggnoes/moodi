import { render, screen, fireEvent } from "@testing-library/react";
import { NavDrawer } from "./NavDrawer";

let mockPathname = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));
jest.mock("@/features/auth/actions", () => ({
  signOut: jest.fn(),
}));

function setup(props: Partial<React.ComponentProps<typeof NavDrawer>> = {}) {
  const onClose = jest.fn();
  render(
    <NavDrawer
      open
      onClose={onClose}
      nickname="무디"
      avatarUrl={null}
      {...props}
    />,
  );
  return { onClose };
}

describe("NavDrawer", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  it("shows the nickname and links to every screen", () => {
    setup();

    expect(screen.getByText("무디")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "기록하기" })).toHaveAttribute("href", "/record");
    expect(screen.getByRole("link", { name: "다이어리" })).toHaveAttribute("href", "/diary");
    expect(screen.getByRole("link", { name: "검색" })).toHaveAttribute("href", "/search");
  });

  it("marks only the current route as active", () => {
    mockPathname = "/diary";
    setup();

    expect(screen.getByRole("link", { name: "다이어리" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "홈" })).not.toHaveAttribute("aria-current");
  });

  it("closes when a link is clicked", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole("link", { name: "검색" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders a logout button", () => {
    setup();
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    setup({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
