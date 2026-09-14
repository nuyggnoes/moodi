import { render, screen, fireEvent } from "@testing-library/react";
import { DiaryCalendar } from "./DiaryCalendar";
import { useMonthRecords } from "./useMonthRecords";
import type { MusicRecord } from "@/entities/record/types";

jest.mock("./useMonthRecords", () => ({
  useMonthRecords: jest.fn(),
}));

const mockedUseMonthRecords = useMonthRecords as jest.Mock;

function keyForDay(day: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isoForDay(day: number): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0).toISOString();
}

function makeRecord(overrides: Partial<MusicRecord> = {}): MusicRecord {
  return {
    id: "1",
    user_id: "u1",
    track_id: "t1",
    track_name: "Next Level",
    artist: "aespa",
    album_art: null,
    preview_url: null,
    mood: "energetic",
    mood_source: "user",
    memo: null,
    ai_comment: null,
    created_at: isoForDay(1),
    ...overrides,
  };
}

describe("DiaryCalendar", () => {
  it("shows day detail when a day with a record is clicked", () => {
    mockedUseMonthRecords.mockReturnValue({ data: [makeRecord()], isFetching: false });
    render(<DiaryCalendar userId="u1" />);

    fireEvent.click(screen.getByRole("button", { name: keyForDay(1) }));

    expect(screen.getByText("Next Level")).toBeInTheDocument();
  });

  it("shows an empty-day message when clicking a day with no records", () => {
    mockedUseMonthRecords.mockReturnValue({
      data: [makeRecord({ created_at: isoForDay(1) })],
      isFetching: false,
    });
    render(<DiaryCalendar userId="u1" />);

    fireEvent.click(screen.getByRole("button", { name: keyForDay(2) }));

    expect(screen.getByText("이 날은 기록이 없어요.")).toBeInTheDocument();
  });

  it("moves to the previous/next month and clears the selected day", () => {
    mockedUseMonthRecords.mockReturnValue({ data: [], isFetching: false });
    render(<DiaryCalendar userId="u1" />);

    const now = new Date();
    expect(
      screen.getByText(`${now.getFullYear()}년 ${now.getMonth() + 1}월`),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다음 달" }));
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    expect(
      screen.getByText(`${next.getFullYear()}년 ${next.getMonth() + 1}월`),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "이전 달" }));
    expect(
      screen.getByText(`${now.getFullYear()}년 ${now.getMonth() + 1}월`),
    ).toBeInTheDocument();
  });
});
