"use client";

import { useState, useEffect } from "react";
import { shortenAddress } from "@/lib/utils";
import { getNickname, setNickname } from "@/lib/nicknames-store";
import { Pencil, Check, X } from "lucide-react";
import Link from "next/link";

interface TraderNameProps {
  address: string;
  chars?: number;
  linked?: boolean;
  editable?: boolean;
  className?: string;
}

export default function TraderName({
  address,
  chars = 6,
  linked = true,
  editable = true,
  className = "",
}: TraderNameProps) {
  const [nick, setNick] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    setNick(getNickname(address));
  }, [address]);

  const handleSave = () => {
    setNickname(address, input);
    setNick(input.trim() || null);
    setEditing(false);
  };

  const handleClear = () => {
    setNickname(address, "");
    setNick(null);
    setEditing(false);
    setInput("");
  };

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder={shortenAddress(address, chars)}
          autoFocus
          className="w-24 px-1.5 py-0.5 bg-bg-elevated border border-accent text-[11px] text-text-primary font-mono focus:outline-none"
        />
        <button onClick={handleSave} className="text-green hover:text-accent-hover">
          <Check size={10} />
        </button>
        <button onClick={() => setEditing(false)} className="text-text-muted hover:text-red">
          <X size={10} />
        </button>
      </span>
    );
  }

  const displayName = nick || shortenAddress(address, chars);
  const content = (
    <span className={`group/name inline-flex items-center gap-1.5 ${className}`}>
      <span className={linked ? "hover:text-accent transition-colors" : ""}>
        {nick ? (
          <>
            <span className="text-accent font-black">{nick}</span>
            <span className="text-text-muted text-[9px] ml-1">
              {shortenAddress(address, 3)}
            </span>
          </>
        ) : (
          displayName
        )}
      </span>
      {editable && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setInput(nick || "");
            setEditing(true);
          }}
          className="opacity-0 group-hover/name:opacity-100 text-text-muted hover:text-accent transition-all"
          title="Rename"
        >
          <Pencil size={9} />
        </button>
      )}
    </span>
  );

  if (linked) {
    return (
      <Link href={`/trader/${address}`} className="text-[11px] font-bold text-text-primary">
        {content}
      </Link>
    );
  }

  return <span className="text-[11px] font-bold text-text-primary">{content}</span>;
}
