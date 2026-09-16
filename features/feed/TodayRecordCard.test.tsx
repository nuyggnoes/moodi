import { useRef, useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodayRecordCard } from "./TodayRecordCard";
import type { MusicRecord } from "@/entities/record/types";

function makeRecord(overrides: Partial<MusicRecord> = {}): MusicRecord {
  return {
    id: "1",
    user_id: "u1",
    track_id: "t1",
    track_name: "Next Level",
    artist: "aespa",
    album_art: null,
    preview_url: "https://example.com/preview.m4a",
    mood: "energetic",
    mood_source: "user",
    memo: null,
    ai_comment: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/** MainFeed이 하듯 재생 상태를 부모가 소유하는 형태를 재현하는 테스트용 래퍼. */
function Wrapper({ record }: { record: MusicRecord }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <>
      <TodayRecordCard
        record={record}
        audioRef={audioRef}
        isPlaying={isPlaying}
        onPlayingChange={setIsPlaying}
      />
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} hidden />
    </>
  );
}

describe("TodayRecordCard", () => {
  const originalPlay = window.HTMLMediaElement.prototype.play;
  const originalPause = window.HTMLMediaElement.prototype.pause;

  beforeAll(() => {
    window.HTMLMediaElement.prototype.play = jest.fn();
    window.HTMLMediaElement.prototype.pause = jest.fn();
  });

  afterAll(() => {
    window.HTMLMediaElement.prototype.play = originalPlay;
    window.HTMLMediaElement.prototype.pause = originalPause;
  });

  it("renders track info and the mood tag", () => {
    render(<Wrapper record={makeRecord()} />);
    expect(screen.getByText("Next Level")).toBeInTheDocument();
    expect(screen.getByText("aespa")).toBeInTheDocument();
    expect(screen.getByText("신나는")).toBeInTheDocument();
  });

  it("toggles play/pause when the album art is tapped", () => {
    render(<Wrapper record={makeRecord()} />);
    const playButton = screen.getByRole("button", { name: "Next Level 재생" });

    fireEvent.click(playButton);
    expect(screen.getByRole("button", { name: "Next Level 정지" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next Level 정지" }));
    expect(screen.getByRole("button", { name: "Next Level 재생" })).toBeInTheDocument();
  });

  it("does not show memo/AI comment until the mood tag is tapped", () => {
    render(<Wrapper record={makeRecord({ memo: "좋았다" })} />);
    expect(screen.queryByText("좋았다")).not.toBeInTheDocument();
  });

  it("reveals memo and AI comment when the mood tag is tapped", () => {
    render(
      <Wrapper record={makeRecord({ memo: "좋았다", ai_comment: "신나는 하루였네요" })} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "신나는" }));

    expect(screen.getByText("좋았다")).toBeInTheDocument();
    expect(screen.getByText("신나는 하루였네요")).toBeInTheDocument();
  });

  it("shows a placeholder when the AI comment is not ready yet", () => {
    render(<Wrapper record={makeRecord()} />);
    fireEvent.click(screen.getByRole("button", { name: "신나는" }));
    expect(
      screen.getByText("AI 코멘트는 아직 준비 중이에요."),
    ).toBeInTheDocument();
  });

  it("closes the reveal layer when the mood tag is tapped again", () => {
    render(<Wrapper record={makeRecord({ memo: "좋았다" })} />);

    fireEvent.click(screen.getByRole("button", { name: "신나는" }));
    expect(screen.getByText("좋았다")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "신나는" }));
    expect(screen.queryByText("좋았다")).not.toBeInTheDocument();
  });

  it("closes the reveal layer when tapping outside it", () => {
    const { container } = render(<Wrapper record={makeRecord({ memo: "좋았다" })} />);

    fireEvent.click(screen.getByRole("button", { name: "신나는" }));
    expect(screen.getByText("좋았다")).toBeInTheDocument();

    fireEvent.click(container.querySelector('[aria-hidden="true"].fixed')!);
    expect(screen.queryByText("좋았다")).not.toBeInTheDocument();
  });
});
