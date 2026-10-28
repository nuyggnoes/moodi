import { render, screen, fireEvent } from "@testing-library/react";
import { PosterFace } from "./PosterFace";

function setup(props: Partial<React.ComponentProps<typeof PosterFace>> = {}) {
  const onTogglePlay = jest.fn();
  const view = render(
    <PosterFace
      dateText="10.09"
      dayText="금요일"
      trackName="Next Level"
      artist="aespa"
      albumArt={null}
      previewUrl="https://example.com/p.m4a"
      isPlaying={false}
      onTogglePlay={onTogglePlay}
      {...props}
    />,
  );
  return { onTogglePlay, ...view };
}

describe("PosterFace", () => {
  it("shows the date, weekday, track and artist", () => {
    setup();

    expect(screen.getByText("10.09")).toBeInTheDocument();
    expect(screen.getByText("금요일")).toBeInTheDocument();
    expect(screen.getByText("Next Level")).toBeInTheDocument();
    expect(screen.getByText("aespa")).toBeInTheDocument();
  });

  it("toggles preview playback", () => {
    const { onTogglePlay } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Next Level 미리듣기" }));

    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it("offers to stop while playing", () => {
    setup({ isPlaying: true });
    expect(screen.getByRole("button", { name: "Next Level 정지" })).toBeInTheDocument();
  });

  it("disables playback when there is no preview", () => {
    setup({ previewUrl: null });
    expect(screen.getByRole("button", { name: "Next Level 미리듣기" })).toBeDisabled();
  });

  it("does not let a play click reach the card's own click handler", () => {
    const onClick = jest.fn();
    setup({ onClick });

    fireEvent.click(screen.getByRole("button", { name: "Next Level 미리듣기" }));
    expect(onClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Next Level"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("takes the play button out of the tab order when not focusable", () => {
    setup({ focusable: false });
    expect(screen.getByRole("button", { name: "Next Level 미리듣기" })).toHaveAttribute("tabindex", "-1");
  });

  it("glows in the mood color when a glow color is given", () => {
    const { container } = setup({ glowColor: "#e8a7c4" });
    expect((container.firstChild as HTMLElement).style.boxShadow).toContain("#e8a7c4");
  });

  it("has a plain shadow without a glow color", () => {
    const { container } = setup({ glowColor: null });
    const shadow = (container.firstChild as HTMLElement).style.boxShadow;
    expect(shadow).not.toBe("");
    expect(shadow).not.toContain("color-mix");
  });

  it("renders a footer under the track info", () => {
    setup({ footer: <span>무드 칩</span> });
    expect(screen.getByText("무드 칩")).toBeInTheDocument();
  });

  it("passes layout props through to the card", () => {
    const { container } = setup({ className: "custom-pos", "aria-hidden": true });
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass("custom-pos");
    expect(card).toHaveAttribute("aria-hidden", "true");
  });
});
