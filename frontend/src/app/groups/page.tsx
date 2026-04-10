"use client";

import { useGroups } from "@/hooks/useGroups";
import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Users } from "lucide-react";

export default function GroupsPage() {
  const { groups, create, remove } = useGroups();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = () => {
    if (newName.trim()) {
      create(newName.trim());
      setNewName("");
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-text-primary tracking-tight">
            GROUPS
          </h2>
          <p className="text-[11px] text-text-muted tracking-wider mt-1">
            GROUP & ANALYZE TRADERS TOGETHER
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-3 py-2 bg-accent text-black text-[10px] font-black tracking-wider hover:bg-accent-hover transition-colors"
        >
          <Plus size={12} />
          NEW
        </button>
      </div>

      
        {creating && (
          <div
            className="overflow-hidden"
          >
            <div className="card p-4 flex items-center gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="group name..."
                autoFocus
                className="flex-1 px-3 py-2 bg-bg-elevated border border-border text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent font-mono"
              />
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-accent text-black text-[10px] font-black tracking-wider hover:bg-accent-hover transition-colors"
              >
                CREATE
              </button>
              <button
                onClick={() => {
                  setCreating(false);
                  setNewName("");
                }}
                className="px-4 py-2 border border-border text-text-secondary hover:text-text-primary text-[10px] font-bold tracking-wider transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
      

      {groups.length === 0 && !creating ? (
        <div className="card p-12 text-center">
          <Users size={32} className="mx-auto text-text-muted mb-3" strokeWidth={1} />
          <h3 className="text-sm font-black text-text-primary mb-1">
            NO GROUPS
          </h3>
          <p className="text-[11px] text-text-muted tracking-wider mb-4">
            CREATE ONE TO START TRACKING GROUPS OF TRADERS
          </p>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-accent text-black text-[10px] font-black tracking-wider hover:bg-accent-hover transition-colors"
          >
            CREATE GROUP
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {groups.map((group, i) => (
            <div
              key={group.id}
            >
              <Link
                href={`/groups/${group.id}`}
                className="card card-hover neon-border block p-4 group transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2 h-2"
                      style={{ backgroundColor: group.color }}
                    />
                    <h3 className="text-xs font-black text-text-primary tracking-wide uppercase">
                      {group.name}
                    </h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm("Delete this group?")) {
                        remove(group.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted tracking-wider">
                  <Users size={10} />
                  {group.addresses.length} TRADERS
                </div>
                {group.addresses.length > 0 && (
                  <div className="mt-3 flex gap-1 flex-wrap">
                    {group.addresses.slice(0, 4).map((addr) => (
                      <span
                        key={addr}
                        className="text-[9px] px-1.5 py-0.5 bg-bg-elevated border border-border text-text-muted font-mono"
                      >
                        {addr.slice(0, 4)}...{addr.slice(-4)}
                      </span>
                    ))}
                    {group.addresses.length > 4 && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-bg-elevated text-text-muted">
                        +{group.addresses.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
