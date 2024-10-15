import AllGames from '@/components/game/AllGames'
import React from 'react'

export default function Home() {
  return (
    <main className="flex items-center justify-center mx-auto mt-28 gap-12 w-10/12 px-4 py-8">
      <AllGames/>
    </main>
  )
}