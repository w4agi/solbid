'use client'
import {Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Award, DollarSign, RedoDot, Trophy } from 'lucide-react'
import { Player, GameData } from '@/types/game'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { LoadingSkeleton } from '@/components/skelton/loading-skelton'
import PlaceBid from '@/components/game/PlaceBid'
import { useSocket } from '@/context/socket-context'
import { useSession } from 'next-auth/react'

function Game({ params }: { params: { gameId: string } }) {
  const [loading, setLoading] = useState(false)
  const {gameId} = params
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const { socket, sendMessage } = useSocket()
  const session = useSession()

  const fetchGame = async () => {
    setLoading(true)
    try {
      const res = await axios.get("/api/game", { params: { id: gameId }})
      setGameData(res.data.game.gameData)
      setPlayers(res.data.game.gameData.players)
    } catch(error) {
      console.log("Error in fetching game", error)
    } finally {
      setLoading(false)
    }
  }

  const handleWebSocketMessage = (event: MessageEvent) => {
    try {
      const { type, data } = JSON.parse(event.data);
  
      if (type === 'game-update' && data.gameId === gameId) {
        setGameData((prevData: GameData | null) => {
          if (!prevData) return null;  
  
          const incomingPlayer: Player = data.players;  
          const existingPlayerIndex = prevData.players.findIndex(player => player.id === incomingPlayer.id);
  
          let updatedPlayers = [...prevData.players];
  
          if (existingPlayerIndex !== -1) {
            updatedPlayers[existingPlayerIndex] = { ...updatedPlayers[existingPlayerIndex], ...incomingPlayer };
          } else {
            updatedPlayers.push(incomingPlayer);
          }
  
          return {
            ...prevData,
            highestBid: data.highestBid,
            lastBidTime: data.lastBidTime,
            totalBids: data.totalBids,
            prizePool: data.prizePool,
            gameEnded: data.gameEnded,
            players: updatedPlayers,
          };
        });
  
        setPlayers((prevPlayers) => {
          const existingPlayerIndex = prevPlayers.findIndex(player => player.id === data.players.id);
  
          if (existingPlayerIndex !== -1) {
            const updatedPlayers = [...prevPlayers];
            updatedPlayers[existingPlayerIndex] = { ...updatedPlayers[existingPlayerIndex], ...data.players };
            return updatedPlayers;
          } else {
            return [...prevPlayers, data.players];
          }
        });
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  };
  
  useEffect(() => {
    fetchGame()

    if (socket) {
      socket.addEventListener('message', handleWebSocketMessage);
    }

    return () => {
      if (socket) {
        socket.removeEventListener('message', handleWebSocketMessage);
      }
    }
  }, [gameId, socket])

  const handlePlacebid = (gameData: GameData) => {
    sendMessage('place-bid', gameData);
  }
  
  if(loading) {
    return <LoadingSkeleton/>
  }

  return (
    <main className='bg-slate-800 p-12'>
    <div className="flex items-center justify-center mx-auto gap-12 w-10/12 px-4 py-8">
    <div className='flex justify-center flex-col w-full mx-auto'> 
      <Card className="bg-slate-900 text-slate-200 border-2 border-slate-700 pb-8">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700">
            <div className="p-6">
              <CardHeader className="px-0">
                <CardTitle className="flex items-center text-slate-100">
                  <Trophy className="mr-2 text-green-500" /> Current Highest Bid
                </CardTitle>
                <div className=" ml-8 mt-1 text-2xl font-bold text-green-500">
                  ${gameData?.highestBid.toFixed(2)}
                </div>
                <CardTitle className="mt-4 flex items-center text-slate-100">
                  <DollarSign className="mr-2 text-green-500" /> Total Prize Pool
                </CardTitle>
                <div className=" ml-8 mt-1 text-2xl font-bold text-green-500">
                  ${gameData?.prizePool.toFixed(2)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-400">
                  Last bid: {gameData?.lastBidTime ? new Date(gameData.lastBidTime).toLocaleString() : 'N/A'}
                </div>
              </CardContent>
            </div>

            <div className="p-6">
              <CardHeader className="px-0">
                <CardTitle className="flex items-center text-slate-100">
                  <Award className="mr-2 text-red-600" /> Place Your Bid
                </CardTitle>
              </CardHeader>
              <PlaceBid 
                gameId={parseInt(gameData?.gameId ?? "0")} 
                bidCount={gameData?.totalBids ?? 0}
                currBid = {gameData?.highestBid ?? 1}
                onPlaceBid={handlePlacebid}/>
            </div>
          </div>
        </CardContent>
      </Card>
 
      <div className="bg-slate-900 text-slate-200 border-t-[0.5px] border-slate-700 rounded-xl -mt-12">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-100 text-lg">
            Live Bids <RedoDot className="ml-2 text-blue-700" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 pb-2 border-b border-slate-700 font-semibold text-slate-300">
              <div>User</div>
              <div>Time</div>
              <div>Bet Amount</div>
            </div>
        
            {[...players].reverse().map((player) => {
              const isCurrentUser = session?.data?.user.id === player.user.id.toString();
              return (
                <div 
                  key={player.id} 
                  className={`grid grid-cols-3 gap-4 py-2 border-b-[0.5px] border-slate-700 items-center
                    ${isCurrentUser ? 'bg-slate-800/50 rounded-lg' : ''}`}
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className={`w-8 h-8 border-2 ${isCurrentUser ? 'border-blue-500' : 'border-slate-600'}`}>
                      <AvatarImage src={player?.user?.imageUrl || undefined} />
                      <AvatarFallback>{player?.user?.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className={`font-medium ${isCurrentUser ? 'text-blue-400' : ''}`}>
                        {player.user.name}
                        {isCurrentUser && <span className="ml-2 text-xs text-blue-400">(You)</span>}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {player.bidCount === 1 && (
                          <Badge variant="default" className="bg-green-600 text-slate-100 text-xs">
                            Creator
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm ${isCurrentUser ? 'text-blue-400' : 'text-slate-400'}`}>
                    {player.bid ? new Date(player.bid.timestamp).toLocaleString() : 'N/A'}
                  </div>
                  <div className={`text-sm ${isCurrentUser ? 'text-blue-400 font-medium' : 'text-slate-400'}`}>
                    {player.bid ? `$${player.bid.amount.toFixed(2)}` : 'N/A'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </div>
    </div>
    </div>
  </main>
  )
}

export default Game