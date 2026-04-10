"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type WatchGroup,
  getGroups,
  createGroup,
  deleteGroup,
  renameGroup,
  addToGroup,
  removeFromGroup,
  updateGroupColor,
} from "@/lib/groups-store";

export function useGroups() {
  const [groups, setGroups] = useState<WatchGroup[]>([]);

  const refresh = useCallback(() => {
    setGroups(getGroups());
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  return {
    groups,
    create: (name: string) => {
      const g = createGroup(name);
      refresh();
      return g;
    },
    remove: (id: string) => {
      deleteGroup(id);
      refresh();
    },
    rename: (id: string, name: string) => {
      renameGroup(id, name);
      refresh();
    },
    addTrader: (groupId: string, address: string) => {
      addToGroup(groupId, address);
      refresh();
    },
    removeTrader: (groupId: string, address: string) => {
      removeFromGroup(groupId, address);
      refresh();
    },
    setColor: (id: string, color: string) => {
      updateGroupColor(id, color);
      refresh();
    },
  };
}
