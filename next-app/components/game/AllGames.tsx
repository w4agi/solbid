'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from 'date-fns'
import { useSocket } from '@/context/socket-context'
import CreateGame from './CreateGame'
import jwt from 'jsonwebtoken'
import { GameData } from '@/types/game'
import { DollarSign } from 'lucide-react'

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
  const { socket, sendMessage, connectionError, user, setUser } = useSocket()

  const addOrUpdateGame = useCallback((newGame: Game) => {
    setGames(prevGames => {
      const existingGameIndex = prevGames.findIndex(game => game.gameId === newGame.gameId);
      if (existingGameIndex !== -1) {
        const updatedGames = [...prevGames];
        updatedGames[existingGameIndex] = { ...updatedGames[existingGameIndex], ...newGame };
        return updatedGames.sort((a, b) => new Date(b.lastBidTime).getTime() - new Date(a.lastBidTime).getTime());
      } else {
        return [newGame, ...prevGames].sort((a, b) => new Date(b.lastBidTime).getTime() - new Date(a.lastBidTime).getTime());
      }
    });
  }, []);

  useEffect(() => {
    if (user) {
      fetchGames()
      if (!user.token) {
        const token = user.token || jwt.sign(
          {
            userId: user?.id,
          },
          process.env.NEXT_PUBLIC_SECRET || "",
          {
            expiresIn: "48h",
          }
        );
        setUser({ ...user, token });
      }
    }

    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const { type, data } = JSON.parse(event.data);
        if (type === 'new-game' || type === 'game-update') {
          addOrUpdateGame(data);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    if (socket) {
      socket.addEventListener('message', handleWebSocketMessage);
    }

    return () => {
      if (socket) {
        socket.removeEventListener('message', handleWebSocketMessage);
      }
    }
  }, [socket, addOrUpdateGame, user, router, setUser])

  useEffect(() => {
    if (!user) {
      router.push("/?modal=login")
      return
    }
  }, [])
  const fetchGames = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/game')
      setGames(response.data.games.sort((a: Game, b: Game) => new Date(b.lastBidTime).getTime() - new Date(a.lastBidTime).getTime()))
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateGame = (gameData: GameData) => {
    sendMessage('create-game', gameData);
  }

  const handleOnClick = (gameStatus: boolean, gameId: number) => {
    if (gameStatus) {
      router.push(`/game/${gameId}`)
    } else {
      router.push(`/live/${gameId}`)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className='flex justify-between mb-6'>
        <h1 className="text-3xl font-bold">Active Games</h1>
        <CreateGame onCreateGame={handleCreateGame} />
      </div>
      {isLoading ? (
        <div className="space-y-4 min-h-screen">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="h-12 w-full bg-slate-300" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {/* <TableHead>Game ID</TableHead> */}
              <TableHead>Initial Bid</TableHead>
              <TableHead>Highest Bid</TableHead>
              <TableHead>Total Prize</TableHead>
              <TableHead>Total Bids</TableHead>
              <TableHead>Last Bid</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.map((game) => (
              <TableRow key={game.id} onClick={() => handleOnClick(game.gameEnded, game.id)}
                className='cursor-pointer hover:bg-slate-900'>
                {/* <TableCell> {game.gameId}</TableCell> */}
                <TableCell className='flex items-center'> <DollarSign size={12}/>{game.initialBidAmount}</TableCell>
                <TableCell> <span className='flex items-center'><DollarSign size={12}/> {game.highestBid}</span>  </TableCell>
                <TableCell  > <span className='flex items-center'><DollarSign size={12}/> {game.prizePool}</span></TableCell>
                <TableCell>{game.totalBids}</TableCell>
                <TableCell>{formatDistanceToNow(new Date(game.lastBidTime), { addSuffix: true })}</TableCell>
                <TableCell>
                  <Badge variant={game.gameEnded ? "secondary" : "default"}>
                    {game.gameEnded ? "Ended" : "Active"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}