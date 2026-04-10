"use client";

import { useEffect, useState } from "react";
import { getLeaderboard, type TraderStats } from "@/lib/api";
import { formatPnL, formatUSD, cn } from "@/lib/utils";
import TierBadge from "@/components/ui/TierBadge";
import AddToGroupMenu from "@/components/ui/AddToGroupMenu";
import AddToCompareButton from "@/components/ui/AddToCompareButton";
import TraderName from "@/components/ui/TraderName";
import PacificaLink from "@/components/ui/PacificaLink";

const PERIODS = [
  { value: "daily", label: "1D" },
  { value: "weekly", label: "7D" },
  { value: "monthly", label: "30D" },
  { value: "all_time", label: "ALL" },
];

const SORT_OPTIONS = [
  { value: "pnl", label: "PNL" },
  { value: "volume", label: "VOL" },
  { value: "equity", label: "EQUITY" },
];

function getPnlForPeriod(trader: TraderStats, period: string): number {
  if (period === "daily") return trader.pnl_1d;
  if (period === "weekly") return trader.pnl_7d;
  if (period === "monthly") return trader.pnl_30d;
  return trader.pnl_all_time;
}

function getVolForPeriod(trader: TraderStats, period: string): number {
  if (period === "daily") return trader.volume_1d;
  if (period === "weekly") return trader.volume_7d;
  if (period === "monthly") return trader.volume_30d;
  return trader.volume_all_time;
}

export default function LeaderboardPage() {
  const [traders, setTraders] = useState<TraderStats[]>([]);
  const [period, setPeriod] = useState("all_time");
  const [sortBy, setSortBy] = useState("pnl");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(period, sortBy, 100)
      .then((res) => setTraders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period, sortBy]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-text-primary tracking-tight">
          LEADERBOARD
        </h2>
        <p className="text-[11px] text-text-muted tracking-wider mt-1">
          {traders.length > 0 ? `SHOWING TOP 100 OF REAL PACIFICA TRADERS` : "LOADING..."}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex border border-border">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-black tracking-wider transition-all",
                period === p.value
                  ? "bg-accent text-black"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex border border-border">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSortBy(s.value)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-black tracking-wider transition-all",
                sortBy === s.value
                  ? "bg-accent text-black"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[9px] text-text-muted font-bold tracking-[0.2em] border-b border-border">
                  <th className="text-left px-4 py-2.5 w-10">#</th>
                  <th className="text-left px-4 py-2.5">TRADER</th>
                  <th className="text-left px-4 py-2.5">TIER</th>
                  <th className="text-right px-4 py-2.5">PNL ({period === "all_time" ? "ALL" : period === "daily" ? "1D" : period === "weekly" ? "7D" : "30D"})</th>
                  <th className="text-right px-4 py-2.5">VOLUME</th>
                  <th className="text-right px-4 py-2.5">EQUITY</th>
                  <th className="text-right px-4 py-2.5">OI</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {traders.map((trader, i) => {
                  const pnl = getPnlForPeriod(trader, period);
                  const vol = getVolForPeriod(trader, period);
                  return (
                    <tr
                      key={trader.address}
                      className="border-b border-border/30 row-hover transition-colors group"
                    >
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "text-[11px] font-black",
                            i === 0
                              ? "text-accent text-glow"
                              : i < 3
                                ? "text-tier-whale"
                                : "text-text-muted"
                          )}
                        >
                          {trader.rank || i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <TraderName address={trader.address} />
                          <PacificaLink address={trader.address} />
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <TierBadge tier={trader.tier} size="sm" />
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-right text-[11px] font-black",
                          pnl >= 0 ? "text-green" : "text-red"
                        )}
                      >
                        {formatPnL(pnl)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[11px] text-text-secondary">
                        ${formatUSD(vol)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[11px] text-text-secondary">
                        ${formatUSD(trader.equity)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[11px] text-text-secondary">
                        ${formatUSD(trader.open_interest)}
                      </td>
                      <td className="px-4 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1 justify-end">
                          <AddToCompareButton address={trader.address} />
                          <AddToGroupMenu address={trader.address} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
