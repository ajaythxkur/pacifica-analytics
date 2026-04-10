import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatUSD(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
}

export function formatPnL(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}$${formatUSD(value)}`;
}

export function formatPercent(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

export function pnlColor(value: number): string {
  if (value > 0) return "text-green";
  if (value < 0) return "text-red";
  return "text-text-secondary";
}

export function pnlBg(value: number): string {
  if (value > 0) return "bg-green-dim";
  if (value < 0) return "bg-red-dim";
  return "bg-bg-elevated";
}

export function tierColor(tier: string): string {
  const map: Record<string, string> = {
    fish: "text-tier-fish",
    dolphin: "text-tier-dolphin",
    shark: "text-tier-shark",
    whale: "text-tier-whale",
    leviathan: "text-tier-leviathan",
  };
  return map[tier] || "text-text-secondary";
}

export function tierEmoji(tier: string): string {
  const map: Record<string, string> = {
    fish: "\u{1F41F}",
    dolphin: "\u{1F42C}",
    shark: "\u{1F988}",
    whale: "\u{1F40B}",
    leviathan: "\u{1F451}",
  };
  return map[tier] || "";
}

export function tierBorderColor(tier: string): string {
  const map: Record<string, string> = {
    fish: "border-tier-fish/30",
    dolphin: "border-tier-dolphin/30",
    shark: "border-tier-shark/30",
    whale: "border-tier-whale/30",
    leviathan: "border-tier-leviathan/30",
  };
  return map[tier] || "border-border";
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
