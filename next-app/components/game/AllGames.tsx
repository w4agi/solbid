'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from 'date-fns'
import CreateGameModal from './CreateGame'

interface Game {
  id: number
  gameId: string
  initialBidAmount: number
  highestBid: number
  lastBidTime: string
  totalBids: number
  prizePool: number
  gameEnded: boolean
}

export default function AllGames() {
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchGames()
  }, [])

  const fetchGames = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/game')
      setGames(response.data.games.sort((a: Game, b: Game) => parseInt(b.gameId) - parseInt(a.gameId)))
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const LiveIndicator = () => (
    <div className="flex items-center">
      <motion.div
        className="w-2 h-2 bg-red-500 rounded-full mr-2"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className="text-xs font-semibold text-red-500">LIVE</span>
    </div>
  )

  return (
    <div className="container mx-auto py-8">
      <div className='flex justify-between'>
      <h1 className="text-3xl font-bold mb-6">Active Games</h1>
      <CreateGameModal/>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="h-48 bg-slate-900" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card
              key={game.id}
              className="hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => router.push(`/game/${game.gameId}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Game #{game.gameId}
                </CardTitle>
                {!game.gameEnded && <LiveIndicator />}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Initial Bid</p>
                    <p className="text-lg font-semibold">{game.initialBidAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Highest Bid</p>
                    <p className="text-lg font-semibold">{game.highestBid}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Bids</p>
                    <p className="text-lg font-semibold">{game.totalBids}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prize Pool</p>
                    <p className="text-lg font-semibold">{game.prizePool}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground">Last Bid</p>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(game.lastBidTime), { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}