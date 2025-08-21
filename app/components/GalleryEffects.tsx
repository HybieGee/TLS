'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';

// Audio management hook
function useGalleryAudio() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const footstepRef = useRef<HTMLAudioElement | null>(null);
  const lastFootstepTime = useRef(0);

  useEffect(() => {
    // Create ambient audio
    const ambient = new Audio('/audio/ambient-gallery.mp3');
    ambient.loop = true;
    ambient.volume = 0.3;
    ambientRef.current = ambient;

    // Create footstep audio
    const footstep = new Audio('/audio/footstep.mp3');
    footstep.volume = 0.5;
    footstepRef.current = footstep;

    return () => {
      ambient.pause();
      footstep.pause();
    };
  }, []);

  const enableAudio = async () => {
    if (!isAudioEnabled && ambientRef.current) {
      try {
        await ambientRef.current.play();
        setIsAudioEnabled(true);
      } catch (error) {
        console.log('Audio autoplay blocked, waiting for user interaction');
      }
    }
  };

  const playFootstep = () => {
    const now = Date.now();
    if (footstepRef.current && now - lastFootstepTime.current > 400) {
      footstepRef.current.currentTime = 0;
      footstepRef.current.play().catch(() => {});
      lastFootstepTime.current = now;
    }
  };

  return { enableAudio, playFootstep, isAudioEnabled };
}

// Audio trigger component
export function AudioTrigger() {
  const { enableAudio, playFootstep } = useGalleryAudio();
  const { camera } = useThree();
  const lastPosition = useRef(new THREE.Vector3());
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleInteraction = () => {
      if (!hasInteracted) {
        enableAudio();
        setHasInteracted(true);
      }
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [hasInteracted, enableAudio]);

  useFrame(() => {
    const currentPosition = camera.position;
    const distance = currentPosition.distanceTo(lastPosition.current);
    
    if (distance > 0.2 && hasInteracted) {
      playFootstep();
      lastPosition.current.copy(currentPosition);
    }
  });

  return null;
}

// Floating dust particles for atmosphere
export function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 100;
  
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      sizes[i] = Math.random() * 0.05 + 0.02;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geometry;
  }, []);
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.0001;
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        const y = positions[i * 3 + 1];
        positions[i * 3 + 1] = y + Math.sin(state.clock.elapsedTime + i) * 0.001;
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={particlesRef} geometry={particles}>
      <pointsMaterial
        color="#888888"
        size={0.05}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Animated frames that gently float
export function AnimatedFrames({ children }: { children: React.ReactNode }) {
  return (
    <Float 
      speed={2}
      rotationIntensity={0.01}
      floatIntensity={0.1}
      floatingRange={[-0.05, 0.05]}
    >
      {children}
    </Float>
  );
}

