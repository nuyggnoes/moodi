import { act, fireEvent, render, screen } from "@testing-library/react";
import { WeekCarousel } from "./WeekCarousel";
import { groupRecordsByKstDay } from "./weekDays";
import type { MusicRecord } from "@/entities/record/types";

// jsdom 은 PointerEvent 의 좌표를 지원하지 않아 MouseEvent 로 대신한다.
beforeAll(() => {
  class FakePointerEvent extends MouseEvent {}
  Object.defineProperty(window, "PointerEvent", { value: FakePointerEvent, configurable: true });
  window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = jest.fn();
});

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
    preview_url: `https://example.com/${day}.m4a`,
    mood: "calm",
    mood_source: "user",
    memo: null,
    ai_comment: null,
    created_at: created,
    record_date: created.slice(0, 10),
    ...overrides,
  };
}

// 10.08~10.14 중 10.10(index 2)은 기록 없음, 오늘(10.14)도 기록 없음
const records = [
  makeRecord(8, { mood: "exciting" }),
  makeRecord(9, { mood: "energetic" }),
  makeRecord(11),
  makeRecord(12),
  makeRecord(13),
];
const days = groupRecordsByKstDay(records, NOW);

function setup(selectedIndex = 6) {
  const onSelect = jest.fn();
  const view = render(<WeekCarousel days={days} selectedIndex={selectedIndex} onSelect={onSelect} />);
  const region = screen.getByRole("region", { name: "최근 7일의 음악 기록" });
  return { onSelect, region, ...view };
}

function bleedColor(container: HTMLElement) {
  return (container.querySelector(".mood-bleed") as HTMLElement).style.getPropertyValue("--bleed");
}

describe("WeekCarousel", () => {
  it("renders 7 posters and a date strip, with only the selected poster readable", () => {
    setup(4);

    expect(screen.getAllByRole("tab")).toHaveLength(7);
    // 가운데(10.12, 곡12)의 재생 버튼만 접근성 트리에 남는다
    expect(screen.getByRole("button", { name: "곡12 미리듣기" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "곡11 미리듣기" })).not.toBeInTheDocument();
  });

  it("shows today's CTA poster as the entry when today is selected", () => {
    setup(6);
    expect(screen.getByRole("link", { name: "오늘 기록하기" })).toHaveAttribute("href", "/record");
  });

  describe("navigation", () => {
    it("moves with the previous/next buttons", () => {
      const { onSelect } = setup(3);

      fireEvent.click(screen.getByRole("button", { name: "이전 날" }));
      fireEvent.click(screen.getByRole("button", { name: "다음 날" }));

      expect(onSelect).toHaveBeenNthCalledWith(1, 2);
      expect(onSelect).toHaveBeenNthCalledWith(2, 4);
    });

    it("disables the buttons at both ends", () => {
      const { unmount } = setup(0);
      expect(screen.getByRole("button", { name: "이전 날" })).toBeDisabled();
      unmount();

      setup(6);
      expect(screen.getByRole("button", { name: "다음 날" })).toBeDisabled();
    });

    it("moves with the arrow, Home and End keys while focused", () => {
      const { onSelect, region } = setup(3);

      fireEvent.keyDown(region, { key: "ArrowLeft" });
      fireEvent.keyDown(region, { key: "ArrowRight" });
      fireEvent.keyDown(region, { key: "Home" });
      fireEvent.keyDown(region, { key: "End" });

      expect(onSelect.mock.calls.map(([i]) => i)).toEqual([2, 4, 0, 6]);
    });

    it("does not react to keys pressed outside the carousel", () => {
      const { onSelect } = setup(3);

      fireEvent.keyDown(document.body, { key: "ArrowLeft" });

      expect(onSelect).not.toHaveBeenCalled();
    });

    it("selects from the date strip", () => {
      const { onSelect } = setup(6);

      fireEvent.click(screen.getByRole("tab", { name: "10.09 금요일" }));

      expect(onSelect).toHaveBeenCalledWith(1);
    });

    it("brings a side poster to the center when it is clicked", () => {
      const { onSelect } = setup(3);

      fireEvent.click(screen.getByText("곡13"));

      expect(onSelect).toHaveBeenCalledWith(5);
    });

    it("does not select anything when the already selected index is requested", () => {
      const { onSelect, region } = setup(0);

      fireEvent.keyDown(region, { key: "ArrowLeft" });

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("dragging", () => {
    function drag(region: HTMLElement, from: number, to: number) {
      fireEvent.pointerDown(region, { clientX: from });
      fireEvent.pointerMove(window, { clientX: to });
      fireEvent.pointerUp(window, { clientX: to });
    }

    it("moves to the next poster on a leftward drag and the previous on a rightward drag", () => {
      const { onSelect, region } = setup(3);

      drag(region, 400, 300);
      drag(region, 300, 400);

      expect(onSelect.mock.calls.map(([i]) => i)).toEqual([4, 2]);
    });

    it("ignores small movements", () => {
      const { onSelect, region } = setup(3);

      drag(region, 400, 380);

      expect(onSelect).not.toHaveBeenCalled();
    });

    it("does not treat the click that follows a drag as a poster click", () => {
      const { onSelect, region } = setup(6);

      // 마지막 칸에서 왼쪽으로 끌면 이동할 곳이 없어 onSelect 가 불리지 않는다.
      drag(region, 400, 330);
      // 이어지는 click 이 옆 포스터(곡13)를 중앙으로 가져오면 안 된다.
      fireEvent.click(screen.getByText("곡13"));

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("preview playback", () => {
    beforeEach(() => jest.clearAllMocks());

    it("plays the centered poster's preview and stops on the second click", async () => {
      setup(4);
      const button = screen.getByRole("button", { name: "곡12 미리듣기" });

      await act(async () => {
        fireEvent.click(button);
      });
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "곡12 정지" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "곡12 정지" }));
      expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "곡12 미리듣기" })).toBeInTheDocument();
    });

    it("stops playback when the selection changes", async () => {
      setup(4);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "곡12 미리듣기" }));
      });
      (window.HTMLMediaElement.prototype.pause as jest.Mock).mockClear();

      fireEvent.click(screen.getByRole("button", { name: "다음 날" }));

      expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    });

    it("recovers when the browser refuses to play", async () => {
      (window.HTMLMediaElement.prototype.play as jest.Mock).mockRejectedValueOnce(new Error("blocked"));
      setup(4);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "곡12 미리듣기" }));
      });

      expect(screen.getByRole("button", { name: "곡12 미리듣기" })).toBeInTheDocument();
    });
  });

  describe("background bleed", () => {
    it("follows the selected poster's mood color", () => {
      const { container, rerender } = setup(0);
      expect(bleedColor(container)).toBe("#e8a7c4"); // exciting

      rerender(<WeekCarousel days={days} selectedIndex={1} onSelect={jest.fn()} />);
      expect(bleedColor(container)).toBe("#e8b175"); // energetic
    });

    it("falls back to the accent color on days without a record", () => {
      const { container } = setup(2);
      expect(bleedColor(container)).toBe("#baa7e0");
    });
  });
});
