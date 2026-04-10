"use client";

import { useEffect, useState } from "react";
import {
  getSentimentMentions,
  getTrendingTokens,
  type SentimentMention,
  type TrendingToken,
} from "@/lib/api";
import { formatUSD, cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Flame,
  Heart,
  Repeat2,
  Eye,
  Bookmark,
  ExternalLink,
} from "lucide-react";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function SentimentPage() {
  const [mentions, setMentions] = useState<SentimentMention[]>([]);
  const [trending, setTrending] = useState<TrendingToken[]>([]);
  const [ticker, setTicker] = useState("BTC");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getSentimentMentions(ticker, "24h", 20),
      getTrendingTokens(),
    ])
      .then(([m, t]) => {
        setMentions(m.data);
        setTrending(t.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ticker]);

  // Calculate aggregate engagement
  const totalViews = mentions.reduce((s, m) => s + m.viewCount, 0);
  const totalLikes = mentions.reduce((s, m) => s + m.likeCount, 0);
  const totalReposts = mentions.reduce((s, m) => s + m.repostCount, 0);
  const totalBookmarks = mentions.reduce((s, m) => s + m.bookmarkCount, 0);

  // Find current ticker in trending
  const currentTrending = trending.find(
    (t) => t.token.toUpperCase() === ticker.toUpperCase()
  );

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black text-text-primary tracking-tight">
            SENTIMENT
          </h2>
          <span className="text-[8px] font-bold tracking-[0.2em] text-accent border border-accent/30 bg-accent-dim px-1.5 py-0.5">
            ELFA AI
          </span>
        </div>
        <p className="text-[11px] text-text-muted tracking-wider mt-1">
          REAL-TIME SOCIAL INTELLIGENCE POWERED BY ELFA AI
        </p>
      </div>

      {/* Ticker from trending */}
      <div className="flex flex-wrap gap-1">
        {(trending.length > 0 ? trending.slice(0, 12) : [{ token: "BTC" }, { token: "ETH" }, { token: "SOL" }]).map((t) => (
          <button
            key={t.token}
            onClick={() => setTicker(t.token.toUpperCase())}
            className={cn(
              "px-2.5 py-1 text-[9px] font-black tracking-wider border transition-all",
              ticker.toUpperCase() === t.token.toUpperCase()
                ? "bg-accent text-black border-accent"
                : "border-border text-text-secondary hover:text-text-primary hover:bg-bg-card"
            )}
          >
            ${t.token.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <div className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Ticker Stats */}
            <div
              className="card p-5"
            >
              <div className="text-[9px] text-text-muted font-bold tracking-[0.2em] mb-4">
                ${ticker} SOCIAL STATS (24H)
              </div>

              {currentTrending && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-text-muted">MENTION TREND</span>
                    <span
                      className={cn(
                        "text-[11px] font-black flex items-center gap-1",
                        currentTrending.change_percent >= 0 ? "text-green" : "text-red"
                      )}
                    >
                      {currentTrending.change_percent >= 0 ? (
                        <TrendingUp size={10} />
                      ) : (
                        <TrendingDown size={10} />
                      )}
                      {currentTrending.change_percent >= 0 ? "+" : ""}
                      {currentTrending.change_percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-[9px] text-text-muted mb-1">NOW</div>
                      <div className="text-lg font-black text-text-primary">
                        {currentTrending.current_count}
                      </div>
                    </div>
                    <div className="text-text-muted">→</div>
                    <div className="flex-1">
                      <div className="text-[9px] text-text-muted mb-1">PREV</div>
                      <div className="text-lg font-black text-text-muted">
                        {currentTrending.previous_count}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Engagement Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-bg-elevated border border-border p-3">
                  <Eye size={10} className="text-text-muted mb-1" />
                  <div className="text-sm font-black text-text-primary">
                    {formatCount(totalViews)}
                  </div>
                  <div className="text-[8px] text-text-muted font-bold tracking-wider">
                    VIEWS
                  </div>
                </div>
                <div className="bg-bg-elevated border border-border p-3">
                  <Heart size={10} className="text-red mb-1" />
                  <div className="text-sm font-black text-text-primary">
                    {formatCount(totalLikes)}
                  </div>
                  <div className="text-[8px] text-text-muted font-bold tracking-wider">
                    LIKES
                  </div>
                </div>
                <div className="bg-bg-elevated border border-border p-3">
                  <Repeat2 size={10} className="text-accent mb-1" />
                  <div className="text-sm font-black text-text-primary">
                    {formatCount(totalReposts)}
                  </div>
                  <div className="text-[8px] text-text-muted font-bold tracking-wider">
                    REPOSTS
                  </div>
                </div>
                <div className="bg-bg-elevated border border-border p-3">
                  <Bookmark size={10} className="text-tier-whale mb-1" />
                  <div className="text-sm font-black text-text-primary">
                    {formatCount(totalBookmarks)}
                  </div>
                  <div className="text-[8px] text-text-muted font-bold tracking-wider">
                    BOOKMARKS
                  </div>
                </div>
              </div>
            </div>

            {/* Trending Tokens */}
            <div
              className="card p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Flame size={12} className="text-accent" />
                <span className="text-[9px] text-text-muted font-bold tracking-[0.2em]">
                  TRENDING TOKENS
                </span>
              </div>
              <div className="space-y-1">
                {trending.slice(0, 15).map((t, i) => (
                  <button
                    key={t.token}
                    onClick={() => setTicker(t.token.toUpperCase())}
                    className={cn(
                      "w-full flex items-center justify-between p-2 transition-all",
                      ticker.toUpperCase() === t.token.toUpperCase()
                        ? "bg-accent-dim border border-accent/20"
                        : "hover:bg-bg-card-hover"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted font-bold w-4">
                        {i + 1}
                      </span>
                      <span className="text-[11px] font-black text-text-primary uppercase">
                        ${t.token}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-text-muted">
                        {t.current_count} mentions
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-bold",
                          t.change_percent >= 0 ? "text-green" : "text-red"
                        )}
                      >
                        {t.change_percent >= 0 ? "+" : ""}
                        {t.change_percent.toFixed(1)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Mentions Feed */}
          <div className="lg:col-span-2">
            <div
              className="card"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <MessageCircle size={12} className="text-accent" />
                <span className="text-[9px] text-text-muted font-bold tracking-[0.2em]">
                  TOP MENTIONS &middot; ${ticker} &middot; 24H &middot; {mentions.length} POSTS
                </span>
              </div>

              {mentions.length === 0 ? (
                <div className="p-12 text-center text-text-muted text-[11px] tracking-wider">
                  NO MENTIONS FOUND FOR ${ticker}
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {mentions.map((mention, i) => (
                    <div
                      key={mention.tweetId}
                      className="px-4 py-3 row-hover transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-text-muted font-bold tracking-wider uppercase">
                            {mention.type}
                          </span>
                          <span className="text-[9px] text-text-muted">
                            {timeAgo(mention.mentionedAt)}
                          </span>
                        </div>
                        <a
                          href={mention.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[9px] text-accent hover:text-accent-hover font-bold tracking-wider transition-colors"
                        >
                          VIEW <ExternalLink size={8} />
                        </a>
                      </div>

                      {/* Engagement Stats */}
                      <div className="flex items-center gap-4 text-[10px]">
                        <span className="flex items-center gap-1 text-text-secondary">
                          <Eye size={10} className="text-text-muted" />
                          {formatCount(mention.viewCount)}
                        </span>
                        <span className="flex items-center gap-1 text-text-secondary">
                          <Heart size={10} className="text-red" />
                          {formatCount(mention.likeCount)}
                        </span>
                        <span className="flex items-center gap-1 text-text-secondary">
                          <Repeat2 size={10} className="text-accent" />
                          {formatCount(mention.repostCount)}
                        </span>
                        <span className="flex items-center gap-1 text-text-secondary">
                          <Bookmark size={10} className="text-tier-whale" />
                          {formatCount(mention.bookmarkCount)}
                        </span>
                        <span className="flex items-center gap-1 text-text-secondary">
                          <MessageCircle size={10} className="text-text-muted" />
                          {formatCount(mention.replyCount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
