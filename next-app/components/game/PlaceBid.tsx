'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { placeBid, getGameData, getAllPlayersAndBidsForGame } from '@/solana/solana'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { CONNECTION } from '@/lib/constant'

interface PlaceBidModalProps {
  gameId: number
  bidCount: number
}

export default function PlaceBid({ gameId, bidCount }: PlaceBidModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [bidAmount, setBidAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { publicKey, connected, signTransaction, sendTransaction } = useWallet()
  const router = useRouter()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!connected || !publicKey || !signTransaction) {
      toast.error('Please connect your wallet first')
      return
    }

    const bidAmountNumber = parseFloat(bidAmount)
    if (isNaN(bidAmountNumber) || bidAmountNumber <= 0) {
      toast.error('Please enter a valid bid amount')
      return
    }

    setIsLoading(true)

    try {
      const { transaction, latestBlockhash, totalCost, playerPda, bidPda } = await placeBid(publicKey, gameId, bidAmountNumber,  Number(bidCount) + 1)
  
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
          setIsOpen(false)
          return;
        }
      } else{
        toast.success('Bid placed successfully!')
        router.push("/home") 
        const res = await axios.post("/api/bid", {
          gameId: gameId,
          amount: bidAmountNumber,
          creatorPublicKey: publicKey.toString(),
          playerPda: playerPda.toString(),
          bidPda: bidPda.toString(),
          bidCount: Number(bidCount) + 1,
        });
        if(res.status === 200){
          toast.success("Bid saved in DB")
        }
        setIsOpen(false)
      }
       
    } catch (error) {
      toast.error(`Failed to place bid: ${error}`)
      console.log(`Failed to place bid: ${error}`)
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
          {!connected ? (
            <div className="text-center">
              <p className="mb-4">Please connect your wallet to place a bid</p>
              <WalletMultiButton />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="bidAmount" className="text-sm font-medium">
                  Bid Amount (USDC)
                </label>
                <Input
                  id="bidAmount"
                  type="number"
                  step="0.01"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter bid amount"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Placing Bid...' : 'Place Bid'}
              </Button>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}