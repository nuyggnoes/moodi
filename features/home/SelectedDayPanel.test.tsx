import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SelectedDayPanel } from "./SelectedDayPanel";
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
    memo: "퇴근길에 이어폰을 끼고 한강까지 걸었다",
    ai_comment: "걷는 박자와 노래가 맞아떨어진 하루였어요",
    created_at: "2026-10-09T23:40:00Z", // 10.10 08:40 KST
    record_date: "2026-10-10",
    ...overrides,
  };
}

function day(overrides: Partial<WeekDay> = {}): WeekDay {
  return { dateKey: "2026-10-10", record: makeRecord(), isToday: false, ...overrides };
}

function setup(d: WeekDay, editHref?: string) {
  const queryClient = new QueryClient();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <SelectedDayPanel day={d} editHref={editHref} />
    </QueryClientProvider>,
  );
  return {
    ...view,
    rerenderDay: (next: WeekDay) =>
      view.rerender(
        <QueryClientProvider client={queryClient}>
          <SelectedDayPanel day={next} editHref={editHref} />
        </QueryClientProvider>,
      ),
  };
}

function mockClamp(clamped: boolean) {
  jest.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(clamped ? 200 : 40);
  jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(40);
}

afterEach(() => jest.restoreAllMocks());

describe("SelectedDayPanel with a record", () => {
  it("shows the day, track, mood, memo and AI comment", () => {
    setup(day());

    expect(screen.getByText("10.10 토")).toBeInTheDocument();
    expect(screen.getByText("Next Level")).toBeInTheDocument();
    expect(screen.getByText("aespa")).toBeInTheDocument();
    expect(screen.getByText("신나는")).toBeInTheDocument();
    expect(screen.getByText("퇴근길에 이어폰을 끼고 한강까지 걸었다")).toBeInTheDocument();
    expect(screen.getByText("걷는 박자와 노래가 맞아떨어진 하루였어요")).toBeInTheDocument();
  });

  it("follows the selected day", () => {
    const { rerenderDay } = setup(day());

    rerenderDay(
      day({
        dateKey: "2026-10-11",
        record: makeRecord({ id: "r2", track_name: "Mad World", memo: "비 오는 일요일이라 조용히", ai_comment: null }),
      }),
    );

    expect(screen.getByText("Mad World")).toBeInTheDocument();
    expect(screen.queryByText("Next Level")).not.toBeInTheDocument();
    expect(screen.getByText("10.11 일")).toBeInTheDocument();
  });

  it("shows the record time and how the mood was chosen", () => {
    setup(day());
    expect(screen.getByText("오전 8:40 기록 · 직접 골랐어요")).toBeInTheDocument();
  });

  it("says when the mood came from the AI suggestion", () => {
    setup(day({ record: makeRecord({ mood_source: "ai" }) }));
    expect(screen.getByText(/AI 제안을 선택했어요/)).toBeInTheDocument();
  });

  it("explains when there is no memo and hides the comment section", () => {
    setup(day({ record: makeRecord({ memo: null, ai_comment: null }) }));

    expect(screen.getByText("남긴 메모가 없어요.")).toBeInTheDocument();
    expect(screen.queryByText("AI 코멘트")).not.toBeInTheDocument();
  });

  describe("full view toggle", () => {
    it("is hidden when nothing is cut off", () => {
      mockClamp(false);
      setup(day());
      expect(screen.queryByRole("button", { name: "전체 보기" })).not.toBeInTheDocument();
    });

    it("appears only when text overflows and expands inside the panel", () => {
      mockClamp(true);
      setup(day());

      const toggle = screen.getByRole("button", { name: "전체 보기" });
      fireEvent.click(toggle);

      expect(screen.getByRole("button", { name: "접기" })).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("퇴근길에 이어폰을 끼고 한강까지 걸었다").className).not.toContain("line-clamp");
    });

    it("collapses again", () => {
      mockClamp(true);
      setup(day());

      fireEvent.click(screen.getByRole("button", { name: "전체 보기" }));
      fireEvent.click(screen.getByRole("button", { name: "접기" }));

      expect(screen.getByRole("button", { name: "전체 보기" })).toBeInTheDocument();
    });
  });

  describe("edit button", () => {
    it("shows for today's record when an edit path is given", () => {
      setup(day({ isToday: true }), "/record?edit");
      expect(screen.getByRole("link", { name: "수정" })).toHaveAttribute("href", "/record?edit");
    });

    it("does not show for a past record", () => {
      setup(day({ isToday: false }), "/record?edit");
      expect(screen.queryByRole("link", { name: "수정" })).not.toBeInTheDocument();
    });

    it("does not show without an edit path", () => {
      setup(day({ isToday: true }));
      expect(screen.queryByRole("link", { name: "수정" })).not.toBeInTheDocument();
    });
  });
});

describe("SelectedDayPanel without a record", () => {
  it("invites recording today", () => {
    setup(day({ dateKey: "2026-10-14", record: null, isToday: true }));

    expect(screen.getByText("오늘의 기록이 아직 없어요")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "기록하기" })).toHaveAttribute("href", "/record");
  });

  it("offers nothing for a past day", () => {
    setup(day({ record: null }), "/record?edit");

    expect(screen.getByText("기록 없는 날")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
