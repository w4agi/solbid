import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { gameSchema } from '@/schema/game-schema';

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('userId');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const result = gameSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        message: 'Validation failed',
        errors: result.error.errors
      }, { status: 400 });
    }

    const { gameId, initialBidAmount, creatorPublicKey, gamePda, playerPda, bidPda } = result.data;
  
    const game = await prisma.game.create({
      data: {
        gameId: gameId.toString(),
        pda: gamePda,
        initialBidAmount: parseInt(initialBidAmount.toString()),
        highestBid: parseInt(initialBidAmount.toString()),
        lastBidTime: new Date(),
        totalBids: 1,
        lastBidderId: bidPda,
        prizePool: parseInt(initialBidAmount.toString()),
        platformFeePercent: 10,  
      },
    });
 
    const player = await prisma.player.create({
      data: {
        playerPubkey: creatorPublicKey,
        pda: playerPda,
        totalBidAmount: parseInt(initialBidAmount.toString()),
        bidCount: 1,
        gameId: game.id,
        userId: parseInt(userId),
      },
    });
 
    const bid = await prisma.bid.create({
      data: {
        pda: bidPda,
        amount: parseInt(initialBidAmount.toString()),
        timestamp: new Date(),
        playerId: player.id,
      },
    });
 
    await prisma.gameId.update({
      where: { id: 1 },
      data: {
        currGameId: {
          increment: 1,
        },
      }
    });
    
    return NextResponse.json({ message: 'Game created successfully', game }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


export async function GET() {
  try {
    const games = await prisma.game.findMany();

    if (!games.length) {
      return NextResponse.json({ message: 'No games found' }, { status: 404 });
    }
    return NextResponse.json(games, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

