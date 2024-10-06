"use client"
import React from 'react'
import Link from 'next/link'
import { signOut, useSession } from "next-auth/react";
import { Button } from './ui/button';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ModeToggle } from './ui/theme';
 
function Appbar() {
  const session = useSession()
  return (
    <div className='flex items-center justify-between sm:justify-center text-black dark:text-white'>
     <div  className="flex z-50 items-center justify-between align-baseline px-2  gap-2 
        mb-4 py-1.5 w-full  mx-20 h-16 border-b border-gray-300">
      <Link href="/" className='font-semibold flex gap-1 items-center justify-center'>
       <span className='text-lg'>Home</span>
      </Link>
      <div className='flex gap-2'>
      {session.data?.user && (
          <div className='flex gap-2'>
           <Button
            className="bg-purple-600 text-white hover:bg-purple-700"
            onClick={() =>
              signOut({
                callbackUrl: "/",
              })
            }
          >
            Logout
          </Button>
           <div>
           <WalletMultiButton/>
           </div>
        </div>
        )}
         
        {!session.data?.user && (
           <>
            <Link href="/auth?modal=login" className='flex gap-1 items-center justify-center'>
            <span  >Sign in</span>
            </Link>
            <Link href="/auth?modal=signup" className='flex gap-1 items-center ml-4 justify-center text-white bg-blue-500 hover:bg-blue-600 py-2 px-3 rounded-sm'>
            <span>Register</span>
            </Link>
           </>
        )}
        <ModeToggle/>
      </div>
   </div>
   </div>
  )
}

export default Appbar