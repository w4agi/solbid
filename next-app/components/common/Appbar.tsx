"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Menu, X } from 'lucide-react'
import { useRouter} from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import WalletBalance from './WalletBalance'

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

  const navbarBackground = scrollY > 20 ? "bg-slate-900/90 backdrop-blur-md" : " bg-slate-800/50"

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarBackground}`}>
      <nav className="container mx-auto px-4 sm:px-12 py-2 flex justify-between items-center">
        <motion.div 
          className="text-2xl font-bold bg-clip-text cursor-pointer text-transparent bg-gradient-to-r from-yellow-400 to-orange-500"
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
            <Button onClick={() => router.push("/home")} className="w-full md:w-auto mt-2 md:mt-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 hover:from-yellow-500 hover:to-orange-600 transition-all duration-300">
                  Home
            </Button>
            {session.data?.user ? (
              <li className='flex gap-2'>
                <WalletBalance/>
                <Button onClick={() =>
                    signOut({
                      callbackUrl: "/",
                    })
                  } variant="outline" className="w-full md:w-auto mt-2 md:mt-0 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 transition-all duration-300">
                  Logout
                </Button>
                <WalletMultiButton/>
              </li>
            ) : (
              <>
                <li>
                  <Button onClick={() => router.push("/?modal=login")} variant="outline" className="w-full md:w-auto mt-2 md:mt-0 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 transition-all duration-300">
                    Login
                  </Button>
                </li>
                <li>
                  <Button onClick={() => router.push("/?modal=signup")} className="w-full md:w-auto mt-2 md:mt-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 hover:from-yellow-500 hover:to-orange-600 transition-all duration-300">
                    Sign Up
                  </Button>
                </li>
              </>
            )}
            </motion.ul>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}