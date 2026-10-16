import { render, screen } from "@testing-library/react";
import { AppShell } from "./AppShell";

let mockPathname = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));
jest.mock("./TopBar", () => ({
  TopBar: () => <div data-testid="top-bar" />,
}));
jest.mock("./Sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar" />,
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
    "mounts both the top bar and the sidebar on %s when logged in (CSS shows one)",
    (path) => {
      mockPathname = path;
      setup("u1");
      expect(screen.getByTestId("top-bar")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar")).toBeInTheDocument();
      expect(screen.getByText("본문")).toBeInTheDocument();
    },
  );

  it.each(["/login", "/signup", "/profile/setup"])(
    "hides the navigation on %s",
    (path) => {
      mockPathname = path;
      setup("u1");
      expect(screen.queryByTestId("top-bar")).not.toBeInTheDocument();
      expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
      expect(screen.getByText("본문")).toBeInTheDocument();
    },
  );

  it("hides the navigation when logged out", () => {
    mockPathname = "/";
    setup(null);
    expect(screen.queryByTestId("top-bar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
    expect(screen.getByText("본문")).toBeInTheDocument();
  });

  it("provides an empty right panel slot next to the content", () => {
    mockPathname = "/";
    setup("u1");
    expect(screen.getByLabelText("보조 패널", { selector: "aside" })).toBeEmptyDOMElement();
  });
});
