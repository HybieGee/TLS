'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface PlayerData {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  model: string;
  color: string;
  name: string;
  lastUpdate: number;
}

interface MultiplayerConfig {
  roomId?: string;
  playerName?: string;
  playerModel?: string;
  playerColor?: string;
}

export function useMultiplayer(config: MultiplayerConfig = {}) {
  const [players, setPlayers] = useState<Map<string, PlayerData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [playerId] = useState(() => crypto.randomUUID());
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const {
    roomId = 'main',
    playerName = 'Guest',
    playerModel = 'stick',
    playerColor = '#333333'
  } = config;

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/multiplayer/${roomId}?playerId=${playerId}`;
      
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('Connected to multiplayer');
        setIsConnected(true);
        
        // Send join message
        ws.current?.send(JSON.stringify({
          type: 'player_join',
          position: [0, 1.6, 0],
          rotation: [0, 0, 0],
          model: 'stick',
          color: playerColor,
          name: playerName
        }));
        
        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 10000);
      };
      
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'initial_state':
              const initialPlayers = new Map<string, PlayerData>();
              data.players.forEach((player: PlayerData) => {
                if (player.id !== playerId) {
                  initialPlayers.set(player.id, player);
                }
              });
              setPlayers(initialPlayers);
              break;
              
            case 'player_joined':
              if (data.player.id !== playerId) {
                setPlayers(prev => {
                  const newPlayers = new Map(prev);
                  newPlayers.set(data.player.id, data.player);
                  return newPlayers;
                });
              }
              break;
              
            case 'player_updated':
              if (data.player.id !== playerId) {
                setPlayers(prev => {
                  const newPlayers = new Map(prev);
                  newPlayers.set(data.player.id, data.player);
                  return newPlayers;
                });
              }
              break;
              
            case 'player_left':
              if (data.playerId !== playerId) {
                setPlayers(prev => {
                  const newPlayers = new Map(prev);
                  newPlayers.delete(data.playerId);
                  return newPlayers;
                });
              }
              break;
              
            case 'pong':
              // Keep connection alive
              break;
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
      
      ws.current.onclose = () => {
        console.log('Disconnected from multiplayer');
        setIsConnected(false);
        setPlayers(new Map());
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
      
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
    } catch (error) {
      console.error('Failed to connect to multiplayer:', error);
      setIsConnected(false);
    }
  }, [roomId, playerId, playerName, playerColor]);

  const sendPlayerUpdate = useCallback((update: Partial<PlayerData>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'player_update',
        ...update
      }));
    }
  }, []);

  const sendPosition = useCallback((position: [number, number, number], rotation?: [number, number, number]) => {
    sendPlayerUpdate({ position, rotation });
  }, [sendPlayerUpdate]);

  const updateCharacter = useCallback((model: string, color: string, name?: string) => {
    sendPlayerUpdate({ model, color, name });
  }, [sendPlayerUpdate]);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return {
    players: Array.from(players.values()),
    isConnected,
    playerId,
    sendPosition,
    updateCharacter,
    playerCount: players.size
  };
}