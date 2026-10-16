import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomeView } from "./HomeView";
import { useWeekRecords } from "./useWeekRecords";
import { groupRecordsByKstDay } from "./weekDays";
import { RightPanelProvider, RightPanelSlot } from "@/features/nav/RightPanel";
import type { MusicRecord } from "@/entities/record/types";

jest.mock("./useWeekRecords", () => ({ useWeekRecords: jest.fn() }));
const mockedUseWeekRecords = useWeekRecords as jest.Mock;

const NOW = new Date("2026-10-13T20:00:00Z"); // 오늘 = 10.14(KST)

function makeRecord(day: number, overrides: Partial<MusicRecord> = {}): MusicRecord {
  const created = `2026-10-${String(day).padStart(2, "0")}T03:00:00Z`;
  return {
    id: `r${day}`,
    user_id: "u1",
    track_id: String(day),
    track_name: `곡${day}`,
    artist: `가수${day}`,
    album_art: null,
    preview_url: null,
    mood: "calm",
    mood_source: "user",
    memo: `${day}일의 메모예요 충분히 길게`,
    ai_comment: `${day}일의 코멘트예요`,
    created_at: created,
    record_date: created.slice(0, 10),
    ...overrides,
  };
}

function weekWith(records: MusicRecord[]) {
  return groupRecordsByKstDay(records, NOW);
}

function setup(days: ReturnType<typeof weekWith> | undefined, extra: Record<string, unknown> = {}) {
  mockedUseWeekRecords.mockReturnValue({ data: days, isError: false, refetch: jest.fn(), ...extra });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <RightPanelProvider>
        <HomeView userId="u1" />
        <RightPanelSlot />
      </RightPanelProvider>
    </QueryClientProvider>,
  );
}

function panel() {
  return screen.getByLabelText("보조 패널", { selector: "aside" });
}

describe("HomeView", () => {
  it("shows a loading state until the week is loaded", () => {
    setup(undefined);
    expect(screen.getByRole("status", { name: "기록을 불러오는 중" })).toBeInTheDocument();
  });

  it("offers a retry when loading fails", () => {
    const refetch = jest.fn();
    setup(undefined, { isError: true, refetch });

    expect(screen.getByRole("alert")).toHaveTextContent("기록을 불러오지 못했어요.");
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders the 7-day carousel with today selected and the panel in the right slot", () => {
    setup(weekWith([makeRecord(12), makeRecord(14)]));

    expect(screen.getAllByRole("tab")).toHaveLength(7);
    expect(screen.getByRole("tab", { name: "10.14 수요일", selected: true })).toBeInTheDocument();
    expect(within(panel()).getByText("곡14")).toBeInTheDocument();
    expect(within(panel()).getByText("10.14 수 · 오늘")).toBeInTheDocument();
  });

  it("shows the date range in the header", () => {
    setup(weekWith([makeRecord(14)]));
    expect(screen.getByText("최근 7일 · 10.08 – 10.14")).toBeInTheDocument();
  });

  it("follows the carousel selection in the panel", () => {
    setup(weekWith([makeRecord(12), makeRecord(14)]));

    fireEvent.click(screen.getByRole("tab", { name: "10.12 월요일" }));

    expect(within(panel()).getByText("곡12")).toBeInTheDocument();
    expect(within(panel()).queryByText("곡14")).not.toBeInTheDocument();
    expect(within(panel()).getByText("10.12 월")).toBeInTheDocument();
  });

  describe("headline", () => {
    it("asks about today when today has no record and is selected", () => {
      setup(weekWith([makeRecord(12)]));
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("오늘은 어떤 노래가 어울리나요?");
    });

    it("looks back at the week otherwise", () => {
      setup(weekWith([makeRecord(12), makeRecord(14)]));
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("이번 주, 이런 노래와 함께였어요");
    });

    it("looks back at the week when a past day is selected even if today is empty", () => {
      setup(weekWith([makeRecord(12)]));

      fireEvent.click(screen.getByRole("tab", { name: "10.12 월요일" }));

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("이번 주, 이런 노래와 함께였어요");
    });
  });

  describe("paths into recording and editing", () => {
    it("links today's record to the edit screen", () => {
      setup(weekWith([makeRecord(14)]));
      expect(within(panel()).getByRole("link", { name: "수정" })).toHaveAttribute("href", "/record?edit=1");
    });

    it("has no edit link on a past record", () => {
      setup(weekWith([makeRecord(12), makeRecord(14)]));

      fireEvent.click(screen.getByRole("tab", { name: "10.12 월요일" }));

      expect(within(panel()).queryByRole("link", { name: "수정" })).not.toBeInTheDocument();
    });

    it("offers recording from today's empty poster and the panel", () => {
      setup(weekWith([makeRecord(12)]));

      expect(screen.getByRole("link", { name: "오늘 기록하기" })).toHaveAttribute("href", "/record");
      expect(within(panel()).getByRole("link", { name: "기록하기" })).toHaveAttribute("href", "/record");
    });

    it("offers nothing on a past empty day", () => {
      setup(weekWith([makeRecord(14)]));

      fireEvent.click(screen.getByRole("tab", { name: "10.10 토요일" }));

      expect(within(panel()).getByText("기록 없는 날")).toBeInTheDocument();
      expect(within(panel()).queryByRole("link")).not.toBeInTheDocument();
      expect(within(panel()).queryByRole("button")).not.toBeInTheDocument();
    });
  });

  it("shows the memo and comment area for narrow screens", () => {
    const { container } = setup(weekWith([makeRecord(14)]));
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent("14일의 코멘트예요");
  });
});
