export interface WatchGroup {
  id: string;
  name: string;
  color: string;
  addresses: string[];
  createdAt: number;
}

const STORAGE_KEY = "whale-watcher-groups";

const GROUP_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#22c55e", "#38bdf8", "#ef4444", "#14b8a6",
];

export function getGroups(): WatchGroup[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGroups(groups: WatchGroup[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function createGroup(name: string): WatchGroup {
  const groups = getGroups();
  const group: WatchGroup = {
    id: crypto.randomUUID(),
    name,
    color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
    addresses: [],
    createdAt: Date.now(),
  };
  groups.push(group);
  saveGroups(groups);
  return group;
}

export function deleteGroup(id: string) {
  const groups = getGroups().filter((g) => g.id !== id);
  saveGroups(groups);
}

export function renameGroup(id: string, name: string) {
  const groups = getGroups();
  const group = groups.find((g) => g.id === id);
  if (group) {
    group.name = name;
    saveGroups(groups);
  }
}

export function addToGroup(groupId: string, address: string) {
  const groups = getGroups();
  const group = groups.find((g) => g.id === groupId);
  if (group && !group.addresses.includes(address)) {
    group.addresses.push(address);
    saveGroups(groups);
  }
}

export function removeFromGroup(groupId: string, address: string) {
  const groups = getGroups();
  const group = groups.find((g) => g.id === groupId);
  if (group) {
    group.addresses = group.addresses.filter((a) => a !== address);
    saveGroups(groups);
  }
}

export function getGroupsForAddress(address: string): WatchGroup[] {
  return getGroups().filter((g) => g.addresses.includes(address));
}

export function updateGroupColor(id: string, color: string) {
  const groups = getGroups();
  const group = groups.find((g) => g.id === id);
  if (group) {
    group.color = color;
    saveGroups(groups);
  }
}
