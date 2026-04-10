"use client";

import { useEffect, useState, useCallback } from "react";
import { getWhaleAlerts, getMarkets, type WhaleAlert } from "@/lib/api";
import { formatUSD, cn } from "@/lib/utils";
import { Bell, Volume2, VolumeX, RefreshCw } from "lucide-react";
import TelegramBotCTA from "@/components/ui/TelegramBotCTA";

const POPULAR_FIRST = [
  "BTC",
  "ETH",
  "SOL",
  "HYPE",
  "XRP",
  "DOGE",
  "BNB",
  "SUI",
  "AVAX",
  "LINK",
];

function sideLabel(side: string): { text: string; color: string } {
  if (side.includes("long") || side === "buy")
    return { text: "LONG", color: "text-green" };
  if (side.includes("short") || side === "sell")
    return { text: "SHORT", color: "text-red" };
  if (side.includes("close_long"))
    return { text: "CLOSE LONG", color: "text-red" };
  if (side.includes("close_short"))
    return { text: "CLOSE SHORT", color: "text-green" };
  return { text: side.toUpperCase().replace("_", " "), color: "text-text-secondary" };
}

function timeAgo(ts: number): string {
  const now = Date.now();
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
  const [symbols, setSymbols] = useState<string[]>(POPULAR_FIRST);
  const [symbol, setSymbol] = useState("BTC");
  const [minNotional, setMinNotional] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load full Pacifica markets list once
  useEffect(() => {
    getMarkets()
      .then((res) => {
        const all = res.data.map((m) => m.symbol);
        // Popular ones first, then the rest in original order
        const popular = POPULAR_FIRST.filter((s) => all.includes(s));
        const rest = all.filter((s) => !popular.includes(s));
        setSymbols([...popular, ...rest]);
      })
      .catch(console.error);
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      // Use a small min size — backend filters by notional anyway
      const res = await getWhaleAlerts(symbol, 0.0001, 200);
      const filtered = res.data.filter((a) => a.notional >= minNotional);
      setAlerts(filtered);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [symbol, minNotional]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAlerts]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg tracking-tight">
            Whale Alerts
          </h2>
          <p className="text-[12px] text-fg-subtle mt-1">
            Real-time large trades on Pacifica
          </p>
        </div>
      </div>

      <TelegramBotCTA />

      {/* Symbol selector — searchable dropdown for all 60+ markets */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-fg-subtle font-semibold uppercase tracking-wider">
            Market &middot; {symbols.length} available
          </span>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="px-2 py-1 rounded-md border border-border bg-surface-elevated text-[11px] text-fg font-semibold focus:border-accent cursor-pointer"
          >
            {symbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {symbols.slice(0, 8).map((s) => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              className={cn(
                "px-2 py-1 rounded text-[10px] font-semibold transition-all",
                symbol === s
                  ? "bg-accent text-accent-fg"
                  : "bg-surface-elevated text-fg-muted border border-border-subtle hover:text-fg hover:border-border"
              )}
            >
              {s}
            </button>
          ))}
          {symbols.length > 8 && (
            <span className="px-2 py-1 text-[10px] text-fg-subtle">
              +{symbols.length - 8} more in dropdown →
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Min Size */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-border-subtle bg-surface">
          <span className="text-[10px] text-fg-subtle font-medium uppercase tracking-wider">
            Min $
          </span>
          <select
            value={minNotional}
            onChange={(e) => setMinNotional(Number(e.target.value))}
            className="bg-transparent text-[11px] text-fg font-semibold focus:outline-none cursor-pointer"
          >
            <option value={1000}>1K</option>
            <option value={5000}>5K</option>
            <option value={10000}>10K</option>
            <option value={50000}>50K</option>
            <option value={100000}>100K</option>
          </select>
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundOn(!soundOn)}
          title={soundOn ? "Mute alerts" : "Enable alert sounds"}
          className={cn(
            "p-1.5 rounded-md border transition-all",
            soundOn
              ? "border-accent/40 text-accent bg-accent/10"
              : "border-border-subtle text-fg-subtle hover:text-fg hover:border-border"
          )}
        >
          {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>

        {/* Auto-refresh toggle */}
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          title={autoRefresh ? "Pause auto-refresh" : "Enable auto-refresh"}
          className={cn(
            "p-1.5 rounded-md border transition-all",
            autoRefresh
              ? "border-accent/40 text-accent bg-accent/10"
              : "border-border-subtle text-fg-subtle hover:text-fg hover:border-border"
          )}
        >
          <RefreshCw
            size={13}
            className={autoRefresh ? "animate-spin" : ""}
            style={autoRefresh ? { animationDuration: "3s" } : {}}
          />
        </button>

        {/* Manual refresh */}
        <button
          onClick={fetchAlerts}
          className="px-2.5 py-1.5 rounded-md border border-border-subtle text-[11px] font-semibold text-fg-muted hover:text-accent hover:border-accent transition-all"
        >
          Refresh
        </button>

        <div className="ml-auto inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border-subtle bg-surface">
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              autoRefresh ? "bg-success pulse-live" : "bg-fg-subtle"
            )}
          />
          <span className="text-[9px] text-fg-subtle font-semibold uppercase tracking-wider">
            {autoRefresh ? "Auto" : "Paused"}
          </span>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="card">
        {loading && alerts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-[11px] tracking-wider">
            NO WHALE TRADES ABOVE ${formatUSD(minNotional)} FOR {symbol}
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            
              {alerts.map((alert, i) => {
                const side = sideLabel(alert.side);
                const isLarge = alert.notional >= 50000;
                return (
                  <div
                    key={`${alert.timestamp}-${i}`}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 row-hover transition-colors",
                      isLarge && "glow-green"
                    )}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "w-8 h-8 flex items-center justify-center border shrink-0",
                      side.text.includes("LONG") || side.text.includes("CLOSE SHORT")
                        ? "border-green/30 bg-green-dim"
                        : "border-red/30 bg-red-dim"
                    )}>
                      <Bell size={12} className={side.color} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-text-primary">
                          {alert.symbol}
                        </span>
                        <span className={cn("text-[9px] font-black tracking-wider px-1.5 py-0.5 border",
                          side.text.includes("LONG") || side.text.includes("CLOSE SHORT")
                            ? "text-green border-green/30 bg-green-dim"
                            : "text-red border-red/30 bg-red-dim"
                        )}>
                          {side.text}
                        </span>
                        <span className="text-[9px] text-text-muted">
                          {alert.event_type.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        {alert.size} {alert.symbol} @ ${alert.price.toLocaleString()}
                      </div>
                    </div>

                    {/* Notional */}
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "text-[12px] font-black",
                        isLarge ? "text-accent text-glow" : "text-text-primary"
                      )}>
                        ${formatUSD(alert.notional)}
                      </div>
                      <div className="text-[9px] text-text-muted">
                        {timeAgo(alert.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
            
          </div>
        )}
      </div>
    </div>
  );
}
