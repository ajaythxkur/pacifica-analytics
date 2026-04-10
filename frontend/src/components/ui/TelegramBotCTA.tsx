"use client";

import { useEffect, useState } from "react";
import { getTelegramInfo, type TelegramInfo } from "@/lib/api";
import { Send, ArrowRight, Users } from "lucide-react";

/**
 * Banner shown on the Whale Alerts page that promotes the Telegram bot.
 * Hidden entirely when the bot is not configured (TELEGRAM_BOT_TOKEN
 * unset on the backend).
 */
export default function TelegramBotCTA() {
  const [info, setInfo] = useState<TelegramInfo | null>(null);

  useEffect(() => {
    getTelegramInfo()
      .then((r) => setInfo(r.data))
      .catch(() => setInfo(null));
  }, []);

  if (!info || !info.enabled || !info.username) return null;

  const link = `https://t.me/${info.username}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="card flex items-center gap-4 p-4 group hover:border-accent/40 transition-all relative overflow-hidden"
    >
      {/* Decorative glow */}
      <div
        aria-hidden
        className="absolute inset-0 -z-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background:
            "radial-gradient(ellipse at left, var(--accent-dim), transparent 60%)",
        }}
      />

      <div className="relative w-11 h-11 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
        <Send size={18} className="text-accent" strokeWidth={2.2} />
      </div>

      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-fg">
            Get whale alerts on Telegram
          </span>
          {info.subscribers > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-fg-subtle bg-surface-elevated border border-border-subtle">
              <Users size={9} /> {info.subscribers}
            </span>
          )}
        </div>
        <p className="text-[12px] text-fg-subtle mt-0.5">
          Subscribe to <code className="text-accent font-semibold">@{info.username}</code>{" "}
          and get a DM when whales open large positions. Set your own
          minimum size and symbol filters with <code>/setmin</code> and{" "}
          <code>/symbols</code>.
        </p>
      </div>

      <div className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-fg text-xs font-semibold shrink-0 group-hover:bg-accent-hover transition-colors">
        Open bot
        <ArrowRight size={12} />
      </div>
    </a>
  );
}
