/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock types and classes for development/build
let DurableObject: any;
let WebSocketPair: any;

if (typeof globalThis !== 'undefined' && (globalThis as any).DurableObject) {
  DurableObject = (globalThis as any).DurableObject;
  WebSocketPair = (globalThis as any).WebSocketPair;
} else {
  // Mock implementations for development
  DurableObject = class {
    ctx: any;
    env: any;
    
    constructor(ctx: any, env: any) {
      this.ctx = ctx;
      this.env = env;
    }
  };

  WebSocketPair = class {
    constructor() {
      return [
        { close: () => {}, send: () => {} },
        { 
          accept: () => {},
          close: () => {},
          send: () => {},
          addEventListener: () => {},
          readyState: 1
        }
      ];
    }
  };
}

// Player state interface
interface PlayerState {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  model: string;
  color: string;
  name: string;
  lastUpdate: number;
}

// Durable Object for gallery rooms
export class GalleryRoom extends DurableObject {
  private players: Map<string, PlayerState> = new Map();
  private connections: Map<string, any> = new Map();

  constructor(ctx: any, env: any) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const [client, server] = Object.values(new WebSocketPair()) as [any, any];
      this.handleSession(server as any, url.searchParams.get("playerId") || crypto.randomUUID());
      
      return new Response(null, {
        status: 101,
        ...(client && { webSocket: client })
      } as any);
    }

    // Handle HTTP requests for room info
    if (url.pathname.endsWith("/players")) {
      return new Response(JSON.stringify({
        playerCount: this.players.size,
        players: Array.from(this.players.values())
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not found", { status: 404 });
  }

  private handleSession(websocket: any, playerId: string): void {
    websocket.accept();
    
    this.connections.set(playerId, websocket);
    
    // Send existing players to new player
    websocket.send(JSON.stringify({
      type: "initial_state",
      players: Array.from(this.players.values())
    }));

    websocket.addEventListener("message", async (event: any) => {
      try {
        const data = JSON.parse(event.data as string);
        
        switch (data.type) {
          case "player_update":
            this.handlePlayerUpdate(playerId, data);
            break;
          case "player_join":
            this.handlePlayerJoin(playerId, data);
            break;
          case "ping":
            websocket.send(JSON.stringify({ type: "pong" }));
            break;
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });

    websocket.addEventListener("close", () => {
      this.handlePlayerLeave(playerId);
    });

    websocket.addEventListener("error", (error: any) => {
      console.error("WebSocket error:", error);
      this.handlePlayerLeave(playerId);
    });
  }

  private handlePlayerJoin(playerId: string, data: any): void {
    const playerState: PlayerState = {
      id: playerId,
      position: data.position || [0, 1.6, 0],
      rotation: data.rotation || [0, 0, 0],
      model: data.model || "stick",
      color: data.color || "#333333",
      name: data.name || "Guest",
      lastUpdate: Date.now()
    };

    this.players.set(playerId, playerState);
    
    // Notify all other players
    this.broadcast(playerId, {
      type: "player_joined",
      player: playerState
    });
  }

  private handlePlayerUpdate(playerId: string, data: any): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // Update player state
    if (data.position) player.position = data.position;
    if (data.rotation) player.rotation = data.rotation;
    if (data.model) player.model = data.model;
    if (data.color) player.color = data.color;
    if (data.name) player.name = data.name;
    player.lastUpdate = Date.now();

    this.players.set(playerId, player);

    // Broadcast update to all other players
    this.broadcast(playerId, {
      type: "player_updated",
      player: player
    });
  }

  private handlePlayerLeave(playerId: string): void {
    this.players.delete(playerId);
    this.connections.delete(playerId);
    
    // Notify all other players
    this.broadcast(playerId, {
      type: "player_left",
      playerId: playerId
    });
  }

  private broadcast(excludePlayerId: string, message: any): void {
    const messageStr = JSON.stringify(message);
    
    for (const [id, connection] of this.connections) {
      if (id !== excludePlayerId && connection.readyState === 1) {
        try {
          connection.send(messageStr);
        } catch (error) {
          console.error("Error broadcasting to player:", id, error);
          this.connections.delete(id);
        }
      }
    }
  }

  // Cleanup inactive players periodically
  async alarm(): Promise<void> {
    const now = Date.now();
    const timeoutMs = 30000; // 30 seconds

    for (const [playerId, player] of this.players) {
      if (now - player.lastUpdate > timeoutMs) {
        this.handlePlayerLeave(playerId);
      }
    }

    // Schedule next cleanup
    this.ctx.storage.setAlarm(Date.now() + 10000); // 10 seconds
  }
}