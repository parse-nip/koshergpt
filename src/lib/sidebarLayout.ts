const STORAGE_KEY = 'koshergpt-sidebar-width-px';

export const SIDEBAR_WIDTH_DEFAULT = 288;
export const SIDEBAR_WIDTH_MIN = 208;

export function clampSidebarWidth(width: number, windowWidth: number): number {
  const max = Math.min(560, Math.max(320, Math.floor(windowWidth * 0.55)));
  const min = Math.min(SIDEBAR_WIDTH_MIN, max);
  return Math.round(Math.min(Math.max(width, min), max));
}

export function loadSidebarWidth(): number {
  if (typeof window === 'undefined') return SIDEBAR_WIDTH_DEFAULT;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SIDEBAR_WIDTH_DEFAULT;

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return SIDEBAR_WIDTH_DEFAULT;

    return clampSidebarWidth(parsed, window.innerWidth);
  } catch {
    return SIDEBAR_WIDTH_DEFAULT;
  }
}

export function saveSidebarWidth(width: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(width));
  } catch {
    /* quota / private mode */
  }
}
