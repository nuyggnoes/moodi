/** 이 거리(포스터 수)를 넘으면 숨기고 눌리지 않게 한다. */
const MAX_VISIBLE_DISTANCE = 3;

/** 이 값(px)을 넘겨 끌어야 다음/이전 포스터로 넘어간다. */
const SWIPE_THRESHOLD_PX = 50;

export type PosterTransform = {
  /** 가로 이동 (px) */
  x: number;
  /** 깊이 (px, 음수일수록 멀리) */
  z: number;
  /** Y축 회전 (deg) */
  rotateY: number;
  scale: number;
  opacity: number;
  zIndex: number;
  /** false 이면 숨기고 포인터 이벤트를 받지 않는다 */
  visible: boolean;
};

/**
 * 코버플로 배치 계산. `offset` 은 가운데 포스터 기준 거리(왼쪽 음수, 오른쪽 양수).
 * 간격은 무대 폭에 비례하되 150~250px 로 제한한다 (docs/design/home-mockup.html 과 같은 값).
 */
export function getPosterTransform(offset: number, stageWidth: number): PosterTransform {
  const distance = Math.abs(offset);
  const gap = Math.max(150, Math.min(250, stageWidth / 4.2));

  if (offset === 0) {
    return { x: 0, z: 0, rotateY: 0, scale: 1, opacity: 1, zIndex: 20, visible: true };
  }

  const visible = distance <= MAX_VISIBLE_DISTANCE;
  return {
    x: Math.sign(offset) * (gap * 1.05 + (distance - 1) * gap * 0.62),
    z: -120 - (distance - 1) * 60,
    rotateY: -Math.sign(offset) * 34,
    scale: Math.max(0.6, 0.84 - (distance - 1) * 0.07),
    opacity: visible ? 0.88 - (distance - 1) * 0.2 : 0,
    zIndex: 20 - distance,
    visible,
  };
}

/** 가로 드래그 거리(`dx`, 왼쪽이 음수)로 이동할 인덱스를 정한다. 범위를 벗어나지 않는다. */
export function swipeTarget(dx: number, index: number, maxIndex: number): number {
  if (Math.abs(dx) <= SWIPE_THRESHOLD_PX) return index;
  const next = index + (dx < 0 ? 1 : -1);
  return Math.max(0, Math.min(maxIndex, next));
}
