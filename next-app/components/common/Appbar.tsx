"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import {  Menu, X } from 'lucide-react'
import { useRouter} from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import WalletBalance from './WalletBalance'
import { CiLogout } from "react-icons/ci";
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import "../../styles/wallet.css"


export default function Appbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const router = useRouter()
  const session = useSession()

  useEffect(() => {
    if (typeof window !== "undefined"){
      const handleScroll = () => setScrollY(window.scrollY)
      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const navbarBackground = scrollY > 20 ? "bg-slate-900/90 backdrop-blur-md" : " bg-slate-900/30"

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarBackground}`}>
      <nav className="container w-full md:w-6/12 mx-auto  py-3 flex justify-between items-center">
        <motion.div 
          className="text-2xl   font-bold font-serif bg-clip-text cursor-pointer text-transparent text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => router.push("/")}
        >
          SolBid
        </motion.div>
        <div className="md:hidden">
          <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
        <AnimatePresence>
          {(isMenuOpen || window.innerWidth > 768) && (
            <motion.ul 
              className={`md:flex md:space-x-6 items-center ${isMenuOpen ? 'flex flex-col absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-md p-4' : 'hidden'} md:relative md:p-0 md:bg-transparent`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
            {session.data?.user ? (
              <li className='flex flex-col md:flex-row gap-8 items-center'>
                <Link href={"/home"}
                 className='block py-2 px-3 text-lg text-white   rounded hover:bg-gray-100 
                 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white
                  md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent'>
                Games
                </Link>
                <WalletBalance/>
                <WalletMultiButton  className="wallet-button"/>
                <div className='flex items-center justify-center'>
                <CiLogout size={32} 
                className='text-white rotate-90 font-semibold cursor-pointer'
                onClick={() =>
                    signOut({
                      callbackUrl: "/",
                    })
                  }>
                </CiLogout>
                </div>
                <Link href={"/dashboard"}>
                <Avatar>
                  <AvatarImage src="dddd" alt="@shadcn" />
                  <AvatarFallback >{session?.data.user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                </Link>
              </li>
            ) : (
              <>
          
                  <Link  href='/?modal=login'  
                 className='block py-2 px-3 text-lg text-white font-serif rounded hover:bg-gray-100 
                 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white
                  md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent' >
                    Login
                  </Link>
              
               
                  <Link  href='/?modal=signup' 
                  className='block py-2 px-3 text-lg text-white   font-serif rounded hover:bg-gray-100 
                  md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white
                   md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent' >
                    Signup
                  </Link>
              
              </>
            )}
            </motion.ul>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}