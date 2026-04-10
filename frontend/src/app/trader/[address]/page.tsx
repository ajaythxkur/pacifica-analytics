"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTrader, type TraderStats } from "@/lib/api";
import { formatPnL, formatUSD, cn } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import TierBadge from "@/components/ui/TierBadge";
import AddToGroupMenu from "@/components/ui/AddToGroupMenu";
import AddToCompareButton from "@/components/ui/AddToCompareButton";
import TraderName from "@/components/ui/TraderName";
import PacificaLink from "@/components/ui/PacificaLink";
import PeriodBarChart from "@/components/ui/PeriodBarChart";
import TraderDetailTabs from "@/components/trader/TraderDetailTabs";
import dynamic from "next/dynamic";

const FlexCard = dynamic(() => import("@/components/flex-card/FlexCard"), {
  ssr: false,
  loading: () => (
    <div className="w-[400px] h-[400px] flex items-center justify-center bg-bg-card border border-border">
      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});
import { Copy, Check, TrendingUp, Target, Zap, BarChart3, Share2, DollarSign, Activity } from "lucide-react";

export default function TraderPage() {
  const { address } = useParams<{ address: string }>();
  const [trader, setTrader] = useState<TraderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showFlexCard, setShowFlexCard] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    getTrader(address)
      .then((res) => setTrader(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [address]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trader) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] text-text-muted tracking-wider">
          <a href="/" className="hover:text-accent transition-colors">HOME</a>
          <span>/</span>
          <span className="text-text-secondary">TRADER</span>
        </div>
        <div className="card p-12 text-center">
          <p className="text-text-muted text-sm font-bold">TRADER NOT FOUND</p>
          <p className="text-[10px] text-text-muted mt-2 font-mono break-all">{address}</p>
          <p className="text-[10px] text-text-muted mt-3">
            This address is not on the Pacifica leaderboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[10px] text-text-muted tracking-wider">
        <a href="/" className="hover:text-accent transition-colors">HOME</a>
        <span>/</span>
        <span className="text-text-secondary">TRADER</span>
      </div>

      {/* Header */}
      <div
        className="card p-5"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-bg-elevated flex items-center justify-center text-2xl border border-border">
              {trader.tier === "leviathan"
                ? "\u{1F451}"
                : trader.tier === "whale"
                  ? "\u{1F40B}"
                  : trader.tier === "shark"
                    ? "\u{1F988}"
                    : trader.tier === "dolphin"
                      ? "\u{1F42C}"
                      : "\u{1F41F}"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <TraderName address={address} chars={8} linked={false} />
                <button
                  onClick={copyAddress}
                  className="text-text-muted hover:text-accent transition-colors"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
                <TierBadge tier={trader.tier} />
                {trader.rank && (
                  <span className={cn(
                    "text-[10px] font-black tracking-wider",
                    trader.rank <= 3 ? "text-accent text-glow" : "text-text-muted"
                  )}>
                    RANK #{trader.rank}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-[10px] text-text-muted tracking-wider font-mono break-all">
                  {address}
                </p>
              </div>
              <div className="mt-1">
                <PacificaLink address={address} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFlexCard(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border text-text-muted hover:text-accent hover:border-accent text-[10px] font-bold tracking-wider transition-all"
            >
              <Share2 size={11} />
              FLEX
            </button>
            <AddToCompareButton address={address} variant="button" />
            <AddToGroupMenu address={address} />
          </div>
        </div>
      </div>

      {/* PnL Stats by Period */}
      <div>
        <h3 className="text-[10px] font-black text-text-muted tracking-[0.2em] mb-3">
          PROFIT & LOSS
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="PNL 1D"
            value={formatPnL(trader.pnl_1d)}
            positive={trader.pnl_1d >= 0}
            icon={<TrendingUp size={14} />}
            className={trader.pnl_1d >= 0 ? "glow-green" : "glow-red"}
          />
          <StatCard
            label="PNL 7D"
            value={formatPnL(trader.pnl_7d)}
            positive={trader.pnl_7d >= 0}
            icon={<TrendingUp size={14} />}
            className={trader.pnl_7d >= 0 ? "glow-green" : "glow-red"}
          />
          <StatCard
            label="PNL 30D"
            value={formatPnL(trader.pnl_30d)}
            positive={trader.pnl_30d >= 0}
            icon={<Target size={14} />}
            className={trader.pnl_30d >= 0 ? "glow-green" : "glow-red"}
          />
          <StatCard
            label="PNL ALL TIME"
            value={formatPnL(trader.pnl_all_time)}
            positive={trader.pnl_all_time >= 0}
            icon={<Zap size={14} />}
            className={trader.pnl_all_time >= 0 ? "glow-green" : "glow-red"}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <PeriodBarChart
          title="PnL by Period"
          signed
          format={(v) => formatPnL(v)}
          bars={[
            { label: "1D", value: trader.pnl_1d },
            { label: "7D", value: trader.pnl_7d },
            { label: "30D", value: trader.pnl_30d },
            { label: "ALL", value: trader.pnl_all_time },
          ]}
        />
        <PeriodBarChart
          title="Volume by Period"
          format={(v) => `$${formatUSD(v)}`}
          bars={[
            { label: "1D", value: trader.volume_1d },
            { label: "7D", value: trader.volume_7d },
            { label: "30D", value: trader.volume_30d },
            { label: "ALL", value: trader.volume_all_time },
          ]}
        />
      </div>

      {/* Volume & Account Stats */}
      <div>
        <h3 className="text-[10px] font-black text-text-muted tracking-[0.2em] mb-3">
          VOLUME & ACCOUNT
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Volume 1D"
            value={`$${formatUSD(trader.volume_1d)}`}
            icon={<BarChart3 size={14} />}
          />
          <StatCard
            label="Volume 7D"
            value={`$${formatUSD(trader.volume_7d)}`}
            icon={<BarChart3 size={14} />}
          />
          <StatCard
            label="Volume 30D"
            value={`$${formatUSD(trader.volume_30d)}`}
            icon={<BarChart3 size={14} />}
          />
          <StatCard
            label="Volume All Time"
            value={`$${formatUSD(trader.volume_all_time)}`}
            icon={<BarChart3 size={14} />}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          label="Equity"
          value={`$${formatUSD(trader.equity)}`}
          icon={<DollarSign size={14} />}
        />
        <StatCard
          label="Open Interest"
          value={`$${formatUSD(trader.open_interest)}`}
          icon={<Activity size={14} />}
        />
        <StatCard
          label="ROI (est.)"
          value={`${trader.roi_percent >= 0 ? "+" : ""}${trader.roi_percent.toFixed(2)}%`}
          positive={trader.roi_percent >= 0}
          icon={<Target size={14} />}
        />
      </div>

      {/* Live trading data tabs */}
      <TraderDetailTabs address={address} />

      {/* Flex Card Modal */}
      {showFlexCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowFlexCard(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
          >
            <FlexCard trader={trader} rank={trader.rank} />
          </div>
        </div>
      )}
    </div>
  );
}
