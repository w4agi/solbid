import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { bidSchema } from '@/schema/game-schema';

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('userId');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = bidSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        message: 'Validation failed',
        errors: result.error.errors
      }, { status: 400 });
    }

    const { gameId, bidPda, amount, playerPda, creatorPublicKey, bidCount } = result.data;

    const game = await prisma.game.findUnique({
      where: { gameId:  gameId.toString() },
    });

    if (!game) {
      return NextResponse.json({ message: 'Game not found' }, { status: 404 });
    }

    const updatedGame = await prisma.game.update({
      where: {
        gameId: gameId.toString(),
      },
      data: {
        highestBid: amount,  
        lastBidTime: new Date(),
        totalBids: {
          increment: 1,
        },
        lastBidderId: bidPda,
        prizePool: {
          increment: amount,
        },
      },
    });

    const player = await prisma.player.create({
      data: {
        playerPubkey: creatorPublicKey,
        pda: playerPda,
        totalBidAmount: amount,
        bidCount: bidCount,
        gameId: game.id,
        userId: parseInt(userId),
      },
    });

    const bid = await prisma.bid.create({
      data: {
        pda: bidPda,
        amount: amount,
        timestamp: new Date(),
        playerId: player.id,
      },
    });

    return NextResponse.json({ message: 'Game updated successfully', updatedGame }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

 

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  try {
    if (!id) {
      return NextResponse.json({ message: "Id not found" }, { status: 404 });
    }

    const game = await prisma.game.findUnique({
      where: { gameId: id },
      include: {
        players: {
          include: {
            bid: {
              select: { pda: true },
            },
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ message: 'Game not found' }, { status: 404 });
    }

    const playerPdas = game.players.map(player => player.pda);
    const bidsPdas = game.players.map(player => player.bid ? player.bid.pda : null).filter(Boolean);
    const playersPubkeys = game.players.map(player => player.playerPubkey);

    return NextResponse.json({
      message: "PDAs and public keys fetched successfully",
      playersPda: playerPdas,   
      bidsPda: bidsPdas,        
      playersPubkey: playersPubkeys  
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
