"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getCompareList,
  addToCompare,
  removeFromCompare,
  clearCompare,
  MAX_COMPARE,
} from "@/lib/compare-store";

export function useCompareList() {
  const [list, setList] = useState<string[]>([]);

  const refresh = useCallback(() => setList(getCompareList()), []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("storage", onChange);
    window.addEventListener("compare-list-changed", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("compare-list-changed", onChange);
    };
  }, [refresh]);

  return {
    list,
    max: MAX_COMPARE,
    add: (addr: string) => {
      const ok = addToCompare(addr);
      refresh();
      return ok;
    },
    remove: (addr: string) => {
      removeFromCompare(addr);
      refresh();
    },
    clear: () => {
      clearCompare();
      refresh();
    },
    has: (addr: string) => list.includes(addr),
  };
}
