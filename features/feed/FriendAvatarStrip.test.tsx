import { render, screen, fireEvent } from "@testing-library/react";
import { FriendAvatarStrip } from "./FriendAvatarStrip";
import type { FriendToday } from "./useTodayFeed";
import type { MusicRecord } from "@/entities/record/types";

function makeRecord(overrides: Partial<MusicRecord> = {}): MusicRecord {
  return {
    id: "r1",
    user_id: "f1",
    track_id: "t1",
    track_name: "Next Level",
    artist: "aespa",
    album_art: null,
    preview_url: null,
    mood: "energetic",
    mood_source: "user",
    memo: null,
    ai_comment: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeFriend(overrides: Partial<FriendToday> = {}): FriendToday {
  return {
    id: "f1",
    nickname: "다은",
    avatarUrl: null,
    record: null,
    ...overrides,
  };
}

describe("FriendAvatarStrip", () => {
  it("renders a non-interactive avatar for a friend with no record today", () => {
    render(<FriendAvatarStrip friends={[makeFriend()]} />);

    expect(
      screen.queryByRole("button", { name: /다은/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("다은")).toBeInTheDocument();
  });

  it("opens a bottom sheet preview when tapping a friend who recorded today", () => {
    const friend = makeFriend({ record: makeRecord() });
    render(<FriendAvatarStrip friends={[friend]} />);

    fireEvent.click(screen.getByRole("button", { name: "다은의 오늘 기록 보기" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Next Level")).toBeInTheDocument();
  });

  it("links to the friend's profile (전체보기) from inside the preview", () => {
    const friend = makeFriend({ record: makeRecord() });
    render(<FriendAvatarStrip friends={[friend]} />);

    fireEvent.click(screen.getByRole("button", { name: "다은의 오늘 기록 보기" }));

    expect(screen.getByRole("link")).toHaveAttribute("href", "/profile/f1");
  });

  it("notifies the parent (to stop playback) when a preview opens", () => {
    const onOpenPreview = jest.fn();
    const friend = makeFriend({ record: makeRecord() });
    render(<FriendAvatarStrip friends={[friend]} onOpenPreview={onOpenPreview} />);

    fireEvent.click(screen.getByRole("button", { name: "다은의 오늘 기록 보기" }));

    expect(onOpenPreview).toHaveBeenCalledTimes(1);
  });

  it("closes the preview when the backdrop is tapped", () => {
    const friend = makeFriend({ record: makeRecord() });
    render(<FriendAvatarStrip friends={[friend]} />);

    fireEvent.click(screen.getByRole("button", { name: "다은의 오늘 기록 보기" }));
    fireEvent.click(screen.getByTestId("bottom-sheet-backdrop"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
