# Proximity Voice Chat Implementation Plan

## Overview
Adding proximity voice chat to The Living Sketchbook would allow visitors to talk to nearby people in the 3D gallery, creating a more social and interactive experience.

## Technical Requirements

### 1. Real-time Communication Infrastructure
- **WebRTC** for peer-to-peer voice communication
- **Socket.IO** or similar for real-time signaling
- **STUN/TURN servers** for NAT traversal

### 2. Backend Components Needed
- WebSocket server for user position tracking
- Signaling server for WebRTC connections
- User session management
- Spatial audio calculation

### 3. Frontend Components
- Microphone access (getUserMedia)
- WebRTC peer connections
- Spatial audio processing
- UI for mute/unmute controls

## Implementation Complexity: HIGH

### Challenges:
1. **Real-time sync**: User positions must be synchronized across all clients
2. **Audio quality**: Managing multiple audio streams without overlap
3. **Proximity calculation**: 3D distance-based audio volume
4. **Scaling**: Managing many simultaneous voice connections
5. **Privacy**: Microphone permissions and user consent
6. **Latency**: Minimizing audio delay for natural conversation

## Estimated Development Time: 2-4 weeks

## Alternative: Third-party Solutions
- **Agora.io** - Voice/video SDK with spatial audio
- **Twilio Programmable Voice** - Communication APIs  
- **Dolby.io** - Spatial audio platform
- **Discord/TeamSpeak integration** - Existing voice solutions

## Recommendation
Given the complexity, consider starting with a simpler text chat system or integrating with an existing voice service rather than building from scratch.

## Basic Framework (if proceeding):

```typescript
// User position tracking
interface User {
  id: string;
  position: [number, number, number];
  isConnected: boolean;
  isMuted: boolean;
}

// Proximity voice manager
class ProximityVoiceChat {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  
  async init() {
    // Get microphone access
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Connect to signaling server
    // Set up peer connections
    // Handle proximity-based volume
  }
  
  updateUserPosition(position: [number, number, number]) {
    // Send position to server
    // Update audio volumes based on distance
  }
  
  private calculateAudioVolume(distance: number): number {
    // Inverse square law for realistic audio falloff
    const maxDistance = 10; // Maximum hearing distance
    return Math.max(0, 1 - (distance / maxDistance));
  }
}
```

## Next Steps if Implementing:
1. Set up WebSocket server for position tracking
2. Implement basic peer-to-peer connections
3. Add proximity-based audio volume
4. Create UI controls for voice chat
5. Test with multiple users
6. Optimize for performance and quality