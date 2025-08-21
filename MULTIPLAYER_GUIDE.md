# Multiplayer Gallery Implementation Guide

## Overview
To allow players to see each other in the gallery, you'll need real-time multiplayer functionality. Here's how to implement it:

## Quick Solution: Using Existing Services

### Option 1: Cloudflare Durable Objects (Recommended)
Since you're already using Cloudflare Pages:

1. **Enable Durable Objects** in your Cloudflare dashboard
2. **Create a WebSocket handler** for real-time position updates
3. **Use the PlayerAvatar component** for displaying other players

### Option 2: Third-Party Services
- **Colyseus** - Open source multiplayer framework
- **Photon Fusion** - Unity-based but has web SDK
- **Mirror Networking** - Simple WebSocket solution
- **Y-Sweet** - Cloudflare-based multiplayer service

## Basic Implementation Example

### 1. Server-Side (Cloudflare Worker with Durable Objects)
```typescript
// app/api/multiplayer/route.ts
export class GalleryRoom {
  state: Map<string, PlayerState> = new Map();
  
  async fetch(request: Request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }
    
    const [client, server] = Object.values(new WebSocketPair());
    this.handleSession(server);
    
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
  
  handleSession(ws: WebSocket) {
    ws.accept();
    const id = crypto.randomUUID();
    
    ws.addEventListener('message', async (msg) => {
      const data = JSON.parse(msg.data);
      
      if (data.type === 'move') {
        this.state.set(id, {
          position: data.position,
          rotation: data.rotation,
          model: data.model,
          color: data.color,
          name: data.name
        });
        
        // Broadcast to all other players
        this.broadcast(id, data);
      }
    });
    
    ws.addEventListener('close', () => {
      this.state.delete(id);
      this.broadcast(id, { type: 'leave', id });
    });
  }
}
```

### 2. Client-Side Integration
```typescript
// app/hooks/useMultiplayer.ts
import { useState, useEffect, useRef } from 'react';

export function useMultiplayer(roomId: string) {
  const [players, setPlayers] = useState<Map<string, PlayerData>>(new Map());
  const ws = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    // Connect to WebSocket
    ws.current = new WebSocket(`wss://your-worker.workers.dev/room/${roomId}`);
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'playerUpdate') {
        setPlayers(prev => {
          const newPlayers = new Map(prev);
          newPlayers.set(data.id, data);
          return newPlayers;
        });
      }
    };
    
    return () => ws.current?.close();
  }, [roomId]);
  
  const sendPosition = (position: [number, number, number]) => {
    ws.current?.send(JSON.stringify({
      type: 'move',
      position,
      model: localStorage.getItem('playerModel') || 'capsule',
      color: localStorage.getItem('playerColor') || '#4A90E2',
      name: localStorage.getItem('playerName') || 'Guest'
    }));
  };
  
  return { players, sendPosition };
}
```

### 3. Gallery Integration
```typescript
// In Gallery3D.tsx
import { PlayerAvatar } from './PlayerAvatar';
import { useMultiplayer } from '@/hooks/useMultiplayer';

function GalleryScene() {
  const { players, sendPosition } = useMultiplayer('main-gallery');
  
  // Send position updates
  useFrame(() => {
    if (camera.position) {
      sendPosition([camera.position.x, camera.position.y, camera.position.z]);
    }
  });
  
  return (
    <>
      {/* Existing gallery content */}
      
      {/* Render other players */}
      {Array.from(players.values()).map(player => (
        <PlayerAvatar
          key={player.id}
          position={player.position}
          color={player.color}
          name={player.name}
        />
      ))}
    </>
  );
}
```

## Available Player Models

The `PlayerAvatar.tsx` component includes 3 preset models:

1. **Capsule** - Simple rounded character (default)
2. **Cube Bot** - Blocky robot style
3. **Stick Figure** - Minimalist stick person

Each model supports:
- Custom colors
- Name labels
- Smooth animations
- Low polygon count for performance

## Character Selection UI

Add this to your homepage or settings:

```typescript
// app/components/CharacterSelector.tsx
import { characterModels } from './PlayerAvatar';

export function CharacterSelector() {
  const [selectedModel, setSelectedModel] = useState('capsule');
  const [selectedColor, setSelectedColor] = useState('#4A90E2');
  
  const handleSave = () => {
    localStorage.setItem('playerModel', selectedModel);
    localStorage.setItem('playerColor', selectedColor);
  };
  
  return (
    <div>
      <h3>Choose Your Avatar</h3>
      {Object.entries(characterModels).map(([key, model]) => (
        <button key={key} onClick={() => setSelectedModel(key)}>
          {model.name}
        </button>
      ))}
      
      <h3>Choose Color</h3>
      {characterModels[selectedModel].colors.map(color => (
        <button 
          key={color}
          style={{ backgroundColor: color }}
          onClick={() => setSelectedColor(color)}
        />
      ))}
      
      <button onClick={handleSave}>Save Character</button>
    </div>
  );
}
```

## Performance Considerations

1. **Limit update frequency** - Send position updates max 10-30 times per second
2. **Use interpolation** - Smooth movement between updates
3. **Culling** - Only render players within view distance
4. **LOD (Level of Detail)** - Simpler models for distant players
5. **Room limits** - Cap at 20-50 players per gallery instance

## Quick Start (Without Backend)

For testing without a backend, you can use a mock multiplayer:

```typescript
// Add to Gallery3D.tsx for testing
const mockPlayers = [
  { id: '1', position: [-5, 0, 0], color: '#E94B3C', name: 'Alice' },
  { id: '2', position: [5, 0, 0], color: '#6BCB77', name: 'Bob' },
  { id: '3', position: [0, 0, -5], color: '#FFD93D', name: 'Charlie' }
];

// In your scene
{mockPlayers.map(player => (
  <PlayerAvatar key={player.id} {...player} />
))}
```

## Next Steps

1. Choose a multiplayer service (Cloudflare Durable Objects recommended)
2. Implement WebSocket connection
3. Add player model selection to homepage
4. Test with multiple browser tabs
5. Add features like chat, emotes, etc.

The PlayerAvatar component is ready to use - you just need to connect the multiplayer backend!