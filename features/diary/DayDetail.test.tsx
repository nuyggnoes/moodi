import { render as rtlRender, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DayDetail } from "./DayDetail";
import type { MusicRecord } from "@/entities/record/types";

function render(ui: React.ReactElement) {
  return rtlRender(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
  );
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
    created_at: "2026-09-14T00:00:00Z",
    record_date: "2026-09-14",
    ...overrides,
  };
}

const TODAY = "2026-09-14";

type Props = Partial<React.ComponentProps<typeof DayDetail>>;

function renderDetail(props: Props = {}) {
  return render(
    <DayDetail
      record={makeRecord()}
      dateKey="2026-09-10"
      todayKey={TODAY}
      isCurrentMonth
      {...props}
    />,
  );
}

describe("DayDetail", () => {
  it("renders track info and mood label", () => {
    renderDetail();
    expect(screen.getByText("Next Level")).toBeInTheDocument();
    expect(screen.getByText("aespa")).toBeInTheDocument();
    expect(screen.getByText("신나는")).toBeInTheDocument();
  });

  it("shows the memo when present", () => {
    renderDetail({ record: makeRecord({ memo: "좋았다" }) });
    expect(screen.getByText("좋았다")).toBeInTheDocument();
  });

  it("shows the AI comment when it exists", () => {
    renderDetail({
      record: makeRecord({
        memo: "퇴근길에 마음이 풀렸다",
        ai_comment: "마음이 풀리던 퇴근길이에요",
      }),
    });
    expect(screen.getByText("마음이 풀리던 퇴근길이에요")).toBeInTheDocument();
  });

  it("shows no comment box for a record without a memo", () => {
    renderDetail();
    expect(screen.queryByText(/코멘트/)).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("offers to fetch a comment for an older record that has a memo but no comment", () => {
    renderDetail({ record: makeRecord({ memo: "퇴근길에 마음이 풀렸다" }) });
    expect(
      screen.getByRole("button", { name: "코멘트 받기" }),
    ).toBeInTheDocument();
  });

  it("shows when the record was made and where the mood came from", () => {
    renderDetail({
      record: makeRecord({
        created_at: "2026-09-10T08:40:00Z",
        mood_source: "ai",
      }),
    });
    expect(screen.getByText(/오후 5:40 기록/)).toHaveTextContent(
      "AI 제안을 선택했어요",
    );
  });

  describe("edit link", () => {
    it("is shown on today's record", () => {
      renderDetail({ dateKey: TODAY });
      expect(screen.getByRole("link", { name: "수정" })).toHaveAttribute(
        "href",
        "/record?edit=1",
      );
    });

    it("is not shown on a past record", () => {
      renderDetail({ dateKey: "2026-09-10" });
      expect(
        screen.queryByRole("link", { name: "수정" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("empty states", () => {
    it("invites recording on an empty today", () => {
      renderDetail({ record: null, dateKey: TODAY });
      expect(screen.getByText("오늘의 기록이 아직 없어요")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "기록하기" })).toHaveAttribute(
        "href",
        "/record",
      );
    });

    it("shows a plain message on an empty past day", () => {
      renderDetail({ record: null, dateKey: "2026-09-03" });
      expect(screen.getByText("이 날은 기록이 없어요.")).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("says a future day has not come yet", () => {
      renderDetail({ record: null, dateKey: "2026-09-20" });
      expect(screen.getByText("아직 오지 않은 날이에요")).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("invites recording when the current month is empty", () => {
      renderDetail({ record: null, dateKey: null, isCurrentMonth: true });
      expect(screen.getByText("이 달은 기록이 없어요.")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "기록하기" }),
      ).toBeInTheDocument();
    });

    it("has no call to action when a past month is empty", () => {
      renderDetail({ record: null, dateKey: null, isCurrentMonth: false });
      expect(screen.getByText("이 달은 기록이 없어요.")).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });
});
