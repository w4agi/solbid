import {LAMPORTS_PER_SOL} from "@solana/web3.js";
import axios from "axios";
 
export const convertUsdcToLamports = (initialBidAmount: number): number => {
  const usdcPrice = 141;  
  const solAmount = initialBidAmount / usdcPrice;
  return Math.floor(solAmount * LAMPORTS_PER_SOL);
};

export const convertLamportsToUsdc = (lamports: number): number => {
  const usdcPrice = 141;  
  const solAmount = lamports / LAMPORTS_PER_SOL;
  return parseFloat((solAmount * usdcPrice).toFixed(6));
};


export const fetchCurrentGameId = async () => {
  try {
    const res = await axios.get('/api/gameid');
    const gameId = res.data.currGameId;
    console.log(gameId)
    if (gameId) {
       return gameId; 
    } else {
      throw new Error("Faild to get curr game Id");
    }
  } catch (error) {
    console.error('Error fetching current game Id:', error);
  }
};
