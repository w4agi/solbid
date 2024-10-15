-- CreateEnum
CREATE TYPE "PlayerRole" AS ENUM ('PLAYER', 'WINNER', 'FINISHER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "imageUrl" TEXT,
    "provider" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTP" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "gameId" TEXT NOT NULL,
    "pda" TEXT NOT NULL,
    "initialBidAmount" INTEGER NOT NULL,
    "highestBid" INTEGER NOT NULL,
    "lastBidTime" TIMESTAMP(3) NOT NULL,
    "totalBids" INTEGER NOT NULL DEFAULT 0,
    "lastBidderId" TEXT NOT NULL,
    "prizePool" INTEGER NOT NULL,
    "platformFeePercent" INTEGER NOT NULL,
    "gameEnded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "playerPubkey" TEXT NOT NULL,
    "pda" TEXT NOT NULL,
    "totalBidAmount" INTEGER NOT NULL,
    "safe" BOOLEAN NOT NULL DEFAULT false,
    "royaltyEarned" INTEGER NOT NULL DEFAULT 0,
    "bidCount" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "role" "PlayerRole" NOT NULL DEFAULT 'PLAYER',
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" SERIAL NOT NULL,
    "pda" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "playerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameId" (
    "id" SERIAL NOT NULL,
    "currGameId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "GameId_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Game_gameId_key" ON "Game"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_playerId_key" ON "Bid"("playerId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
