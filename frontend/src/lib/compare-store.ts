/**
 * Persistent compare basket — survives navigation between pages.
 *
 * Lives in localStorage like the groups and nicknames stores. Limited to
 * MAX_COMPARE addresses so the comparison view stays readable.
 */

const STORAGE_KEY = "whale-watcher-compare";
export const MAX_COMPARE = 5;

export function getCompareList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(list: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  // Notify same-tab listeners (storage event only fires cross-tab)
  window.dispatchEvent(new CustomEvent("compare-list-changed"));
}

export function addToCompare(address: string): boolean {
  const list = getCompareList();
  if (list.includes(address)) return false;
  if (list.length >= MAX_COMPARE) return false;
  list.push(address);
  save(list);
  return true;
}

export function removeFromCompare(address: string) {
  save(getCompareList().filter((a) => a !== address));
}

export function clearCompare() {
  save([]);
}

export function isInCompare(address: string): boolean {
  return getCompareList().includes(address);
}
