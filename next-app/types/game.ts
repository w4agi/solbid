export type Bid = {
  id: number;
  amount: number;
  timestamp: string;
};

export type Player = {
  id: number;
  totalBidAmount: number;
  safe: boolean;
  royaltyEarned: number;
  bidCount: number;
  role: string;
  bid: Bid | null;
  user: {
    name: string;
    imageUrl: string | null;
  };
};

export type GameData = {
  id: number;
  gameId: string;
  initialBidAmount: number;
  highestBid: number;
  lastBidTime: string;
  totalBids: number;
  prizePool: number;
  platformFeePercent: number;
  gameEnded: boolean;
  createdAt: string;
  players: Player[];
};
