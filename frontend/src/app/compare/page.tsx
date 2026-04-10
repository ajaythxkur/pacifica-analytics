"use client";

import { useEffect, useState } from "react";
import { compareTraders, type TraderStats } from "@/lib/api";
import { formatPnL, formatUSD, cn } from "@/lib/utils";
import TierBadge from "@/components/ui/TierBadge";
import TraderName from "@/components/ui/TraderName";
import PacificaLink from "@/components/ui/PacificaLink";
import { useCompareList } from "@/hooks/useCompareList";
import { Plus, X, GitCompareArrows, Trash2 } from "lucide-react";

const COLORS = ["#3b82f6", "#10d18a", "#a78bfa", "#fbbf24", "#f87171"];

interface BarProps {
  values: number[];
  labels: string[];
  title: string;
  format: (v: number) => string;
}

function CompareBar({ values, labels, title, format }: BarProps) {
  const max = Math.max(...values.map(Math.abs), 1);

  return (
    <div className="card p-4">
      <div className="text-[10px] text-fg-subtle font-semibold tracking-[0.15em] uppercase mb-3">
        {title}
      </div>
      <div className="space-y-2">
        {values.map((val, i) => {
          const width = Math.min((Math.abs(val) / max) * 100, 100);
          const isPositive = val >= 0;
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[10px] text-fg-subtle w-16 truncate font-mono">
                {labels[i]}
              </span>
              <div className="flex-1 h-5 bg-surface-elevated rounded-sm overflow-hidden">
                <div
                  className="h-full transition-all duration-500 ease-out rounded-sm"
                  style={{
                    width: `${width}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                    opacity: 0.8,
                  }}
                />
              </div>
              <span
                className={cn(
                  "text-[11px] font-bold w-20 text-right tabular-nums",
                  title.includes("PNL")
                    ? isPositive
                      ? "text-success"
                      : "text-danger"
                    : "text-fg"
                )}
              >
                {format(val)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { list, max, add, remove, clear } = useCompareList();
  const [traders, setTraders] = useState<TraderStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");

  // Re-fetch whenever the basket changes
  useEffect(() => {
    if (list.length === 0) {
      setTraders([]);
      return;
    }
    setLoading(true);
    compareTraders(list)
      .then((res) => setTraders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [list]);

  const handleAdd = () => {
    const v = input.trim();
    if (v.length < 8) return;
    if (add(v)) setInput("");
  };

  const labels = traders.map(
    (t) => t.address.slice(0, 4) + "..." + t.address.slice(-4)
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-fg tracking-tight">
          Compare Traders
        </h2>
        <p className="text-[12px] text-fg-subtle mt-1">
          Side-by-side performance analysis. Your selection persists across
          pages — add traders from anywhere and they&apos;ll appear here.
        </p>
      </div>

      {/* Basket controls */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-fg-subtle font-semibold uppercase tracking-wider">
            Compare Basket &middot; {list.length} / {max}
          </span>
          {list.length > 0 && (
            <button
              onClick={clear}
              className="text-[10px] text-fg-subtle hover:text-danger transition-colors inline-flex items-center gap-1"
            >
              <Trash2 size={10} /> Clear all
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Paste a wallet address to add..."
            className="flex-1 px-3 py-2 bg-surface-elevated border border-border rounded-md text-[12px] text-fg placeholder:text-fg-subtle focus:border-accent font-mono"
          />
          <button
            onClick={handleAdd}
            disabled={list.length >= max}
            className="px-3 py-2 rounded-md border border-border text-fg-muted hover:text-accent hover:border-accent transition-all disabled:opacity-30"
            title={list.length >= max ? `Max ${max} traders` : "Add"}
          >
            <Plus size={14} />
          </button>
        </div>

        {list.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {list.map((addr, i) => (
              <span
                key={addr}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-surface-elevated text-[11px] font-mono"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                {addr.slice(0, 6)}...{addr.slice(-4)}
                <button
                  onClick={() => remove(addr)}
                  className="text-fg-subtle hover:text-danger ml-1"
                  title="Remove"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        {list.length === 0 && (
          <div className="text-center py-6 text-[11px] text-fg-subtle">
            Your basket is empty. Add traders from the leaderboard, a profile
            page, or paste an address above.
          </div>
        )}

        {list.length === 1 && (
          <p className="text-[10px] text-fg-subtle mt-2">
            Add at least one more trader to compare.
          </p>
        )}
      </div>

      {/* Results */}
      {loading && list.length >= 2 && (
        <div className="card p-12 text-center">
          <div className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && traders.length >= 2 && (
        <div className="space-y-4 fade-in">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {traders.map((t, i) => (
              <div
                key={t.address}
                className="card p-4 transition-all"
                style={{ borderColor: `${COLORS[i % COLORS.length]}40` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <TraderName address={t.address} chars={6} />
                </div>
                <TierBadge tier={t.tier} size="sm" />
                <div className="mt-3 space-y-1.5">
                  <Row
                    label="PNL ALL"
                    value={formatPnL(t.pnl_all_time)}
                    color={t.pnl_all_time >= 0 ? "text-success" : "text-danger"}
                  />
                  <Row
                    label="PNL 7D"
                    value={formatPnL(t.pnl_7d)}
                    color={t.pnl_7d >= 0 ? "text-success" : "text-danger"}
                  />
                  <Row
                    label="EQUITY"
                    value={`$${formatUSD(t.equity)}`}
                    color="text-fg"
                  />
                  <Row label="RANK" value={`#${t.rank}`} color="text-fg" />
                </div>
                <div className="mt-2">
                  <PacificaLink address={t.address} />
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <CompareBar
              title="PNL ALL TIME"
              values={traders.map((t) => t.pnl_all_time)}
              labels={labels}
              format={(v) => formatPnL(v)}
            />
            <CompareBar
              title="PNL 7D"
              values={traders.map((t) => t.pnl_7d)}
              labels={labels}
              format={(v) => formatPnL(v)}
            />
            <CompareBar
              title="PNL 30D"
              values={traders.map((t) => t.pnl_30d)}
              labels={labels}
              format={(v) => formatPnL(v)}
            />
            <CompareBar
              title="VOLUME ALL TIME"
              values={traders.map((t) => t.volume_all_time)}
              labels={labels}
              format={(v) => `$${formatUSD(v)}`}
            />
            <CompareBar
              title="EQUITY"
              values={traders.map((t) => t.equity)}
              labels={labels}
              format={(v) => `$${formatUSD(v)}`}
            />
            <CompareBar
              title="OPEN INTEREST"
              values={traders.map((t) => t.open_interest)}
              labels={labels}
              format={(v) => `$${formatUSD(v)}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex justify-between text-[10px]">
      <span className="text-fg-subtle">{label}</span>
      <span className={cn("font-bold tabular-nums", color)}>{value}</span>
    </div>
  );
}
