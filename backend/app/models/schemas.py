from pydantic import BaseModel
from typing import Optional


class TraderStats(BaseModel):
    address: str
    pnl: float = 0.0
    roi_percent: float = 0.0
    volume: float = 0.0
    win_rate: float = 0.0
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    best_trade_pnl: float = 0.0
    worst_trade_pnl: float = 0.0
    avg_trade_size: float = 0.0
    current_positions: int = 0
    tier: str = "fish"  # fish, dolphin, shark, whale, leviathan


class Position(BaseModel):
    symbol: str
    side: str  # long / short
    size: float
    entry_price: float
    mark_price: float
    unrealized_pnl: float
    leverage: float
    timestamp: int


class Trade(BaseModel):
    symbol: str
    side: str
    size: float
    price: float
    pnl: Optional[float] = None
    fee: float = 0.0
    timestamp: int


class LeaderboardEntry(BaseModel):
    rank: int
    address: str
    pnl: float
    roi_percent: float
    volume: float
    win_rate: float
    total_trades: int
    tier: str


class MarketInfo(BaseModel):
    symbol: str
    mark_price: float
    index_price: float
    funding_rate: float
    volume_24h: float
    open_interest: float
