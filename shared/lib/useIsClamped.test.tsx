import { render, screen } from "@testing-library/react";
import { useIsClamped } from "./useIsClamped";

function mockHeights(scrollHeight: number, clientHeight: number) {
  jest.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(scrollHeight);
  jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(clientHeight);
}

function Probe() {
  const [ref, clamped] = useIsClamped();
  return (
    <p ref={ref} data-testid="text">
      {clamped ? "clamped" : "fits"}
    </p>
  );
}

afterEach(() => jest.restoreAllMocks());

describe("useIsClamped", () => {
  it("reports clamped when the content is taller than the box", () => {
    mockHeights(120, 60);
    render(<Probe />);
    expect(screen.getByTestId("text")).toHaveTextContent("clamped");
  });

  it("reports not clamped when the content fits", () => {
    mockHeights(60, 60);
    render(<Probe />);
    expect(screen.getByTestId("text")).toHaveTextContent("fits");
  });

  it("tolerates a 1px rounding difference", () => {
    mockHeights(61, 60);
    render(<Probe />);
    expect(screen.getByTestId("text")).toHaveTextContent("fits");
  });
});
