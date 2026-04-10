"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Check } from "lucide-react";
import { useGroups } from "@/hooks/useGroups";
import { getGroupsForAddress } from "@/lib/groups-store";
interface AddToGroupMenuProps {
  address: string;
}

export default function AddToGroupMenu({ address }: AddToGroupMenuProps) {
  const { groups, addTrader, removeTrader, create } = useGroups();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const memberOf = getGroupsForAddress(address);
  const memberIds = new Set(memberOf.map((g) => g.id));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1 text-text-muted hover:text-accent transition-colors"
        title="Add to group"
      >
        <Plus size={12} />
      </button>

      
        {open && (
          <div
            className="absolute right-0 top-full mt-1 w-48 bg-bg-card border border-border shadow-2xl z-50"
          >
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[9px] text-text-muted font-bold tracking-[0.2em]">
                GROUPS
              </p>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {groups.map((group) => {
                const isMember = memberIds.has(group.id);
                return (
                  <button
                    key={group.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isMember) removeTrader(group.id, address);
                      else addTrader(group.id, address);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] hover:bg-bg-card-hover transition-colors"
                  >
                    <div
                      className="w-1.5 h-1.5 shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="truncate text-text-primary font-medium">
                      {group.name}
                    </span>
                    {isMember && (
                      <Check size={10} className="ml-auto text-green shrink-0" />
                    )}
                  </button>
                );
              })}
              {groups.length === 0 && (
                <p className="text-[10px] text-text-muted px-3 py-2">
                  no groups
                </p>
              )}
            </div>
            <div className="p-2 border-t border-border">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newName.trim()) {
                    const g = create(newName.trim());
                    addTrader(g.id, address);
                    setNewName("");
                  }
                }}
                placeholder="new group..."
                className="w-full px-2 py-1 bg-bg-elevated border border-border text-[10px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent font-mono"
              />
            </div>
          </div>
        )}
      
    </div>
  );
}
