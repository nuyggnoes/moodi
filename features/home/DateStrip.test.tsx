import { render, screen, fireEvent } from "@testing-library/react";
import { DateStrip } from "./DateStrip";
import { groupRecordsByKstDay } from "./weekDays";
import type { MusicRecord } from "@/entities/record/types";

const record = {
  id: "r1",
  user_id: "u1",
  track_id: "1",
  track_name: "Ditto",
  artist: "NewJeans",
  album_art: null,
  preview_url: null,
  mood: "exciting",
  mood_source: "user",
  memo: null,
  ai_comment: null,
  created_at: "2026-10-10T03:00:00Z",
  record_date: "2026-10-10",
} as MusicRecord;

const days = groupRecordsByKstDay([record], new Date("2026-10-13T20:00:00Z"));

describe("DateStrip", () => {
  it("renders one tab per day, marking the selected one", () => {
    render(<DateStrip days={days} selectedIndex={6} onSelect={jest.fn()} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(7);
    expect(tabs[6]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "10.14 수요일" })).toBe(tabs[6]);
  });

  it("selects a day when its tab is clicked", () => {
    const onSelect = jest.fn();
    render(<DateStrip days={days} selectedIndex={6} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("tab", { name: "10.10 토요일" }));

    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
