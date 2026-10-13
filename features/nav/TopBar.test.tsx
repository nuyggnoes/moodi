import { render, screen, fireEvent } from "@testing-library/react";
import { TopBar } from "./TopBar";
import { useUserProfile } from "@/entities/user/useUserProfile";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));
jest.mock("@/features/auth/actions", () => ({
  signOut: jest.fn(),
}));
jest.mock("@/entities/user/useUserProfile", () => ({
  useUserProfile: jest.fn(),
}));

describe("TopBar", () => {
  beforeEach(() => {
    (useUserProfile as jest.Mock).mockReturnValue({
      data: { id: "u1", nickname: "무디", avatar_url: null },
    });
  });

  it("links the wordmark to home", () => {
    render(<TopBar userId="u1" />);
    expect(screen.getByRole("link", { name: "Moodi" })).toHaveAttribute("href", "/");
  });

  it("opens the drawer from the hamburger and closes it on backdrop tap", () => {
    render(<TopBar userId="u1" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));
    expect(screen.getByRole("dialog", { name: "메뉴" })).toBeInTheDocument();
    expect(screen.getByText("무디")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("drawer-backdrop"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("still renders while the profile is loading", () => {
    (useUserProfile as jest.Mock).mockReturnValue({ data: undefined });
    render(<TopBar userId="u1" />);
    expect(screen.getByRole("button", { name: "메뉴 열기" })).toBeInTheDocument();
  });
});