// Proximity detector for artworks with interactive info panels
export function ProximityGlow({ position, name }: { position: [number, number, number], name: string }) {
  const { camera } = useThree();
  const [isNear, setIsNear] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const meshRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'e' && isNear) {
        setShowInfo(!showInfo);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isNear, showInfo]);
  
  useFrame(() => {
    const distance = camera.position.distanceTo(new THREE.Vector3(...position));
    const nearThreshold = 4;
    const newIsNear = distance < nearThreshold;
    
    if (newIsNear !== isNear) {
      setIsNear(newIsNear);
      if (!newIsNear) {
        setShowInfo(false);
      }
    }
    
    // Smooth glow transition
    const targetOpacity = isNear ? 0.2 : 0;
    setOpacity((prev) => prev + (targetOpacity - prev) * 0.1);
    
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  });

  const artworkInfo = {
    'Artwork001': { title: 'Submission #001', description: 'First artwork in the gallery', votes: '12 votes' },
    'Artwork002': { title: 'Submission #002', description: 'Creative character design', votes: '8 votes' },
    'Artwork003': { title: 'Submission #003', description: 'Artistic interpretation', votes: '15 votes' },
    'Artwork004': { title: 'Submission #004', description: 'Unique sketch style', votes: '6 votes' },
    'Artwork005': { title: 'Submission #005', description: 'Bold design choice', votes: '20 votes' },
    'Artwork007': { title: 'Submission #007', description: 'Detailed artwork', votes: '9 votes' },
    'Large Artwork': { title: 'Featured Piece', description: 'Current hourly winner', votes: '45 votes' }
  };

  const info = artworkInfo[name as keyof typeof artworkInfo] || { title: name, description: 'Coming soon...', votes: '0 votes' };
  
  return (
    <>
      {/* Subtle glow effect */}
      <mesh ref={meshRef} position={position}>
        <planeGeometry args={[3, 2]} />
        <meshBasicMaterial 
          color="#ffff99" 
          transparent 
          opacity={opacity}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Interaction prompt */}
      {isNear && !showInfo && (
        <Text
          position={[position[0], position[1] - 1.5, position[2] + 0.1]}
          fontSize={0.12}
          color="black"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="white"
        >
          Press E to view details
        </Text>
      )}
      
      {/* Info panel */}
      {showInfo && (
        <group position={[position[0] + 2, position[1], position[2] + 0.5]}>
          {/* Background panel */}
          <mesh>
            <planeGeometry args={[2.5, 1.5]} />
            <meshBasicMaterial color="white" transparent opacity={0.9} />
          </mesh>
          
          {/* Border */}
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[2.5, 1.5]} />
            <meshBasicMaterial color="black" transparent opacity={0.8} />
          </mesh>
          
          <mesh position={[0, 0, 0.002]}>
            <planeGeometry args={[2.3, 1.3]} />
            <meshBasicMaterial color="white" />
          </mesh>
          
          {/* Info text */}
          <Text
            position={[0, 0.4, 0.003]}
            fontSize={0.08}
            color="black"
            anchorX="center"
            anchorY="middle"
            font="/fonts/mono.woff"
          >
            {info.title}
          </Text>
          
          <Text
            position={[0, 0.1, 0.003]}
            fontSize={0.06}
            color="#666666"
            anchorX="center"
            anchorY="middle"
            font="/fonts/mono.woff"
            maxWidth={2}
          >
            {info.description}
          </Text>
          
          <Text
            position={[0, -0.2, 0.003]}
            fontSize={0.05}
            color="black"
            anchorX="center"
            anchorY="middle"
            font="/fonts/mono.woff"
          >
            {info.votes}
          </Text>
          
          <Text
            position={[0, -0.4, 0.003]}
            fontSize={0.04}
            color="#999999"
            anchorX="center"
            anchorY="middle"
            font="/fonts/mono.woff"
          >
            Press E to close
          </Text>
        </group>
      )}
    </>
  );
}

// Welcome message overlay
export function WelcomeOverlay() {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, []);
  
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div className="bg-white border-4 border-black p-8 max-w-lg animate-fade-in">
        <h2 className="text-2xl font-mono font-bold mb-4">Welcome to The Living Sketchbook</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
          <div>
            <h3 className="font-bold mb-2">Movement:</h3>
            <ul className="space-y-1">
              <li>→ WASD to move</li>
              <li>→ Mouse to look around</li>
              <li>→ Click to lock cursor</li>
              <li>→ ESC to unlock</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2">Interactions:</h3>
            <ul className="space-y-1">
              <li>→ Approach artworks</li>
              <li>→ Press E for details</li>
              <li>→ Listen for footsteps</li>
              <li>→ Vote every hour!</li>
            </ul>
          </div>
        </div>
        <p className="font-mono text-xs mt-4 text-gray-600">Audio will start after your first interaction...</p>
      </div>
    </div>
  );
}

// Subtle animated spotlight
export function AnimatedSpotlight() {
  const lightRef = useRef<THREE.SpotLight>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.3) * 5;
      lightRef.current.position.z = Math.cos(state.clock.elapsedTime * 0.3) * 5;
    }
  });
  
  return (
    <spotLight
      ref={lightRef}
      position={[0, 10, 0]}
      angle={0.3}
      penumbra={0.5}
      intensity={0.5}
      castShadow
      color="#fff8e7"
    />
  );
}