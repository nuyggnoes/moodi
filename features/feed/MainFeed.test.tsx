import { render, screen, fireEvent } from "@testing-library/react";
import { MainFeed } from "./MainFeed";
import { useTodayFeed } from "./useTodayFeed";
import type { TodayFeed } from "./useTodayFeed";
import type { MusicRecord } from "@/entities/record/types";

jest.mock("./useTodayFeed", () => ({
  useTodayFeed: jest.fn(),
}));

const mockedUseTodayFeed = useTodayFeed as jest.Mock;

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

function mockFeed(feed: TodayFeed) {
  mockedUseTodayFeed.mockReturnValue({ data: feed });
}

describe("MainFeed", () => {
  beforeAll(() => {
    window.HTMLMediaElement.prototype.play = jest.fn();
    window.HTMLMediaElement.prototype.pause = jest.fn();
  });

  it("shows the record CTA when there is no record today", () => {
    mockFeed({ myRecord: null, friends: [] });
    render(<MainFeed userId="u1" />);

    expect(screen.getByRole("link", { name: "기록하기" })).toBeInTheDocument();
  });

  it("shows today's record card when a record exists", () => {
    mockFeed({ myRecord: makeRecord(), friends: [] });
    render(<MainFeed userId="u1" />);

    expect(screen.getByText("Next Level")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "기록하기" })).not.toBeInTheDocument();
  });

  it("hides the avatar strip entirely when there are no followed friends", () => {
    mockFeed({ myRecord: null, friends: [] });
    render(<MainFeed userId="u1" />);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows the avatar strip when there are followed friends", () => {
    mockFeed({
      myRecord: null,
      friends: [{ id: "f1", nickname: "다은", avatarUrl: null, record: null }],
    });
    render(<MainFeed userId="u1" />);

    expect(screen.getByText("다은")).toBeInTheDocument();
  });

  it("stops my own playback when a friend's preview sheet opens", () => {
    mockFeed({
      myRecord: makeRecord(),
      friends: [
        { id: "f1", nickname: "다은", avatarUrl: null, record: makeRecord({ id: "2", user_id: "f1" }) },
      ],
    });
    render(<MainFeed userId="u1" />);

    fireEvent.click(screen.getByRole("button", { name: "Next Level 재생" }));
    expect(screen.getByRole("button", { name: "Next Level 정지" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다은의 오늘 기록 보기" }));

    expect(screen.getByRole("button", { name: "Next Level 재생" })).toBeInTheDocument();
  });
});
