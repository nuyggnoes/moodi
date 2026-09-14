const STORAGE_KEY = "moodi:recentSearches";
const MAX_ITEMS = 5;

/**
 * localStorage 값의 인메모리 캐시.
 * `useSyncExternalStore`는 스냅샷이 안정적인(내용이 안 바뀌면 같은 참조를 반환하는)
 * 함수를 요구하므로, 실제로 바뀔 때만 새 배열을 만든다.
 */
let cached: string[] | null = null;
const listeners = new Set<() => void>();

function readFromStorage(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function writeToStorage(items: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // 프라이빗 브라우징 등으로 접근 실패 — 조용히 무시
  }
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeRecentSearches(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecentSearches(): string[] {
  if (cached === null) {
    cached = readFromStorage();
  }
  return cached;
}

/** 검색어를 최근 검색어 맨 앞으로 올린다. 대소문자 무시 중복 제거, 최대 5개. */
export function addRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;

  const existing = getRecentSearches();
  const deduped = existing.filter(
    (item) => item.toLowerCase() !== trimmed.toLowerCase(),
  );
  const next = [trimmed, ...deduped].slice(0, MAX_ITEMS);

  cached = next;
  writeToStorage(next);
  notify();
}

/** 테스트 전용: 모듈 스코프 캐시를 초기화한다. */
export function __resetRecentSearchesCacheForTests(): void {
  cached = null;
}
