'use client'

import { useState } from 'react'
import { LAMPORTS_PER_SOL} from '@solana/web3.js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createGame } from '@/solana/game'
import toast from 'react-hot-toast'
import { fetchCurrentGameId } from '@/lib/helper'
import axios from 'axios'
import { useSocket } from '@/context/socket-context'
import { GameData } from '@/types/game'
import { useWallet } from '@solana/wallet-adapter-react'
import { CONNECTION } from '@/lib/constant'
 

interface CreateGameProps {
  onCreateGame: (gameData: GameData) => void;
}

export default function CreateGame({ onCreateGame }: CreateGameProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialBidAmount, setInitialBidAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { sendMessage } = useSocket()
  const { publicKey, connected, signTransaction, sendTransaction } = useWallet()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!connected || !publicKey || !signTransaction) {
      toast.error('Please connect your wallet first')
      return
    }
    const bidAmount = parseFloat(initialBidAmount)
    if (isNaN(bidAmount) || bidAmount <= 0) {
      toast.error('Please enter a valid bid amount')
      return
    }

    setIsLoading(true)

    try {
      const gameId: number = await fetchCurrentGameId();
      const { 
        transaction, latestBlockhash, totalCost, 
        gamePda, playerPda, bidPda 
      } = await createGame(publicKey, gameId, bidAmount)
       
      const balance = await CONNECTION.getBalance(publicKey)
      console.log("balance", balance)
      console.log("totalCost", totalCost)
      if (balance < totalCost) {
        toast.error(`Insufficient balance. You need at least ${totalCost / LAMPORTS_PER_SOL} SOL`)
        setIsLoading(false)
        return
      }

      const signedTransaction = await signTransaction(transaction)
      const txid = await CONNECTION.sendRawTransaction(signedTransaction.serialize());
      
      const confirmation = await CONNECTION.confirmTransaction({
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        signature: txid,
      }, 'confirmed')

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`)
      }


      const gameData = {
        gameId: gameId,
        initialBidAmount: bidAmount,
        creatorPublicKey: publicKey.toString(),
        gamePda: gamePda.toString(),
        playerPda: playerPda.toString(),
        bidPda: bidPda.toString(),
      };

      const res = await axios.post("/api/game", gameData);
      const createdGameData: GameData = res.data.gameData;

      if(res.status === 200){
        sendMessage('create-game', createdGameData)
        onCreateGame(createdGameData)
      }
      toast.success('Game created successfully!')
      setIsOpen(false)
    } catch (error) {
      toast.error(`Failed to create game`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create Game</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Game</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="initialBidAmount" className="text-sm font-medium">
            Initial Bid Amount (USDC)
          </label>
          <Input
            id="initialBidAmount"
            type="number"
            step="0.01"
            value={initialBidAmount}
            onChange={(e) => setInitialBidAmount(e.target.value)}
            placeholder="Enter initial bid amount"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating Game...' : 'Create Game'}
        </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}