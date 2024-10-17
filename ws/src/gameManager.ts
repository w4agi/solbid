import { WebSocket } from "ws";
import dotenv from "dotenv";
import { Game, Player} from "./types";
import { createGame } from "./createGame";
dotenv.config();

class GameManager {
  private static instance: GameManager;
  private games: Map<number, Game> = new Map();
  private clients: Set<WebSocket> = new Set();

  private constructor() {}

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  addClient(ws: WebSocket) {
    this.clients.add(ws);
    console.log(`New client connected. Total clients: ${this.clients.size}`);
  }

  removeClient(ws: WebSocket) {
    this.clients.delete(ws);
    console.log(`Client disconnected. Total clients: ${this.clients.size}`);
  }

  addGame(game: Game) {
    const gameId = game.id;
    if (!this.games.has(gameId)) {
      this.games.set(gameId, game);
      this.broadcastNewGame(game);
      console.log(`New game added: ${gameId}`);
    } else {
      console.log(`Game ${gameId} already exists. Ignoring duplicate.`);
    }
  }

  updateGame(gameId: number, data: any) {
    const game = this.games.get(gameId);
    if (game) {
      this.updateGameData(game, data);
      this.broadcastBidUpdate(game);
    } else {
      const newGame = createGame(data);
      this.addGame(newGame);
    }
  }

  private updateGameData(game: Game, data: any) {
    Object.assign(game, {
      ...data,
      players: this.updatePlayerData(game.players, data.players[0])
    });
    console.log(`Game ${game.id} updated with new bid: ${game.players.bid?.id}`);
  }

  private updatePlayerData(player: Player, playerData: any): Player {
    return {
      ...player,
      ...playerData,
      bid: playerData.bid ? {
        id: playerData.bid.id,
        amount: playerData.bid.amount,
        timestamp: new Date(playerData.bid.timestamp).toISOString()
      } : null,
      user: { ...playerData.user }
    };
  }

  private broadcastNewGame(game: Game) {
    this.broadcast({ type: "new-game", data: game });
  }

  private broadcastBidUpdate(game: Game) {
    this.broadcast({ type: "game-update", data: game });
  }

  private broadcast(message: object) {
    const msgString = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msgString);
      }
    });
  }
}

export default GameManager;
