'use client'

import { useState, useEffect } from 'react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { CONNECTION } from '@/lib/helper'

export default function WalletBalance() {
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
 
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) {
        setBalance(null)
        return
      }
      try {
        const walletBalance = await CONNECTION.getBalance(publicKey)
        setBalance(walletBalance / LAMPORTS_PER_SOL)
      } catch (err) {
        console.error('Failed to fetch balance:', err)
        setBalance(null)
      }  
    }

    fetchBalance()
  }, [publicKey, connected])

  return connected && (
    <Button
      variant="outline"
      size="sm"
      className="bg-background text-foreground hover:bg-background/90 cursor-default"
    >
      <Wallet className="mr-2 h-4 w-4" />
      {balance?.toFixed(2)} SOL  
    </Button>
  )
}