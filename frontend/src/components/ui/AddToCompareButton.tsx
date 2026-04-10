"use client";

import { useCompareList } from "@/hooks/useCompareList";
import { GitCompareArrows, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  address: string;
  variant?: "icon" | "button";
}

export default function AddToCompareButton({ address, variant = "icon" }: Props) {
  const { list, add, remove, max } = useCompareList();
  const isIn = list.includes(address);
  const isFull = !isIn && list.length >= max;

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isIn) remove(address);
    else add(address);
  };

  if (variant === "button") {
    return (
      <button
        onClick={toggle}
        disabled={isFull}
        title={
          isFull
            ? `Compare list is full (${max} max)`
            : isIn
              ? "Remove from compare"
              : "Add to compare"
        }
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all border",
          isIn
            ? "border-accent/40 bg-accent/15 text-accent"
            : "border-border text-fg-muted hover:text-accent hover:border-accent",
          isFull && !isIn && "opacity-40 cursor-not-allowed"
        )}
      >
        {isIn ? <Check size={11} /> : <GitCompareArrows size={11} />}
        {isIn ? "In Compare" : "Compare"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={isFull}
      title={
        isFull
          ? `Compare list is full (${max} max)`
          : isIn
            ? "Remove from compare"
            : "Add to compare"
      }
      className={cn(
        "p-1 transition-colors",
        isIn
          ? "text-accent"
          : "text-fg-subtle hover:text-accent",
        isFull && !isIn && "opacity-30 cursor-not-allowed"
      )}
    >
      {isIn ? <Check size={12} /> : <GitCompareArrows size={12} />}
    </button>
  );
}
