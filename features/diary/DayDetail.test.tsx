import { render, screen } from "@testing-library/react";
import { DayDetail } from "./DayDetail";
import type { MusicRecord } from "@/entities/record/types";

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
    ...overrides,
  };
}

describe("DayDetail", () => {
  it("shows an empty message when there are no records", () => {
    render(<DayDetail records={[]} />);
    expect(screen.getByText("이 날은 기록이 없어요.")).toBeInTheDocument();
  });

  it("renders track info and mood label", () => {
    render(<DayDetail records={[makeRecord()]} />);
    expect(screen.getByText("Next Level")).toBeInTheDocument();
    expect(screen.getByText("aespa")).toBeInTheDocument();
    expect(screen.getByText("신나는")).toBeInTheDocument();
  });

  it("shows the memo when present", () => {
    render(<DayDetail records={[makeRecord({ memo: "좋았다" })]} />);
    expect(screen.getByText("좋았다")).toBeInTheDocument();
  });

  it("shows a placeholder when ai_comment is null", () => {
    render(<DayDetail records={[makeRecord()]} />);
    expect(
      screen.getByText("AI 코멘트는 아직 준비 중이에요."),
    ).toBeInTheDocument();
  });

  it("renders multiple records for the same day", () => {
    render(
      <DayDetail
        records={[
          makeRecord({ id: "1", track_name: "Track A" }),
          makeRecord({ id: "2", track_name: "Track B" }),
        ]}
      />,
    );
    expect(screen.getByText("Track A")).toBeInTheDocument();
    expect(screen.getByText("Track B")).toBeInTheDocument();
  });
});
