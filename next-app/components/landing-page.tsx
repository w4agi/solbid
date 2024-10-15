"use client"
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Sparkles, Zap, Crown, ChevronRight, Shield, Coins } from 'lucide-react'
import { Suspense } from 'react'
import { LandingPageSkeleton } from './skelton/landing-page-skelton'

export default function LandingPage() {

  return (
  <Suspense fallback={<LandingPageSkeleton/>}>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      <main className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-10/12 mx-auto backdrop-blur-md -mt-8 md:p-12">
          <motion.section 
            className="text-center mb-24"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 } }
            }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 leading-tight">
              Bid. Double. Dominate.
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Enter the thrilling world of SolBid Royale, where strategic bidding leads to royal rewards on Solana.
            </p>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 text-xl py-6 px-12 rounded-full hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-lg shadow-orange-500/30">
                Place Your Bid <ChevronRight className="ml-2 h-6 w-6" />
              </Button>
            </motion.div>
          </motion.section>

          <motion.section 
            className="mb-24"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.4 } }
            }}
          >
            <h2 className="text-4xl font-bold mb-8 text-yellow-400 text-center">About SolBid Royale</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xl text-gray-300 mb-6">
                  SolBid Royale is a high-stakes Solana-based game where players compete through strategic bidding. Double the previous bid, aim for safety, and reap royal rewards!
                </p>
                <div className="flex flex-col sm:flex-row justify-start space-y-4 sm:space-y-0 sm:space-x-6">
                  <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 px-8 py-3 text-lg rounded-full shadow-lg shadow-orange-500/30">
                    How to Play
                  </Button>
                  <Button variant="outline" className="border-2 border-yellow-400  bg-yellow-400 text-slate-900 transition-all duration-300 px-8 py-3 text-lg rounded-full">
                    Watch Gameplay
                  </Button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: Zap, title: "Dynamic Bidding", description: "Double the previous bid to stay in the game" },
                  { icon: Shield, title: "Safety Threshold", description: "Become 'safe' after 5 subsequent bids" },
                  { icon: Coins, title: "Royalty System", description: "Earn rewards even if you don't win" },
                  { icon: Crown, title: "Winner Takes All", description: "Last bidder claims the grand prize" }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    className="bg-gradient-to-br from-slate-700 to-slate-800 p-6 rounded-xl backdrop-blur-sm border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/20"
                    whileHover={{ scale: 1.05 }}
                  >
                    <item.icon className="w-10 h-10 mb-4 text-yellow-400" />
                    <h3 className="text-lg font-semibold mb-2 text-yellow-400">{item.title}</h3>
                    <p className="text-gray-300 text-sm">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section 
            className="grid md:grid-cols-3 gap-8 mb-24"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.6, staggerChildren: 0.2 } }
            }}
          >
            {[
              { icon: Sparkles, title: "24-Hour Thrill", description: "Game continues until 24 hours pass without a new bid, keeping the excitement alive." },
              { icon: Zap, title: "Solana-Powered", description: "Lightning-fast transactions and low fees, powered by Solana blockchain technology." },
              { icon: Crown, title: "Strategic Rewards", description: "Unique royalty system rewards early bidders, adding layers of security to early bidders." }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className="bg-gradient-to-br from-slate-700 to-slate-800 p-8 rounded-2xl backdrop-blur-sm border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-500/20"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <feature.icon className="w-16 h-16 mb-6 text-yellow-400" />
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">{feature.title}</h3>
                <p className="text-gray-300 text-lg">{feature.description}</p>
              </motion.div>
            ))}
          </motion.section>

          <motion.section 
            className="text-center mb-24"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.8 } }
            }}
          >
            <h2 className="text-4xl font-bold mb-6 text-yellow-400">Ready to Bid?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join SolBid Royale now and start your journey to the crown!
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 px-12 py-4 text-xl rounded-full shadow-lg shadow-orange-500/30">
                Start Bidding
              </Button>
              <Button variant="outline" className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 transition-all duration-300 px-12 py-4 text-xl rounded-full">
                Learn Strategy
              </Button>
            </div>
          </motion.section>
        </div>
      </main>

      <footer className="relative z-10 container mx-auto px-4 py-8 text-center text-gray-400">
        <p>&copy; 2024 SolBid Royale. All rights reserved.</p>
      </footer>
    </div>
    </Suspense>
  )
}