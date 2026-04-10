"use client";

import { useRef } from "react";
import { type TraderStats } from "@/lib/api";
import { formatPnL, formatUSD, tierEmoji, shortenAddress } from "@/lib/utils";

interface FlexCardProps {
  trader: TraderStats;
  rank?: number;
  groupName?: string;
}

export default function FlexCard({ trader, rank, groupName }: FlexCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const copyAsImage = async () => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          alert("Copied! Paste on X to flex.");
        }
      });
    } catch {
      alert("Could not copy. Try right-clicking to save.");
    }
  };

  const isPositive = trader.pnl >= 0;

  return (
    <div className="space-y-3">
      <div
        ref={cardRef}
        className="w-[400px]"
        style={{
          background: "#000000",
          border: `1px solid ${isPositive ? "#00ff8830" : "#ff3b3b30"}`,
          padding: "24px",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
          <div className="flex items-center gap-2">
            <span style={{ color: "#00ff88", fontSize: "14px", fontWeight: 900, letterSpacing: "0.05em" }}>
              WHALE
            </span>
            <span style={{ color: "#ffffff", fontSize: "14px", fontWeight: 900, letterSpacing: "0.05em" }}>
              WATCHER
            </span>
          </div>
          {rank && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 900,
                color: rank <= 3 ? "#00ff88" : "#555555",
                letterSpacing: "0.1em",
                ...(rank <= 3 ? { textShadow: "0 0 10px rgba(0,255,136,0.5)" } : {}),
              }}
            >
              #{rank}
            </span>
          )}
        </div>

        {/* Trader */}
        <div style={{ marginBottom: "20px" }}>
          <div className="flex items-center gap-2" style={{ marginBottom: "4px" }}>
            <span style={{ fontSize: "22px" }}>{tierEmoji(trader.tier)}</span>
            <span style={{ fontSize: "16px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em" }}>
              {shortenAddress(trader.address, 6)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              style={{
                fontSize: "9px",
                fontWeight: 900,
                color: "#555555",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              {trader.tier}
            </span>
            {groupName && (
              <>
                <span style={{ color: "#333333" }}>|</span>
                <span style={{ fontSize: "9px", color: "#00ff88", letterSpacing: "0.1em" }}>
                  {groupName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* PnL */}
        <div
          style={{
            background: isPositive ? "rgba(0,255,136,0.05)" : "rgba(255,59,59,0.05)",
            border: `1px solid ${isPositive ? "rgba(0,255,136,0.15)" : "rgba(255,59,59,0.15)"}`,
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontSize: "9px", color: "#555555", fontWeight: 700, letterSpacing: "0.2em", marginBottom: "6px" }}>
            TOTAL PNL
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 900,
              color: isPositive ? "#00ff88" : "#ff3b3b",
              letterSpacing: "-0.02em",
              ...(isPositive ? { textShadow: "0 0 20px rgba(0,255,136,0.3)" } : { textShadow: "0 0 20px rgba(255,59,59,0.3)" }),
            }}
          >
            {formatPnL(trader.pnl)}
          </div>
          <div style={{ fontSize: "11px", color: isPositive ? "#00ff88" : "#ff3b3b", opacity: 0.6 }}>
            ROI: {trader.roi_percent >= 0 ? "+" : ""}{trader.roi_percent.toFixed(2)}%
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3" style={{ marginBottom: "16px" }}>
          {[
            { label: "EQUITY", value: `$${formatUSD(trader.equity)}` },
            { label: "PNL 7D", value: formatPnL(trader.pnl_7d) },
            { label: "VOLUME", value: `$${formatUSD(trader.volume)}` },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: "8px", color: "#555555", fontWeight: 700, letterSpacing: "0.2em", marginBottom: "4px" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "13px", color: "#ffffff", fontWeight: 900 }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between" style={{ borderTop: "1px solid #1e1e1e", paddingTop: "12px" }}>
          <span style={{ fontSize: "9px", color: "#333333", letterSpacing: "0.1em" }}>
            pacifica.fi
          </span>
          <span style={{ fontSize: "9px", color: "#333333", letterSpacing: "0.2em" }}>
            WHALE WATCHER
          </span>
        </div>
      </div>

      <button
        onClick={copyAsImage}
        className="w-[400px] py-2.5 bg-accent text-black text-[11px] font-black tracking-wider hover:bg-accent-hover transition-colors"
      >
        COPY TO CLIPBOARD → SHARE ON X
      </button>
    </div>
  );
}
