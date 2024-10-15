import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import BN from 'bn.js';
import { convertLamportsToUsdc, convertUsdcToLamports } from '@/lib/helper';
import axios from 'axios';
import { PROGRAM_ID, CONNECTION, PLATFROM_ACCOUNT } from '@/lib/constant';
import { getBidPda, getGamePda, getPlayerPda } from './pda';
import { GameState, PlayerState } from './state';

export const getGameData = async (gameId: number) => {
  const gamePda = getGamePda(new BN(gameId));
  const accountInfo = await CONNECTION.getAccountInfo(gamePda);
  if (!accountInfo) {
    throw new Error('Game account not found');
  }
  const gameState = GameState.deserialize(accountInfo.data);
  return gameState;
}

export const getAllPlayersAndBids = async (gameId: number, playerPubKey: PublicKey, bidCount: number) => {
  const playerPda = getPlayerPda(new BN(gameId), playerPubKey, new BN(bidCount));
  const accountInfo = await CONNECTION.getAccountInfo(playerPda);
  if (!accountInfo) {
    throw new Error('Player account not found');
  }
  const playerState = PlayerState.deserialize(accountInfo.data);
  console.log('Player data:', playerState);
  return playerState;
}

 
export const createGame = async (publicKey: PublicKey, gameId: number, bidAmount: number) => {
  const gameIdBuffer = Buffer.alloc(8);
  gameIdBuffer.writeBigUInt64LE(BigInt(gameId));

  const bidCountBuffer = Buffer.alloc(8);  
  bidCountBuffer.writeBigUInt64LE(BigInt(1));  

  const initialBidLamports = convertUsdcToLamports(bidAmount)
  const initialBidAmountBuffer = Buffer.alloc(8);

  initialBidAmountBuffer.writeBigUInt64LE(BigInt(initialBidLamports))

  const instructionData = Buffer.concat([
    Buffer.from([0]),  
    gameIdBuffer,
    initialBidAmountBuffer,
  ]);

  const gamePda = getGamePda(new BN(gameId));
  const playerPda = getPlayerPda(new BN(gameId), publicKey, new BN(1))
  const bidPda  = getBidPda(new BN(gameId), new BN(1))

  const createGameIx = new TransactionInstruction({
    keys: [
      { pubkey: gamePda, isSigner: false, isWritable: true },
      { pubkey: publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: playerPda, isSigner: false, isWritable: true },
      { pubkey: bidPda, isSigner: false, isWritable: true },
    ],
    programId: PROGRAM_ID,
    data: instructionData,
  });

  const latestBlockhash = await CONNECTION.getLatestBlockhash('confirmed');
  const transaction = new Transaction();
  transaction.add(createGameIx);
  transaction.recentBlockhash = latestBlockhash.blockhash;
  transaction.feePayer = publicKey;

  let fees = await transaction.getEstimatedFee(CONNECTION);
  if (fees === null) {
    fees = 50000000
  }
  const totalCost = fees + initialBidLamports;
  return { transaction, latestBlockhash, totalCost, gamePda, playerPda, bidPda };
}
 
export const placeBid = async (bidder: PublicKey, gameId: number, bidAmount: number, bidCount: number) => {
  const gamePda = getGamePda(new BN(gameId));
  const playerPda = getPlayerPda(new BN(gameId), bidder, new BN(bidCount));
  const bidPda = getBidPda(new BN(gameId), new BN(bidCount));
  const bidAmountLamports = convertUsdcToLamports(bidAmount);
  const bidAmountLamportsBuffer = Buffer.alloc(8);
  bidAmountLamportsBuffer.writeBigUInt64LE(BigInt(bidAmountLamports));
  const bidCountBuffer = Buffer.alloc(8);
  bidCountBuffer.writeBigUInt64LE(BigInt(bidCount));

  const instructionData = Buffer.concat([
    Buffer.from([1]), 
    bidAmountLamportsBuffer,
    bidCountBuffer
  ]);
  
  const keys = [
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: PLATFROM_ACCOUNT, isSigner: false, isWritable: true},
    { pubkey: gamePda, isSigner: false, isWritable: true },
    { pubkey: bidder, isSigner: true, isWritable: true },
    { pubkey: bidPda, isSigner: false, isWritable: true },
    { pubkey: playerPda, isSigner: false, isWritable: true },
  ];

  const res = await axios.get('/api/bid', {
    params: {
      id: gameId,
    },
  });
   
  const playersPda = res.data.playersPda;  
  const bidsPda = res.data.bidsPda; 
  const playersPubkeys = res.data.playersPubkey;

  playersPda.forEach((player:string) => {
    keys.push({ pubkey: new PublicKey(player), isSigner: false, isWritable: true });  
  });

  bidsPda.forEach((bid:string) => {
    keys.push({ pubkey: new PublicKey(bid), isSigner: false, isWritable: true }); 
  });

  playersPubkeys.forEach((playerPubkey:string) => {
    keys.push({ pubkey: new PublicKey(playerPubkey), isSigner: true, isWritable: true });  
  });

  const placeBidIx = new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data: instructionData
  });

  const latestBlockhash = await CONNECTION.getLatestBlockhash('confirmed');
  const transaction = new Transaction();
  transaction.add(placeBidIx);
  transaction.recentBlockhash = latestBlockhash.blockhash;
  transaction.feePayer = bidder;

  let fees = await transaction.getEstimatedFee(CONNECTION);
  if (fees === null) {
    fees = 50000000 
  }
  const totalCost = fees + bidAmount;
  return { transaction, latestBlockhash, totalCost, playerPda, bidPda };
}

export const getAllGames = async () => {
  const accounts = await CONNECTION.getProgramAccounts(PROGRAM_ID, {
    filters: [
      {
        memcmp: {
          offset: 0,
          bytes: Buffer.from([0]).toString('base64'),  
        },
      },
    ],
  });

  const games: GameState[] = [];
  for (const account of accounts) {
    const gameState = GameState.deserialize(account.account.data);
    if (gameState) {
      games.push(gameState);
    }
  }
  return games;
}

export const getAllPlayersAndBidsForGame = async (gameId: number) => {
  try {
    const res = await axios.get('/api/pda', {
      params: {
        id: gameId,
      },
    });

    const players = res.data.players;
    const playerStates = [];

    for (const player of players) {
      const { playerPda, playerId }: { playerPda: string; playerId: number } = player;
      const accountInfo = await CONNECTION.getAccountInfo(new PublicKey(playerPda));
      if (accountInfo && accountInfo.data) {
        const playerState = PlayerState.deserialize(accountInfo.data);
        if (playerState) {
          playerStates.push({
            playerId,
            total_bid_amount: parseInt(playerState.total_bid_amount.toString()),
            safe: playerState.safe,
            royalty_earned: convertLamportsToUsdc(parseInt(playerState.royalty_earned.toString())),
            bid_count: parseInt(playerState.bid_count.toString()),
          });
        } else {
          console.error(`Failed to deserialize account for PDA: ${playerPda}`);
        }
      } else {
        console.error(`Account not found or empty for PDA: ${playerPda}`);
      }
    }
    return playerStates;  

  } catch (error) {
    console.error("Error fetching players and bids:", error);
  }
};