const STORAGE_KEY = "whale-watcher-nicknames";

export function getNicknames(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getNickname(address: string): string | null {
  return getNicknames()[address] || null;
}

export function setNickname(address: string, name: string) {
  const nicks = getNicknames();
  if (name.trim()) {
    nicks[address] = name.trim();
  } else {
    delete nicks[address];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nicks));
}

export function removeNickname(address: string) {
  const nicks = getNicknames();
  delete nicks[address];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nicks));
}
