import AllGames from '@/components/game/AllGames'
import { getServerSession } from 'next-auth';
import React from 'react'
import { Redirect } from '@/components/Redirect';

export default async function Home() {
  const session = await getServerSession();

  if (!session?.user) {
    return <Redirect to={'/?modal=login'} />;
  }
  return (
    <main className='bg-slate-800 p-12'>
      <div className="flex items-center min-h-screen justify-center mx-auto gap-12 w-10/12 px-4 py-8">
        <AllGames/>
      </div>
    </main>
  )
}