"use client";

import { cn, tierColor, tierEmoji } from "@/lib/utils";

interface TierBadgeProps {
  tier: string;
  size?: "sm" | "md" | "lg";
}

export default function TierBadge({ tier, size = "md" }: TierBadgeProps) {
  const sizeClasses = {
    sm: "text-[9px] px-1.5 py-0.5",
    md: "text-[10px] px-2 py-0.5",
    lg: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-black uppercase tracking-[0.15em] border",
        tierColor(tier),
        sizeClasses[size],
        tier === "leviathan"
          ? "border-tier-leviathan/30 bg-red-dim"
          : tier === "whale"
            ? "border-tier-whale/30 bg-tier-whale/10"
            : tier === "shark"
              ? "border-tier-shark/30 bg-tier-shark/10"
              : tier === "dolphin"
                ? "border-tier-dolphin/30 bg-tier-dolphin/10"
                : "border-border bg-bg-elevated"
      )}
    >
      {tierEmoji(tier)} {tier}
    </span>
  );
}
