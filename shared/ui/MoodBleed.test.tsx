import { render } from "@testing-library/react";
import { MoodBleed } from "./MoodBleed";

describe("MoodBleed", () => {
  it("is a decorative layer hidden from assistive tech", () => {
    const { container } = render(<MoodBleed color="#a7b8e8" />);
    const layer = container.firstChild as HTMLElement;

    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer).toHaveClass("mood-bleed");
  });

  it("exposes the color as the --bleed custom property", () => {
    const { container } = render(<MoodBleed color="#a7b8e8" />);
    expect((container.firstChild as HTMLElement).style.getPropertyValue("--bleed")).toBe("#a7b8e8");
  });
});
