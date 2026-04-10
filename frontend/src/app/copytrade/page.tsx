"use client";

import { Sparkles, Copy, Bell, Shield, Zap } from "lucide-react";

export default function CopyTradePage() {
  return (
    <div className="space-y-8">
      <div className="text-center pt-12 pb-8 fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 mb-6">
          <Sparkles size={11} className="text-accent" />
          <span className="text-[11px] font-semibold text-accent tracking-wide">
            Coming soon
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-fg tracking-tight mb-4 leading-tight">
          Copy the{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            }}
          >
            best traders
          </span>
          <br />
          automatically
        </h1>
        <p className="text-sm md:text-base text-fg-muted max-w-xl mx-auto">
          Mirror the positions of top performers on Pacifica with one click.
          Set risk limits, follow multiple wallets, and let the pros do the
          analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 fade-in-stagger max-w-4xl mx-auto">
        <Feature
          icon={<Copy size={16} />}
          title="One-click follow"
          desc="Subscribe to any whale's strategy and mirror their trades in real time."
        />
        <Feature
          icon={<Shield size={16} />}
          title="Risk controls"
          desc="Set max drawdown, position size limits, and stop-loss thresholds per follow."
        />
        <Feature
          icon={<Bell size={16} />}
          title="Smart alerts"
          desc="Get notified before mirrored positions are entered or closed."
        />
        <Feature
          icon={<Zap size={16} />}
          title="Low latency"
          desc="Trades replicated within seconds via Pacifica's builder API."
        />
      </div>

      <div className="card p-8 max-w-xl mx-auto text-center">
        <p className="text-sm text-fg-muted mb-4">
          We&apos;re building this. Drop your wallet on the leaderboard or
          watchlist a few traders so you&apos;re ready when it ships.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-surface-elevated">
          <div className="w-1.5 h-1.5 rounded-full bg-accent pulse-live" />
          <span className="text-[10px] font-semibold text-fg-muted uppercase tracking-wider">
            Under construction
          </span>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="card p-4">
      <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/30 text-accent flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-fg mb-1">{title}</h3>
      <p className="text-[11px] text-fg-subtle leading-relaxed">{desc}</p>
    </div>
  );
}
