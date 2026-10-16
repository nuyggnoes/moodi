import { render, screen } from "@testing-library/react";
import { RightPanel, RightPanelProvider, RightPanelSlot } from "./RightPanel";

function Shell({ withPanel }: { withPanel: boolean }) {
  return (
    <RightPanelProvider>
      <main>
        <p>본문</p>
        {withPanel && (
          <RightPanel>
            <p>선택한 날 상세</p>
          </RightPanel>
        )}
      </main>
      <RightPanelSlot />
    </RightPanelProvider>
  );
}

describe("RightPanel", () => {
  it("renders the page's content inside the shell's right slot", () => {
    render(<Shell withPanel />);

    const slot = screen.getByLabelText("보조 패널", { selector: "aside" });
    expect(slot).toContainElement(screen.getByText("선택한 날 상세"));
    expect(screen.getByRole("main")).not.toContainElement(screen.getByText("선택한 날 상세"));
  });

  it("leaves the slot empty when the page does not fill it", () => {
    render(<Shell withPanel={false} />);

    expect(screen.getByLabelText("보조 패널", { selector: "aside" })).toBeEmptyDOMElement();
  });

  it("removes the content when the page stops rendering the panel", () => {
    const { rerender } = render(<Shell withPanel />);
    rerender(<Shell withPanel={false} />);

    expect(screen.queryByText("선택한 날 상세")).not.toBeInTheDocument();
  });

  it("renders nothing without a provider (e.g. login screens)", () => {
    render(
      <RightPanel>
        <p>내용</p>
      </RightPanel>,
    );

    expect(screen.queryByText("내용")).not.toBeInTheDocument();
  });
});
