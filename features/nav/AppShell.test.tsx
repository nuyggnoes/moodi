import { render, screen } from "@testing-library/react";
import { AppShell } from "./AppShell";

let mockPathname = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));
jest.mock("./TopBar", () => ({
  TopBar: () => <div data-testid="top-bar" />,
}));

function setup(userId: string | null) {
  render(
    <AppShell userId={userId}>
      <p>본문</p>
    </AppShell>,
  );
}

describe("AppShell", () => {
  it.each(["/", "/record", "/diary", "/search"])(
    "shows the top bar on %s when logged in",
    (path) => {
      mockPathname = path;
      setup("u1");
      expect(screen.getByTestId("top-bar")).toBeInTheDocument();
      expect(screen.getByText("본문")).toBeInTheDocument();
    },
  );

  it.each(["/login", "/signup", "/profile/setup"])(
    "hides the top bar on %s",
    (path) => {
      mockPathname = path;
      setup("u1");
      expect(screen.queryByTestId("top-bar")).not.toBeInTheDocument();
      expect(screen.getByText("본문")).toBeInTheDocument();
    },
  );

  it("hides the top bar when logged out", () => {
    mockPathname = "/";
    setup(null);
    expect(screen.queryByTestId("top-bar")).not.toBeInTheDocument();
  });
});
