const API_BASE = "/api";

async function fetchAPI<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface TraderStats {
  address: string;
  username: string | null;
  pnl: number;
  pnl_1d: number;
  pnl_7d: number;
  pnl_30d: number;
  pnl_all_time: number;
  roi_percent: number;
  volume: number;
  volume_1d: number;
  volume_7d: number;
  volume_30d: number;
  volume_all_time: number;
  equity: number;
  open_interest: number;
  tier: string;
  rank?: number;
}

export interface Trade {
  event_type: string;
  price: string;
  amount: string;
  side: string;
  cause: string;
  created_at: number;
}

export async function getLeaderboard(
  period = "all_time",
  sortBy = "pnl",
  limit = 100,
  offset = 0
): Promise<{ data: TraderStats[]; total: number }> {
  return fetchAPI("/leaderboard", {
    period,
    sort_by: sortBy,
    limit: String(limit),
    offset: String(offset),
  });
}

export async function getTrader(address: string): Promise<{ data: TraderStats | null }> {
  return fetchAPI(`/trader/${address}`);
}

// Account & portfolio (per-trader detail data)
export interface TraderAccount {
  balance: string;
  account_equity: string;
  available_to_spend: string;
  available_to_withdraw: string;
  total_margin_used: string;
  cross_mmr: string;
  fee_level: number;
  maker_fee: string;
  taker_fee: string;
  positions_count: number;
  orders_count: number;
  updated_at: number;
}

export interface TraderPosition {
  symbol: string;
  side: string; // "bid" (long) | "ask" (short)
  amount: string;
  entry_price: string;
  margin: string;
  funding: string;
  isolated: boolean;
  liquidation_price: string;
  created_at: number;
  updated_at: number;
}

export interface TraderOrder {
  order_id?: number;
  client_order_id?: string;
  symbol: string;
  side: string;
  amount: string;
  price?: string;
  stop_price?: string;
  reduce_only?: boolean;
  created_at?: number;
}

export interface TraderFill {
  history_id: number;
  order_id: number;
  symbol: string;
  amount: string;
  price: string;
  entry_price: string;
  fee: string;
  pnl: string;
  event_type: string;
  side: string; // open_long, close_short, etc
  created_at: number;
  cause: string; // normal, liquidation, ...
}

export interface TraderFundingPayment {
  history_id: number;
  symbol: string;
  side: string;
  amount: string;
  payout: string;
  rate: string;
  created_at: number;
}

export async function getTraderAccount(
  address: string
): Promise<{ data: TraderAccount | null }> {
  return fetchAPI(`/trader/${address}/account`);
}

export async function getTraderPositions(
  address: string
): Promise<{ data: TraderPosition[] }> {
  return fetchAPI(`/trader/${address}/positions`);
}

export async function getTraderOrders(
  address: string
): Promise<{ data: TraderOrder[] }> {
  return fetchAPI(`/trader/${address}/orders`);
}

export async function getTraderFills(
  address: string,
  limit = 100
): Promise<{ data: TraderFill[] }> {
  return fetchAPI(`/trader/${address}/fills`, { limit: String(limit) });
}

export async function getTraderFunding(
  address: string,
  limit = 100
): Promise<{ data: TraderFundingPayment[] }> {
  return fetchAPI(`/trader/${address}/funding`, { limit: String(limit) });
}

export async function getTrades(symbol = "BTC", limit = 50): Promise<{ data: Trade[] }> {
  return fetchAPI("/trades", { symbol, limit: String(limit) });
}

export async function searchTraders(q: string): Promise<{ data: TraderStats[] }> {
  return fetchAPI("/search", { q });
}

// Markets
export interface Market {
  symbol: string;
  tick_size: string;
  lot_size: string;
  max_leverage: number;
  isolated_only: boolean;
  funding_rate: string;
}

export async function getMarkets(): Promise<{ data: Market[] }> {
  return fetchAPI("/markets");
}

// Whale Alerts
export interface WhaleAlert {
  symbol: string;
  side: string;
  size: number;
  price: number;
  notional: number;
  event_type: string;
  cause: string;
  timestamp: number;
}

export async function getWhaleAlerts(
  symbol = "BTC",
  minSize = 0.1,
  limit = 50
): Promise<{ data: WhaleAlert[] }> {
  return fetchAPI("/whale-alerts", {
    symbol,
    min_size: String(minSize),
    limit: String(limit),
  });
}

// Comparison
export async function compareTraders(
  addresses: string[]
): Promise<{ data: TraderStats[] }> {
  return fetchAPI("/compare", { addresses: addresses.join(",") });
}

// Elfa Sentiment
export interface SentimentMention {
  tweetId: string;
  link: string;
  likeCount: number;
  repostCount: number;
  viewCount: number;
  quoteCount: number;
  replyCount: number;
  bookmarkCount: number;
  mentionedAt: string;
  type: string;
}

export interface TrendingToken {
  token: string;
  current_count: number;
  previous_count: number;
  change_percent: number;
}

export async function getSentimentMentions(
  ticker = "BTC",
  timeWindow = "24h",
  limit = 10
): Promise<{ data: SentimentMention[] }> {
  return fetchAPI("/sentiment/mentions", {
    ticker,
    time_window: timeWindow,
    limit: String(limit),
  });
}

export async function getTrendingTokens(): Promise<{ data: TrendingToken[] }> {
  return fetchAPI("/sentiment/trending");
}

// Telegram bot info
export interface TelegramInfo {
  enabled: boolean;
  username: string | null;
  subscribers: number;
}

export async function getTelegramInfo(): Promise<{ data: TelegramInfo }> {
  return fetchAPI("/telegram/info");
}
