"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGroups } from "@/hooks/useGroups";
import { getTrader, type TraderStats } from "@/lib/api";
import { formatPnL, formatUSD, cn, pnlColor } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import TierBadge from "@/components/ui/TierBadge";
import TraderName from "@/components/ui/TraderName";
import PacificaLink from "@/components/ui/PacificaLink";
import {
  Trash2,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  Plus,
  Pencil,
  Check,
} from "lucide-react";
import Link from "next/link";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { groups, removeTrader, rename, addTrader } = useGroups();
  const group = groups.find((g) => g.id === id);

  const [traders, setTraders] = useState<TraderStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  useEffect(() => {
    if (!group) return;
    setLoading(true);
    Promise.all(group.addresses.map((addr) => getTrader(addr).then((r) => r.data)))
      .then((results) => setTraders(results.filter((t): t is TraderStats => t !== null)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [group]);

  const stats = useMemo(() => {
    if (traders.length === 0)
      return { totalPnl: 0, totalPnl7d: 0, totalEquity: 0, totalVolume: 0 };
    return {
      totalPnl: traders.reduce((s, t) => s + t.pnl_all_time, 0),
      totalPnl7d: traders.reduce((s, t) => s + t.pnl_7d, 0),
      totalEquity: traders.reduce((s, t) => s + t.equity, 0),
      totalVolume: traders.reduce((s, t) => s + t.volume_all_time, 0),
    };
  }, [traders]);

  if (!group) {
    return (
      <div className="card p-12 text-center">
        <p className="text-text-muted text-[11px] tracking-wider">WATCHLIST NOT FOUND</p>
        <Link
          href="/groups"
          className="text-accent hover:text-accent-hover text-[11px] mt-2 inline-block font-bold"
        >
          ← BACK
        </Link>
      </div>
    );
  }

  const handleRename = () => {
    if (editName.trim()) {
      rename(group.id, editName.trim());
      setEditing(false);
    }
  };

  const handleAddAddress = () => {
    if (newAddress.trim()) {
      addTrader(group.id, newAddress.trim());
      setNewAddress("");
      setAddingAddress(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[10px] text-text-muted tracking-wider">
        <a href="/" className="hover:text-accent transition-colors">HOME</a>
        <span>/</span>
        <a href="/groups" className="hover:text-accent transition-colors">WATCHLISTS</a>
        <span>/</span>
        <span className="text-text-secondary uppercase">{group.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-2.5 h-2.5 shrink-0"
          style={{ backgroundColor: group.color }}
        />
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
              className="px-2 py-1 bg-bg-card border border-border text-sm font-black text-text-primary focus:outline-none focus:border-accent font-mono"
            />
            <button
              onClick={handleRename}
              className="p-1 text-green hover:bg-green-dim transition-colors"
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-text-primary tracking-tight uppercase">
              {group.name}
            </h2>
            <button
              onClick={() => {
                setEditName(group.name);
                setEditing(true);
              }}
              className="p-1 text-text-muted hover:text-accent transition-colors"
            >
              <Pencil size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Group Stats */}
      {traders.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Group PnL (All)"
            value={formatPnL(stats.totalPnl)}
            positive={stats.totalPnl >= 0}
            icon={<TrendingUp size={14} />}
            className={stats.totalPnl >= 0 ? "glow-green" : "glow-red"}
          />
          <StatCard
            label="Group PnL (7D)"
            value={formatPnL(stats.totalPnl7d)}
            positive={stats.totalPnl7d >= 0}
            icon={<Target size={14} />}
            className={stats.totalPnl7d >= 0 ? "glow-green" : "glow-red"}
          />
          <StatCard
            label="Total Equity"
            value={`$${formatUSD(stats.totalEquity)}`}
            icon={<Zap size={14} />}
          />
          <StatCard
            label="Total Vol"
            value={`$${formatUSD(stats.totalVolume)}`}
            icon={<BarChart3 size={14} />}
          />
        </div>
      )}

      {/* Add Trader */}
      <div className="flex gap-2">
        {addingAddress ? (
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddAddress()}
              placeholder="paste wallet address..."
              autoFocus
              className="flex-1 px-3 py-2 bg-bg-card border border-border text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent font-mono"
            />
            <button
              onClick={handleAddAddress}
              className="px-4 py-2 bg-accent text-black text-[10px] font-black tracking-wider hover:bg-accent-hover transition-colors"
            >
              ADD
            </button>
            <button
              onClick={() => {
                setAddingAddress(false);
                setNewAddress("");
              }}
              className="px-4 py-2 border border-border text-text-secondary hover:text-text-primary text-[10px] font-bold tracking-wider transition-colors"
            >
              CANCEL
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingAddress(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-border text-text-muted hover:text-accent hover:border-accent text-[10px] font-bold tracking-wider transition-all"
          >
            <Plus size={12} />
            ADD TRADER
          </button>
        )}
      </div>

      {/* Traders Table */}
      <div className="card">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : traders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-text-muted text-[11px] tracking-wider">
              NO TRADERS YET. ADD FROM LEADERBOARD OR PASTE ADDRESS.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[9px] text-text-muted font-bold tracking-[0.2em] border-b border-border">
                <th className="text-left px-4 py-2.5">TRADER</th>
                <th className="text-left px-4 py-2.5">TIER</th>
                <th className="text-right px-4 py-2.5">PNL ALL</th>
                <th className="text-right px-4 py-2.5">PNL 7D</th>
                <th className="text-right px-4 py-2.5">VOLUME</th>
                <th className="text-right px-4 py-2.5">EQUITY</th>
                <th className="text-right px-4 py-2.5">OI</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {traders.map((trader, i) => (
                <tr
                  key={trader.address}
                  className="border-b border-border/30 row-hover transition-colors group"
                >
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
                      pnlColor(trader.pnl_all_time)
                    )}
                  >
                    {formatPnL(trader.pnl_all_time)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5 text-right text-[11px] font-semibold",
                      pnlColor(trader.pnl_7d)
                    )}
                  >
                    {formatPnL(trader.pnl_7d)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[11px] text-text-secondary">
                    ${formatUSD(trader.volume_all_time)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[11px] text-text-secondary">
                    ${formatUSD(trader.equity)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[11px] text-text-secondary">
                    ${formatUSD(trader.open_interest)}
                  </td>
                  <td className="px-4 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => removeTrader(group.id, trader.address)}
                      className="p-1 text-text-muted hover:text-red transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
