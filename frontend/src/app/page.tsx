"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getLeaderboard, type TraderStats } from "@/lib/api";
import { formatPnL, formatUSD, cn } from "@/lib/utils";
import TierBadge from "@/components/ui/TierBadge";
import TraderName from "@/components/ui/TraderName";
import PacificaLink from "@/components/ui/PacificaLink";
import AddToGroupMenu from "@/components/ui/AddToGroupMenu";
import AddToCompareButton from "@/components/ui/AddToCompareButton";
import {
  Search,
  Trophy,
  TrendingUp,
  BarChart3,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [topTraders, setTopTraders] = useState<TraderStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard("all_time", "pnl", 10)
      .then((res) => setTopTraders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) {
      router.push(`/trader/${query.trim()}`);
      setQuery("");
    }
  };

  const totalVolume = topTraders.reduce((s, t) => s + t.volume, 0);
  const topPnL = topTraders[0]?.pnl_all_time || 0;
  const totalEquity = topTraders.reduce((s, t) => s + t.equity, 0);

  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="relative -mx-5 px-5 pt-16 pb-12 overflow-hidden">
        {/* Gradient backdrop */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, var(--accent-glow), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px -z-10"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--accent), transparent)",
            opacity: 0.4,
          }}
        />

        <div className="max-w-3xl mx-auto text-center fade-in">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 mb-6">
            <Sparkles size={11} className="text-accent" />
            <span className="text-[11px] font-semibold text-accent tracking-wide">
              Real-time Pacifica analytics
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-fg tracking-tight mb-4 leading-tight">
            Discover the{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              }}
            >
              top traders
            </span>
            <br />
            on Pacifica
          </h1>
          <p className="text-sm md:text-base text-fg-muted max-w-xl mx-auto mb-8">
            Track wallets, group them into custom watchlists, monitor whale
            activity, and analyze performance — all powered by live mainnet
            data.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative group">
              <div
                aria-hidden
                className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-xl"
                style={{
                  background:
                    "linear-gradient(90deg, var(--accent-glow), var(--accent-glow))",
                }}
              />
              <div className="relative flex items-center bg-surface border border-border rounded-xl group-focus-within:border-accent transition-colors">
                <Search
                  size={18}
                  className="absolute left-4 text-fg-subtle group-focus-within:text-accent transition-colors pointer-events-none"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by wallet address..."
                  className="w-full pl-12 pr-32 py-4 bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-accent-fg text-xs font-semibold hover:bg-accent-hover transition-colors"
                >
                  Search
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-fg-subtle">
              Try any Solana wallet that has traded on Pacifica
            </p>
          </form>
        </div>
      </section>

      {/* QUICK STATS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 fade-in-stagger">
        <StatTile
          icon={<Trophy size={16} />}
          label="Top All-Time PnL"
          value={formatPnL(topPnL)}
          accent
        />
        <StatTile
          icon={<BarChart3 size={16} />}
          label="Top 10 Volume"
          value={`$${formatUSD(totalVolume)}`}
        />
        <StatTile
          icon={<TrendingUp size={16} />}
          label="Top 10 Equity"
          value={`$${formatUSD(totalEquity)}`}
        />
      </section>

      {/* TOP TRADERS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-fg">Top Traders</h2>
            <p className="text-[11px] text-fg-subtle mt-0.5">
              Ranked by all-time PnL on Pacifica mainnet
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            View leaderboard <ArrowRight size={12} />
          </Link>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-fg-subtle font-semibold uppercase tracking-wider border-b border-border-subtle">
                  <th className="text-left px-5 py-3 w-12">#</th>
                  <th className="text-left px-5 py-3">Trader</th>
                  <th className="text-left px-5 py-3">Tier</th>
                  <th className="text-right px-5 py-3">PnL All</th>
                  <th className="text-right px-5 py-3">PnL 7D</th>
                  <th className="text-right px-5 py-3">Volume</th>
                  <th className="text-right px-5 py-3">Equity</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {topTraders.map((trader, i) => (
                  <tr
                    key={trader.address}
                    className="border-b border-border-subtle/50 row-hover transition-colors cursor-pointer group"
                    onClick={() => router.push(`/trader/${trader.address}`)}
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "text-xs font-bold",
                          i === 0
                            ? "text-accent"
                            : i < 3
                              ? "text-tier-whale"
                              : "text-fg-subtle"
                        )}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <TraderName address={trader.address} linked={false} />
                        <PacificaLink address={trader.address} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <TierBadge tier={trader.tier} size="sm" />
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3.5 text-right text-xs font-bold tabular-nums",
                        trader.pnl_all_time >= 0 ? "text-success" : "text-danger"
                      )}
                    >
                      {formatPnL(trader.pnl_all_time)}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3.5 text-right text-xs font-semibold tabular-nums",
                        trader.pnl_7d >= 0 ? "text-success" : "text-danger"
                      )}
                    >
                      {formatPnL(trader.pnl_7d)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-fg-muted tabular-nums">
                      ${formatUSD(trader.volume_all_time)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-fg-muted tabular-nums">
                      ${formatUSD(trader.equity)}
                    </td>
                    <td className="px-5 py-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1 justify-end">
                        <AddToCompareButton address={trader.address} />
                        <AddToGroupMenu address={trader.address} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StatTile({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "card p-5 flex items-center gap-4 transition-all hover:border-border",
        accent && "neon-border"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          accent
            ? "bg-accent/15 text-accent border border-accent/30"
            : "bg-surface-elevated text-fg-muted border border-border-subtle"
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold text-fg-subtle uppercase tracking-wider">
          {label}
        </div>
        <div className="text-lg font-bold text-fg tabular-nums truncate">
          {value}
        </div>
      </div>
    </div>
  );
}
