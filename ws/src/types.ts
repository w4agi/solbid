export interface Bid {
  id: number;
  amount: number;
  timestamp: string;
};

export interface Player {
  id: number;
  totalBidAmount: number;
  bidCount: number;
  bid: Bid | null;
  user: {
    id: number;
    name: string;
    imageUrl: string | null;
  };
};

export interface Game {
  id: number;
  gameId: string;
  initialBidAmount: number;
  highestBid: number;
  lastBidTime: string;
  totalBids: number;
  prizePool: number;
  gameEnded: boolean;
  createdAt: string;
  players: Player;
};