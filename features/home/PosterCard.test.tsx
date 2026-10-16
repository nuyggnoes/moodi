import { render, screen, fireEvent } from "@testing-library/react";
import { PosterCard } from "./PosterCard";
import type { WeekDay } from "./weekDays";
import type { MusicRecord } from "@/entities/record/types";

function makeRecord(overrides: Partial<MusicRecord> = {}): MusicRecord {
  return {
    id: "r1",
    user_id: "u1",
    track_id: "1",
    track_name: "Next Level",
    artist: "aespa",
    album_art: null,
    preview_url: "https://example.com/p.m4a",
    mood: "energetic",
    mood_source: "user",
    memo: null,
    ai_comment: null,
    created_at: "2026-10-09T09:00:00Z",
    record_date: "2026-10-09",
    ...overrides,
  };
}

function setup(day: WeekDay, props: Partial<React.ComponentProps<typeof PosterCard>> = {}) {
  const onBringToCenter = jest.fn();
  const onTogglePlay = jest.fn();
  render(
    <PosterCard
      day={day}
      isCenter
      onBringToCenter={onBringToCenter}
      isPlaying={false}
      onTogglePlay={onTogglePlay}
      {...props}
    />,
  );
  return { onBringToCenter, onTogglePlay };
}

describe("PosterCard with a record", () => {
  const day: WeekDay = { dateKey: "2026-10-09", record: makeRecord(), isToday: false };

  it("shows the date, track and artist", () => {
    setup(day);

    expect(screen.getByText("10.09")).toBeInTheDocument();
    expect(screen.getByText("금요일")).toBeInTheDocument();
    expect(screen.getByText("Next Level")).toBeInTheDocument();
    expect(screen.getByText("aespa")).toBeInTheDocument();
  });

  it("toggles preview playback", () => {
    const { onTogglePlay } = setup(day);

    fireEvent.click(screen.getByRole("button", { name: "Next Level 미리듣기" }));

    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it("offers to stop while playing", () => {
    setup(day, { isPlaying: true });
    expect(screen.getByRole("button", { name: "Next Level 정지" })).toBeInTheDocument();
  });

  it("disables playback when there is no preview", () => {
    setup({ ...day, record: makeRecord({ preview_url: null }) });
    expect(screen.getByRole("button", { name: "Next Level 미리듣기" })).toBeDisabled();
  });

  it("brings a side poster to the center when clicked", () => {
    const { onBringToCenter } = setup(day, { isCenter: false });

    fireEvent.click(screen.getByText("Next Level"));

    expect(onBringToCenter).toHaveBeenCalledTimes(1);
  });

  it("hides side posters from assistive tech and the tab order", () => {
    const { container } = render(
      <PosterCard day={day} isCenter={false} onBringToCenter={jest.fn()} isPlaying={false} onTogglePlay={jest.fn()} />,
    );

    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("button")).toHaveAttribute("tabindex", "-1");
  });
});

describe("PosterCard for a past day without a record", () => {
  const day: WeekDay = { dateKey: "2026-10-10", record: null, isToday: false };

  it("has no link, no button and no plus icon", () => {
    const { container } = render(
      <PosterCard day={day} isCenter onBringToCenter={jest.fn()} isPlaying={false} onTogglePlay={jest.fn()} />,
    );

    expect(screen.getByText("기록 없는 날")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("does nothing when clicked in the center", () => {
    const { onBringToCenter } = setup(day);

    fireEvent.click(screen.getByText("기록 없는 날"));

    expect(onBringToCenter).not.toHaveBeenCalled();
  });
});

describe("PosterCard for today without a record", () => {
  const day: WeekDay = { dateKey: "2026-10-14", record: null, isToday: true };

  it("links the whole poster to /record with a plus icon", () => {
    const { container } = render(
      <PosterCard day={day} isCenter onBringToCenter={jest.fn()} isPlaying={false} onTogglePlay={jest.fn()} />,
    );

    expect(screen.getByRole("link", { name: "오늘 기록하기" })).toHaveAttribute("href", "/record");
    expect(screen.getByText("수요일 · 오늘")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("only brings itself to the center when it is not centered", () => {
    const { onBringToCenter } = setup(day, { isCenter: false });
    const link = screen.getByText("나의 오늘 감정을 노래와 함께 기록").closest("a")!;

    const notPrevented = fireEvent.click(link);

    expect(notPrevented).toBe(false); // preventDefault → 이동하지 않음
    expect(onBringToCenter).toHaveBeenCalledTimes(1);
  });

  it("navigates when it is centered", () => {
    const { onBringToCenter } = setup(day);
    const link = screen.getByRole("link", { name: "오늘 기록하기" });

    const notPrevented = fireEvent.click(link);

    expect(notPrevented).toBe(true);
    expect(onBringToCenter).not.toHaveBeenCalled();
  });
});
