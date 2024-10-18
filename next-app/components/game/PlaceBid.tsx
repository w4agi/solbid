'use client';

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { placeBid} from '@/solana/bid'
import toast from 'react-hot-toast'
import axios from 'axios'
import { LAMPORTS_PER_SOL} from '@solana/web3.js'
import { useSocket } from '@/context/socket-context'
import { GameData } from '@/types/game'
import { useWallet } from '@solana/wallet-adapter-react';
import { CONNECTION } from '@/lib/constant';
import { getAllPlayersAndBidsForGame, getGameData } from '@/solana/game';

interface PlaceBidModalProps {
  gameId: number
  bidCount: number
  currBid: number
  onPlaceBid: (gameData: GameData) => void;
}

export default function PlaceBid({ gameId, bidCount, currBid, onPlaceBid }: PlaceBidModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [bidAmount, setBidAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const { publicKey, connected, signTransaction} = useWallet()
  const { sendMessage } = useSocket()

  const validateBidAmount = (amount: number) => {
    if (isNaN(amount)) {
      return 'Please enter a valid number'
    }
    if (amount <= 0) {
      return 'Bid amount must be greater than 0'
    }
    if (amount < currBid * 2) {
      return `Bid amount must be greater than ${currBid * 2} USDC (double the current bid)`
    }
    return null
  }

  const handleBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBidAmount(value)
    if (value) {
      const error = validateBidAmount(parseFloat(value))
      setValidationError(error)
    } else {
      setValidationError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!connected || !publicKey || !signTransaction) {
      toast.error('Please connect your wallet first')
      return
    }
    const bidAmountNumber = parseFloat(bidAmount)
    
    const error = validateBidAmount(bidAmountNumber)
    if (error) {
      setValidationError(error)
      return
    }

    setIsLoading(true)

    try {
      const { 
        transaction, 
        latestBlockhash, totalCost, 
        playerPda, bidPda 
      } = await placeBid(publicKey, gameId, bidAmountNumber,  Number(bidCount) + 1)
      
      const balance = await CONNECTION.getBalance(publicKey)
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

      console.log("Txid", txid)
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`)
      }

      const game  = await getGameData(gameId)
      if(game?.game_ended){
        const playerData = await getAllPlayersAndBidsForGame(gameId);
        const res = await axios.put("/api/bid", {
          gameId: gameId,
          creatorPublicKey: publicKey.toString(),
          playerPda: playerPda.toString(),
          bidPda: bidPda.toString(),
          playerData: playerData,
          amount: bidAmountNumber,
          bidCount: Number(bidCount) + 1
        });
        if(res.status === 200){
          toast.success("Game is Ended..You just came after winner.")
          const gameData: GameData = res.data.gameData;
          sendMessage('place-bid', gameData)
          onPlaceBid(gameData)
          setIsOpen(false)
          return;
        }
      } else{
        toast.success('Bid placed successfully!')
        const res = await axios.post("/api/bid", {
          gameId: gameId,
          amount: bidAmountNumber,
          creatorPublicKey: publicKey.toString(),
          playerPda: playerPda.toString(),
          bidPda: bidPda.toString(),
          bidCount: Number(bidCount) + 1,
        });
        if(res.status === 200){
          const gameData: GameData = res.data.gameData;
          sendMessage('place-bid', gameData)
          onPlaceBid(gameData)
        }
        setIsOpen(false)
        setBidAmount('')
      }
      setValidationError(null)
      
    } catch (error) {
      toast.error(`Failed to place bid`)
      console.error('Failed to place bid:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Place Bid</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Place a Bid</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="bidAmount" className="text-sm font-medium">
              Bid Amount
            </label>
            <Input
              id="bidAmount"
              type="number"
              step="0.01"
              min="0"
              value={bidAmount}
              onChange={handleBidChange}
              placeholder={`Minimum bid: ${(currBid * 2).toFixed(2)} $`}
              required
              className={validationError ? 'border-red-500' : ''}
            />
            {validationError && (
              <p className="text-red-500 text-sm">{validationError}</p>
            )}
            <p className="text-sm text-gray-500">
              Current bid: {currBid.toFixed(2)} $
            </p>
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !!validationError || !bidAmount}
          >
            {isLoading ? 'Placing Bid...' : 'Place Bid'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}