 "use client"
import { BidHistory } from '@/components/game/BidHistory'
import { GameStatistics } from '@/components/game/GameStatistics.'
import { LoadingSkeleton } from '@/components/skelton/loading-skelton'
import { GameData } from '@/types/game'
import axios from 'axios'
import React, { Suspense, useEffect, useState } from 'react'

function page({ params }: { params: { gameId: string } }) {
  const {gameId} = params
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGameData = async () => {
      if (gameId) {
        try {
          const response = await axios.get(`/api/game`, { params: { id: gameId } })
          setGameData(response?.data?.game?.gameData)
        } catch (error) {
          console.error('Error fetching game data:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchGameData()
  }, [gameId])


  if(loading){
    return  <LoadingSkeleton/>
  }
  if(!gameData){
    return <LoadingSkeleton/>
  }
  return (
    <div className='flex bg-gray-900 justify-center '>
      <div className='mt-20 w-10/12'> 
      <Suspense fallback={<LoadingSkeleton />}>
        <GameStatistics gameData={gameData} />
        <BidHistory players={gameData?.players} />
      </Suspense>
      </div>
    </div>
  )
}

export default page