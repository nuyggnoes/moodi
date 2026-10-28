import {
  render as rtlRender,
  screen,
  fireEvent,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DiaryCalendar } from "./DiaryCalendar";
import { useMonthRecords } from "./useMonthRecords";
import type { MusicRecord } from "@/entities/record/types";

jest.mock("./useMonthRecords", () => ({
  useMonthRecords: jest.fn(),
}));

const mockedUseMonthRecords = useMonthRecords as jest.Mock;

// DayDetail 안의 AiComment 가 react-query 훅을 쓰므로 프로바이더로 감싼다.
function render(ui: React.ReactElement) {
  return rtlRender(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
  );
}

// 2026-10-28 (KST) 정오로 고정한다. 오늘 이후 날짜는 선택할 수 없어서 날짜가 흔들리면 안 된다.
const NOW = new Date("2026-10-28T03:00:00.000Z");

beforeEach(() => {
  jest.useFakeTimers({
    now: NOW,
    doNotFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "setImmediate",
      "clearImmediate",
      "queueMicrotask",
      "nextTick",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "performance",
    ],
  });
});

afterEach(() => {
  jest.useRealTimers();
});

function keyForDay(day: number): string {
  return `2026-10-${String(day).padStart(2, "0")}`;
}

function isoForDay(day: number): string {
  // 기록은 KST 날짜로 묶이므로 해당 일 KST 정오(= 03:00Z)로 만든다.
  return new Date(Date.UTC(2026, 9, day, 3, 0, 0)).toISOString();
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
    record_date: "2026-10-14",
    ...overrides,
  };
}

describe("DiaryCalendar", () => {
  it("shows day detail when a day with a record is clicked", () => {
    mockedUseMonthRecords.mockReturnValue({
      data: [
        makeRecord({
          id: "a",
          track_name: "Next Level",
          created_at: isoForDay(3),
        }),
        makeRecord({
          id: "b",
          track_name: "Supernova",
          created_at: isoForDay(10),
        }),
      ],
      isFetching: false,
    });
    render(<DiaryCalendar userId="u1" />);

    fireEvent.click(screen.getByRole("button", { name: keyForDay(3) }));

    expect(screen.getByRole("button", { name: keyForDay(3) })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByText("Next Level").length).toBeGreaterThan(0);
  });

  it("selects today by default when today has a record", () => {
    mockedUseMonthRecords.mockReturnValue({
      data: [
        makeRecord({ id: "a", created_at: isoForDay(3) }),
        makeRecord({ id: "b", created_at: isoForDay(28) }),
      ],
      isFetching: false,
    });
    render(<DiaryCalendar userId="u1" />);

    expect(screen.getByRole("button", { name: keyForDay(28) })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("selects the most recent recorded day when today has no record", () => {
    mockedUseMonthRecords.mockReturnValue({
      data: [
        makeRecord({ id: "a", created_at: isoForDay(3) }),
        makeRecord({ id: "b", created_at: isoForDay(20) }),
      ],
      isFetching: false,
    });
    render(<DiaryCalendar userId="u1" />);

    expect(screen.getByRole("button", { name: keyForDay(20) })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
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

  it("disables days after today", () => {
    mockedUseMonthRecords.mockReturnValue({ data: [], isFetching: false });
    render(<DiaryCalendar userId="u1" />);

    expect(screen.getByRole("button", { name: keyForDay(29) })).toBeDisabled();
    expect(screen.getByRole("button", { name: keyForDay(28) })).toBeEnabled();
  });

  it("shows the mood distribution for the month", () => {
    mockedUseMonthRecords.mockReturnValue({
      data: [
        makeRecord({ id: "a", mood: "calm", created_at: isoForDay(1) }),
        makeRecord({ id: "b", mood: "calm", created_at: isoForDay(2) }),
        makeRecord({ id: "c", mood: "sad", created_at: isoForDay(3) }),
      ],
      isFetching: false,
    });
    render(<DiaryCalendar userId="u1" />);

    const legend = screen.getByRole("list", { name: "무드 분포" });
    expect(within(legend).getByText("차분한").parentElement).toHaveTextContent(
      "차분한2",
    );
    expect(within(legend).getByText("우울한").parentElement).toHaveTextContent(
      "우울한1",
    );
  });

  it("shows an empty-month message when there are no records", () => {
    mockedUseMonthRecords.mockReturnValue({ data: [], isFetching: false });
    render(<DiaryCalendar userId="u1" />);

    expect(screen.getByText("이 달은 기록이 없어요.")).toBeInTheDocument();
  });

  it("moves to the previous month and blocks moving past the current month", () => {
    mockedUseMonthRecords.mockReturnValue({ data: [], isFetching: false });
    render(<DiaryCalendar userId="u1" />);

    expect(screen.getByText("10월의 무드")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음 달" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "이전 달" }));
    expect(screen.getByText("9월의 무드")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음 달" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "다음 달" }));
    expect(screen.getByText("10월의 무드")).toBeInTheDocument();
  });
});
