'use client'

import React, { useEffect } from 'react'
import { ArrowRight, GitBranch, Router, Twitter } from 'lucide-react'
import { Sparkles, Zap, Crown, Shield, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FaGithub } from "react-icons/fa"
import { BsTwitterX } from "react-icons/bs"
import Link from 'next/link'
import { motion, useAnimation, useScroll } from 'framer-motion'

export default function LandingPage() {
  const controls = useAnimation()
  const { scrollY } = useScroll()
 

  useEffect(() => {
    const unsubscribe = scrollY.onChange((latest) => {
      if (latest > 100) {
        controls.start('visible')
      } else {
        controls.start('hidden')
      }
    })

    return () => unsubscribe()
  }, [controls, scrollY])

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex justify-center bg-slate-800 mx-auto"
    >
      <section>
        <div className="container font-serif">
          <motion.div
            variants={itemVariants}
            className="flex flex-col w-full lg:w-6/12 items-center justify-center pt-32 text-center lg:mx-auto lg:items-start lg:px-0 lg:text-left"
          >
            <div className="container mx-auto px-4">
              <div className="flex flex-col items-center text-center lg:flex-row lg:text-left">
                <div className="lg:w-1/2">
                  <h1 className="mb-6 text-4xl font-bold lg:text-6xl text-white">
                    An Online, Competitive Bidding Game
                  </h1>
                  
                  <Link href={"/?modal=signup"} className='text-white ml-2 border rounded-sm border-blue-600 py-2.5 px-5 
                  hover:bg-blue-500
                  bg-blue-600'>
                  Sign up
                  </Link>
                  
                </div>
                <div className="mt-8 lg:mt-0 lg:w-1/2 lg:pl-12">
                  <p className="text-lg text-gray-400 leading-8">
                    Outbid your opponents in a fast-paced game that rewards early decisions and timely bids. 
                    With unique royalty incentives for early participants, you're always balancing risk and rewards.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            variants={containerVariants}
            className='flex items-center justify-center mt-24 flex-wrap'
          >
            <div className='border-r border-slate-700 flex flex-col'>   
              <motion.div variants={itemVariants} className='border-b border-slate-700 p-12'>
                <section className="bg-gradient-to-br from-slate-700 to-slate-800 p-6 rounded-xl backdrop-blur-sm border border-yellow-500/20 hover:border-slate-500/50 transition-all 
                  duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-500/20">
                  <Crown className="w-10 h-10 mb-4 text-yellow-400" />
                  <h3 className="text-lg font-semibold mb-2 text-yellow-400">Winner</h3>
                  <p className="text-gray-400 text-sm">Winner claims the grand prize</p>
                </section>
              </motion.div>
              <motion.div variants={itemVariants} className='p-12'>
                <section className="bg-gradient-to-br from-slate-700 to-slate-800 p-6 rounded-xl backdrop-blur-sm border border-yellow-500/20 hover:border-slate-500/50 transition-all 
                  duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-500/20">
                  <Zap className="w-10 h-10 mb-4 text-yellow-400" />
                  <h3 className="text-lg font-semibold mb-2 text-yellow-400">Dynamic Bidding</h3>
                  <p className="text-gray-400 text-sm">Double the previous bid to enter in the game</p>
                </section>
              </motion.div>
            </div>
            <div className='flex flex-col'>
              <motion.div variants={itemVariants} className='border-b border-slate-700 p-12'>
                <section className="bg-gradient-to-br from-slate-700 to-slate-800 p-6 rounded-xl backdrop-blur-sm border border-yellow-500/20 hover:border-slate-500/50 transition-all 
                  duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-500/20">
                  <Coins className="w-10 h-10 mb-4 text-yellow-400" />
                  <h3 className="text-lg font-semibold mb-2 text-yellow-400">Royalty System</h3>
                  <p className="text-gray-400 text-sm">Earn rewards even if you don't win</p>
                </section>
              </motion.div>
              <motion.div variants={itemVariants} className='p-12'>
                <section className="bg-gradient-to-br from-slate-700 to-slate-800 p-6 rounded-xl backdrop-blur-sm border border-yellow-500/20 hover:border-slate-500/50 transition-all 
                  duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-500/20">
                  <Shield className="w-10 h-10 mb-4 text-yellow-400" />
                  <h3 className="text-lg font-semibold mb-2 text-yellow-400">Safety Threshold</h3>
                  <p className="text-gray-400 text-sm">Become 'safe' once 5 bids have been made</p>
                </section>
              </motion.div>
            </div>
          </motion.div>
          <motion.div
            variants={containerVariants}
            className='flex flex-col items-center justify-center mb-24 mt-24'
          >
            <motion.p variants={itemVariants} className="mb-8 text-lg text-gray-400">
              Will you claim victory or miss out on the final win?
            </motion.p>
            <motion.div variants={itemVariants} className="flex justify-center lg:justify-start">
              <Link  href={"/home"} className="w-full sm:w-auto text-black items-center justify-center bg-white px-4 py-3 rounded-md flex">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
          <motion.div
            variants={containerVariants}
            className='border-t p-8 gap-12 border-slate-600 flex items-center justify-center'
          >
            <motion.div variants={itemVariants}>
              <Link href={"https://github.com/rahulwagh07/solbid"} target='_blank'>
                <FaGithub size={24} className="text-white hover:text-yellow-400 transition-colors" />
              </Link>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Link href={"https://x.com/_rahulwagh"} target='_blank'>
                <BsTwitterX size={24} className="text-white hover:text-yellow-400 transition-colors" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  )
}