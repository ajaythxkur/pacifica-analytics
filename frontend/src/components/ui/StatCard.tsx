"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon?: ReactNode;
  className?: string;
}

export default function StatCard({
  label,
  value,
  change,
  positive,
  icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "card p-4 neon-border transition-all duration-200 fade-in",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-text-muted font-bold tracking-[0.2em] uppercase">
          {label}
        </span>
        {icon && <span className="text-text-muted opacity-50">{icon}</span>}
      </div>
      <div className="text-lg font-black text-text-primary tracking-tight">
        {value}
      </div>
      {change && (
        <span
          className={cn(
            "text-[11px] mt-1 inline-block font-semibold",
            positive ? "text-green" : "text-red"
          )}
        >
          {change}
        </span>
      )}
    </div>
  );
}
