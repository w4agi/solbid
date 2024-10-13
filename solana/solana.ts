import {
  PublicKey,
  Connection,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';
import BN from 'bn.js';
import { convertUsdcToLamports } from '@/lib/helper';

export const PROGRAM_ID = new PublicKey('5oCWbRMkRYojazdx1eeFc8kfor3YFY4YfnwoNL2NwaHe');
export const CONNECTION = new Connection('https://api.devnet.solana.com', 'confirmed');

 
export function getGamePda(gameId: BN): PublicKey {
  const gameIdBuffer = Buffer.from(gameId.toArray('le', 8));  
  const [gamePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('game'), gameIdBuffer],
    PROGRAM_ID
  );
  return gamePda;
}

export function getPlayerPda(gameId: BN, publicKey: PublicKey, bidCount: BN): PublicKey {
  const gameIdBuffer = Buffer.from(gameId.toArray('le', 8));
  const bidCountBuffer = Buffer.from(bidCount.toArray('le', 8));  
  const [playerPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('player'),
      gameIdBuffer,
      publicKey.toBuffer(),
      bidCountBuffer,
    ],
    PROGRAM_ID
  );
  return playerPda;
}

export function getBidPda(gameId: BN, bidId: BN): PublicKey {
  const gameIdBuffer = Buffer.from(gameId.toArray('le', 8));
  const bidIdBuffer = Buffer.from(bidId.toArray('le', 8));
  const [bidPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('bid'), gameIdBuffer, bidIdBuffer],
    PROGRAM_ID
  );
  return bidPda;
}

export class GameState {
  game_id: number;
  initial_bid_amount: number;
  highest_bid: number;
  last_bid_time: number;
  total_bids: number;
  last_bidder: PublicKey;
  prize_pool: number;
  platform_fee_percentage: number;
  game_ended: boolean;

  constructor(fields: Partial<GameState> = {}) {
    this.game_id = fields.game_id || 0;
    this.initial_bid_amount = fields.initial_bid_amount || 0;
    this.highest_bid = fields.highest_bid || 0;
    this.last_bid_time = fields.last_bid_time || 0;
    this.total_bids = fields.total_bids || 0;
    this.last_bidder = fields.last_bidder || new PublicKey(0);  
    this.prize_pool = fields.prize_pool || 0;
    this.platform_fee_percentage = fields.platform_fee_percentage || 0;
    this.game_ended = fields.game_ended || false;
  }

  static borshAccountSchema = borsh.struct([
    borsh.u64('game_id'),
    borsh.u64('initial_bid_amount'),
    borsh.u64('highest_bid'),
    borsh.u64('last_bid_time'),
    borsh.u64('total_bids'),
    borsh.publicKey('last_bidder'),
    borsh.u64('prize_pool'),
    borsh.u64('platform_fee_percentage'),
    borsh.bool('game_ended'),  
  ]);

  static deserialize(buffer?: Buffer): GameState | null {
    if (!buffer) {
      return null;
    }

    try {
      const { game_id, initial_bid_amount, highest_bid, last_bid_time, 
              total_bids, last_bidder, prize_pool, platform_fee_percentage, game_ended 
            } = this.borshAccountSchema.decode(buffer);

        return new GameState({
          game_id,
          initial_bid_amount,
          highest_bid,
          last_bid_time,
          total_bids,
          last_bidder,
          prize_pool,
          platform_fee_percentage,
          game_ended,
        });
    } catch (error) {
        console.error("deserialization error:", error);
        return null;
    }
  }
}

export class PlayerState {
  total_bid_amount: number;
  safe: boolean;
  royalty_earned: number;
  bid_count: number;

  constructor(fields: Partial<PlayerState> = {}) {
    this.total_bid_amount = fields.total_bid_amount || 0;
    this.safe = fields.safe || false;
    this.royalty_earned = fields.royalty_earned || 0;
    this.bid_count = fields.bid_count || 0;
  }

  static borshAccountSchema = borsh.struct([
    borsh.u64('total_bid_amount'),
    borsh.bool('safe'),
    borsh.u64('royalty_earned'),
    borsh.u64('bid_count'),
  ]);

  static deserialize(buffer?: Buffer): PlayerState | null {
    if (!buffer) {
      return null;
    }

    try {
      const { total_bid_amount, safe, royalty_earned, bid_count } =
        this.borshAccountSchema.decode(buffer);
      return new PlayerState({
        total_bid_amount,
        safe,
        royalty_earned,
        bid_count,
      });
    } catch (error) {
      console.error("Deserialization error:", error);
      console.error("Buffer length:", buffer.length);
      console.error("Buffer data:", buffer.toString("hex"));
      return null;
    }
  }
}

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

  return { transaction, latestBlockhash, totalCost };
}
 
export const placeBid = async (bidder: PublicKey, gameId: number, bidAmount: number, bidCount: number) => {
  const gamePda = getGamePda(new BN(gameId));
  const playerPda = getPlayerPda(new BN(gameId), bidder, new BN(bidCount));

  const instructionData = Buffer.alloc(9);
  instructionData[0] = 1; 
  instructionData.set(new BN(bidAmount).toArray('le', 8), 1); 

  const placeBidIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: playerPda, isSigner: false, isWritable: true },
      { pubkey: bidder, isSigner: true, isWritable: true },
      { pubkey: gamePda, isSigner: false, isWritable: true }
    ],
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

  return { transaction, latestBlockhash, totalCost };
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