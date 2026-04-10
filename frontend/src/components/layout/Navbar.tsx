"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Activity } from "lucide-react";
import { useCompareList } from "@/hooks/useCompareList";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/alerts", label: "Whale Alerts" },
  { href: "/compare", label: "Compare" },
  { href: "/sentiment", label: "Sentiment" },
  { href: "/copytrade", label: "Copytrade" },
  { href: "/groups", label: "Groups" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { list: compareList } = useCompareList();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center group-hover:bg-accent/25 transition-colors">
            <Activity size={15} className="text-accent" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold text-fg tracking-tight">
              Pacifica
            </span>
            <span className="text-[10px] font-medium text-fg-subtle tracking-[0.18em] uppercase">
              Analytics
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[12px] font-medium transition-all inline-flex items-center gap-1.5",
                  active
                    ? "text-accent bg-accent/10"
                    : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                )}
              >
                {item.label}
                {item.href === "/compare" && compareList.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-accent-fg text-[9px] font-bold">
                    {compareList.length}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border-subtle bg-surface">
            <div className="w-1.5 h-1.5 rounded-full bg-success pulse-live" />
            <span className="text-[10px] text-fg-muted font-semibold tracking-wider uppercase">
              Live
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
