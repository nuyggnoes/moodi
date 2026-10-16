import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SelectedDayNote } from "./SelectedDayNote";
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
    preview_url: null,
    mood: "energetic",
    mood_source: "user",
    memo: "퇴근길에 한강까지 걸었다",
    ai_comment: "걷는 박자와 노래가 맞아떨어진 하루였어요",
    created_at: "2026-10-09T23:40:00Z",
    record_date: "2026-10-10",
    ...overrides,
  };
}

function setup(day: WeekDay) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <SelectedDayNote day={day} />
    </QueryClientProvider>,
  );
}

describe("SelectedDayNote", () => {
  it("shows the memo and the AI comment", () => {
    setup({ dateKey: "2026-10-10", record: makeRecord(), isToday: false });

    expect(screen.getByText(/퇴근길에 한강까지 걸었다/)).toBeInTheDocument();
    expect(screen.getByText("걷는 박자와 노래가 맞아떨어진 하루였어요")).toBeInTheDocument();
  });

  it("clamps the memo to 1 line and the comment to 3 lines", () => {
    setup({ dateKey: "2026-10-10", record: makeRecord(), isToday: false });

    expect(screen.getByText(/퇴근길에 한강까지 걸었다/).className).toContain("line-clamp-1");
    expect(screen.getByText("걷는 박자와 노래가 맞아떨어진 하루였어요").className).toContain("line-clamp-3");
  });

  it("keeps its height and shows nothing for a day without a record", () => {
    const { container } = setup({ dateKey: "2026-10-11", record: null, isToday: false });

    const note = container.firstChild as HTMLElement;
    expect(note).toBeEmptyDOMElement();
    expect(note.className).toContain("min-h-[6.4em]");
  });

  it("is hidden when the right panel is visible (1101px and up)", () => {
    const { container } = setup({ dateKey: "2026-10-10", record: makeRecord(), isToday: false });
    expect((container.firstChild as HTMLElement).className).toContain("min-[1101px]:hidden");
  });
});
