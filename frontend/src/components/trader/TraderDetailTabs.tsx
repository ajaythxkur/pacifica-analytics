"use client";

import { useEffect, useState } from "react";
import {
  getTraderPositions,
  getTraderOrders,
  getTraderFills,
  getTraderFunding,
  type TraderPosition,
  type TraderOrder,
  type TraderFill,
  type TraderFundingPayment,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

type Tab = "positions" | "orders" | "history" | "funding";

interface Props {
  address: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "positions", label: "Positions" },
  { key: "orders", label: "Open Orders" },
  { key: "history", label: "Trade History" },
  { key: "funding", label: "Funding" },
];

function fmtNum(v: string | number, digits = 2): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(2) + "K";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function fmtPnL(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n >= 0 ? "+" : "-";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

function timeAgo(ms: number): string {
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function sideBadge(side: string) {
  const isLong =
    side === "bid" || side.includes("open_long") || side.includes("close_short");
  return (
    <span
      className={cn(
        "inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
        isLong
          ? "text-success bg-success/15 border border-success/25"
          : "text-danger bg-danger/15 border border-danger/25"
      )}
    >
      {side === "bid" ? "LONG" : side === "ask" ? "SHORT" : side.replace("_", " ")}
    </span>
  );
}

export default function TraderDetailTabs({ address }: Props) {
  const [tab, setTab] = useState<Tab>("positions");
  const [positions, setPositions] = useState<TraderPosition[]>([]);
  const [orders, setOrders] = useState<TraderOrder[]>([]);
  const [fills, setFills] = useState<TraderFill[]>([]);
  const [funding, setFunding] = useState<TraderFundingPayment[]>([]);
  const [loading, setLoading] = useState<Record<Tab, boolean>>({
    positions: true,
    orders: false,
    history: false,
    funding: false,
  });
  const [loaded, setLoaded] = useState<Record<Tab, boolean>>({
    positions: false,
    orders: false,
    history: false,
    funding: false,
  });

  // Fetch on tab activation (lazy)
  useEffect(() => {
    if (loaded[tab]) return;
    setLoading((l) => ({ ...l, [tab]: true }));

    const fetchers: Record<Tab, () => Promise<void>> = {
      positions: async () => {
        const r = await getTraderPositions(address);
        setPositions(r.data);
      },
      orders: async () => {
        const r = await getTraderOrders(address);
        setOrders(r.data);
      },
      history: async () => {
        const r = await getTraderFills(address, 100);
        setFills(r.data);
      },
      funding: async () => {
        const r = await getTraderFunding(address, 100);
        setFunding(r.data);
      },
    };

    fetchers[tab]()
      .catch(console.error)
      .finally(() => {
        setLoading((l) => ({ ...l, [tab]: false }));
        setLoaded((l) => ({ ...l, [tab]: true }));
      });
  }, [tab, address, loaded]);

  return (
    <div>
      <div className="flex items-center gap-1 mb-3 border-b border-border-subtle">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-3 py-2 text-xs font-semibold transition-colors relative",
                active
                  ? "text-accent"
                  : "text-fg-subtle hover:text-fg"
              )}
            >
              {t.label}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden fade-in">
        {loading[tab] ? (
          <div className="p-12 text-center">
            <div className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "positions" ? (
          positions.length === 0 ? (
            <Empty label="No open positions" />
          ) : (
            <table className="w-full">
              <thead>
                <Th>
                  <td>Symbol</td>
                  <td>Side</td>
                  <td className="text-right">Size</td>
                  <td className="text-right">Entry</td>
                  <td className="text-right">Liq. Price</td>
                  <td className="text-right">Funding</td>
                  <td className="text-right">Type</td>
                </Th>
              </thead>
              <tbody>
                {positions.map((p, i) => {
                  const liq = parseFloat(p.liquidation_price);
                  const showLiq = isFinite(liq) && liq > 0;
                  return (
                    <Tr key={`${p.symbol}-${i}`}>
                      <td className="px-4 py-3 text-xs font-bold text-fg">
                        {p.symbol}
                      </td>
                      <td className="px-4 py-3">{sideBadge(p.side)}</td>
                      <td className="px-4 py-3 text-right text-xs text-fg-muted tabular-nums">
                        {fmtNum(p.amount, 4)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-fg-muted tabular-nums">
                        ${fmtNum(p.entry_price, 4)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums">
                        {showLiq ? (
                          <span className="text-danger inline-flex items-center gap-1">
                            <AlertTriangle size={10} />
                            ${fmtNum(p.liquidation_price, 4)}
                          </span>
                        ) : (
                          <span className="text-fg-subtle">—</span>
                        )}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right text-xs font-semibold tabular-nums",
                          parseFloat(p.funding) >= 0 ? "text-success" : "text-danger"
                        )}
                      >
                        {fmtPnL(p.funding)}
                      </td>
                      <td className="px-4 py-3 text-right text-[10px] text-fg-subtle uppercase tracking-wider">
                        {p.isolated ? "Isolated" : "Cross"}
                      </td>
                    </Tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : tab === "orders" ? (
          orders.length === 0 ? (
            <Empty label="No open orders" />
          ) : (
            <table className="w-full">
              <thead>
                <Th>
                  <td>Symbol</td>
                  <td>Side</td>
                  <td className="text-right">Amount</td>
                  <td className="text-right">Price</td>
                  <td className="text-right">Created</td>
                </Th>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <Tr key={o.order_id ?? i}>
                    <td className="px-4 py-3 text-xs font-bold text-fg">
                      {o.symbol}
                    </td>
                    <td className="px-4 py-3">{sideBadge(o.side)}</td>
                    <td className="px-4 py-3 text-right text-xs text-fg-muted tabular-nums">
                      {fmtNum(o.amount, 4)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-fg-muted tabular-nums">
                      {o.price ? `$${fmtNum(o.price, 4)}` : "Market"}
                    </td>
                    <td className="px-4 py-3 text-right text-[10px] text-fg-subtle">
                      {o.created_at ? timeAgo(o.created_at) : "—"}
                    </td>
                  </Tr>
                ))}
              </tbody>
            </table>
          )
        ) : tab === "history" ? (
          fills.length === 0 ? (
            <Empty label="No trade history" />
          ) : (
            <table className="w-full">
              <thead>
                <Th>
                  <td>Symbol</td>
                  <td>Action</td>
                  <td className="text-right">Amount</td>
                  <td className="text-right">Price</td>
                  <td className="text-right">PnL</td>
                  <td className="text-right">Fee</td>
                  <td className="text-right">When</td>
                </Th>
              </thead>
              <tbody>
                {fills.map((f) => {
                  const isLiq = f.cause && f.cause.toLowerCase().includes("liquid");
                  return (
                    <Tr key={f.history_id}>
                      <td className="px-4 py-3 text-xs font-bold text-fg">
                        <div className="flex items-center gap-1.5">
                          {f.symbol}
                          {isLiq && (
                            <span
                              title="Liquidation"
                              className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase text-danger bg-danger/15 border border-danger/30 px-1 py-0.5 rounded"
                            >
                              <AlertTriangle size={8} />
                              LIQ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{sideBadge(f.side)}</td>
                      <td className="px-4 py-3 text-right text-xs text-fg-muted tabular-nums">
                        {fmtNum(f.amount, 4)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-fg-muted tabular-nums">
                        ${fmtNum(f.price, 4)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right text-xs font-bold tabular-nums",
                          parseFloat(f.pnl) >= 0 ? "text-success" : "text-danger"
                        )}
                      >
                        {fmtPnL(f.pnl)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-fg-subtle tabular-nums">
                        ${fmtNum(f.fee, 4)}
                      </td>
                      <td className="px-4 py-3 text-right text-[10px] text-fg-subtle">
                        {timeAgo(f.created_at)}
                      </td>
                    </Tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : (
          funding.length === 0 ? (
            <Empty label="No funding payments" />
          ) : (
            <table className="w-full">
              <thead>
                <Th>
                  <td>Symbol</td>
                  <td>Side</td>
                  <td className="text-right">Position</td>
                  <td className="text-right">Rate</td>
                  <td className="text-right">Payout</td>
                  <td className="text-right">When</td>
                </Th>
              </thead>
              <tbody>
                {funding.map((f) => (
                  <Tr key={f.history_id}>
                    <td className="px-4 py-3 text-xs font-bold text-fg">
                      {f.symbol}
                    </td>
                    <td className="px-4 py-3">{sideBadge(f.side)}</td>
                    <td className="px-4 py-3 text-right text-xs text-fg-muted tabular-nums">
                      {fmtNum(f.amount, 4)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-fg-muted tabular-nums">
                      {(parseFloat(f.rate) * 100).toFixed(4)}%
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right text-xs font-bold tabular-nums",
                        parseFloat(f.payout) >= 0 ? "text-success" : "text-danger"
                      )}
                    >
                      {fmtPnL(f.payout)}
                    </td>
                    <td className="px-4 py-3 text-right text-[10px] text-fg-subtle">
                      {timeAgo(f.created_at)}
                    </td>
                  </Tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <tr className="text-[10px] text-fg-subtle font-semibold uppercase tracking-wider border-b border-border-subtle [&>td]:px-4 [&>td]:py-2.5">
      {children}
    </tr>
  );
}

function Tr({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b border-border-subtle/50 hover:bg-surface-hover transition-colors">
      {children}
    </tr>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="p-12 text-center text-xs text-fg-subtle uppercase tracking-wider">
      {label}
    </div>
  );
}
