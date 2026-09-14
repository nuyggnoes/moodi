import { render, screen, fireEvent } from "@testing-library/react";
import { TrackList } from "./TrackList";
import type { Track } from "@/shared/lib/music/types";

const tracks: Track[] = [
  {
    trackId: 1,
    trackName: "Next Level",
    artist: "aespa",
    albumArt: null,
    previewUrl: "https://example.com/next-level.m4a",
  },
  {
    trackId: 2,
    trackName: "Spicy",
    artist: "aespa",
    albumArt: null,
    previewUrl: "https://example.com/spicy.m4a",
  },
];

describe("TrackList", () => {
  let playMock: jest.Mock;
  let pauseMock: jest.Mock;

  beforeEach(() => {
    playMock = jest.fn();
    pauseMock = jest.fn();
    window.HTMLMediaElement.prototype.play = playMock;
    window.HTMLMediaElement.prototype.pause = pauseMock;
  });

  it("plays the preview when clicking a row", () => {
    render(<TrackList tracks={tracks} />);

    fireEvent.click(screen.getByRole("button", { name: "Next Level 재생" }));

    expect(playMock).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Next Level 정지" }),
    ).toBeInTheDocument();
  });

  it("pauses when clicking the currently playing row again", () => {
    render(<TrackList tracks={tracks} />);

    fireEvent.click(screen.getByRole("button", { name: "Next Level 재생" }));
    fireEvent.click(screen.getByRole("button", { name: "Next Level 정지" }));

    expect(pauseMock).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Next Level 재생" }),
    ).toBeInTheDocument();
  });

  it("switches to the newly clicked track, stopping the previous one", () => {
    render(<TrackList tracks={tracks} />);

    fireEvent.click(screen.getByRole("button", { name: "Next Level 재생" }));
    fireEvent.click(screen.getByRole("button", { name: "Spicy 재생" }));

    expect(
      screen.getByRole("button", { name: "Next Level 재생" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Spicy 정지" }),
    ).toBeInTheDocument();
  });

  it("disables the row when there is no preview url", () => {
    render(
      <TrackList
        tracks={[
          {
            trackId: 3,
            trackName: "No Preview",
            artist: "Someone",
            albumArt: null,
            previewUrl: null,
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("button", { name: "No Preview 재생" }),
    ).toBeDisabled();
  });
});
