export function createGame(data: any) {
  const playerData = data.players[0];
  return {
    id: data.id,
    gameId: String(data.gameId),
    initialBidAmount: data.initialBidAmount,
    highestBid: data.highestBid,
    lastBidTime: new Date(data.lastBidTime).toISOString(),
    totalBids: data.totalBids,
    prizePool: data.prizePool,
    gameEnded: data.gameEnded,
    createdAt: new Date(data.createdAt).toISOString(),
    players: {
      id: playerData.id,
      totalBidAmount: playerData.totalBidAmount,
      bidCount: playerData.bidCount,
      bid: playerData.bid
        ? {
            id: playerData.bid.id,
            amount: playerData.bid.amount,
            timestamp: new Date(playerData.bid.timestamp).toISOString(),
          }
        : null,
      user: { ...playerData.user },
    },
  };
}