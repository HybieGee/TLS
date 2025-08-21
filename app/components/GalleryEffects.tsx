'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// Enhanced audio system with actual MP3 music file
function useGalleryAudio() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const lastFootstepTime = useRef(0);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const startAmbientMusic = async () => {
    if (musicRef.current) return;
    
    // Create audio element for the gallery music
    const music = new Audio('/audio/gallery-music.mp3');
    music.loop = true;
    music.volume = 0; // Start at 0 for fade in
    musicRef.current = music;
    
    try {
      await music.play();
      
      // Fade in over 3 seconds
      let fadeVolume = 0;
      const fadeIn = setInterval(() => {
        fadeVolume += 0.01;
        if (fadeVolume >= 0.3) { // Max volume at 0.3 for ambient level
          music.volume = 0.3;
          clearInterval(fadeIn);
        } else {
          music.volume = fadeVolume;
        }
      }, 30); // 3000ms / 100 steps = 30ms per step
      
      // Handle loop with fade out/in at the end
      music.addEventListener('timeupdate', () => {
        const fadeTime = 3; // 3 seconds fade
        const remainingTime = music.duration - music.currentTime;
        
        // Start fade out when 3 seconds remain
        if (remainingTime <= fadeTime && remainingTime > 0 && music.volume > 0) {
          music.volume = Math.max(0, (remainingTime / fadeTime) * 0.3);
        }
        
        // Fade back in at the start of the loop
        if (music.currentTime <= fadeTime && music.volume < 0.3) {
          music.volume = Math.min(0.3, (music.currentTime / fadeTime) * 0.3);
        }
      });
      
      console.log('Gallery music started');
    } catch (error) {
      console.log('Could not play music:', error);
    }
  };

  const enableAudio = async () => {
    if (!isAudioEnabled) {
      try {
        const context = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        setAudioContext(context);
        setIsAudioEnabled(true);
        await startAmbientMusic();
        console.log('Audio and ambient music enabled');
      } catch {
        console.log('Audio not supported');
      }
    }
  };

  const playFootstep = () => {
    const now = Date.now();
    if (audioContext && now - lastFootstepTime.current > 400) {
      // Create a simple footstep sound using Web Audio API
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Short low-frequency sound for footstep
      oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
      
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
    
    if (distance > 0.15 && hasInteracted) {
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

// Simple proximity glow for artworks
export function ProximityGlow({ position }: { position: [number, number, number], name: string }) {
  const { camera } = useThree();
  const [opacity, setOpacity] = useState(0);
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    const distance = camera.position.distanceTo(new THREE.Vector3(...position));
    const nearThreshold = 4;
    const isNear = distance < nearThreshold;
    
    // Smooth glow transition
    const targetOpacity = isNear ? 0.2 : 0;
    setOpacity((prev) => prev + (targetOpacity - prev) * 0.1);
    
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  });
  
  return (
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
  );
}

// Welcome message overlay
export function WelcomeOverlay() {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const handleInteraction = () => {
      setVisible(false);
    };

    // Listen for any user interaction
    const events = ['keydown', 'click', 'mousemove', 'wheel'];
    
    events.forEach(event => {
      document.addEventListener(event, handleInteraction);
    });

    // Fallback timer in case user doesn't interact
    const timer = setTimeout(() => setVisible(false), 15000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
      clearTimeout(timer);
    };
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
              <li>→ SPACE to jump</li>
              <li>→ Mouse to look around</li>
              <li>→ Click to lock cursor</li>
              <li>→ ESC to unlock</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2">Experience:</h3>
            <ul className="space-y-1">
              <li>→ Approach artworks for glow</li>
              <li>→ Listen for footsteps</li>
              <li>→ Enjoy floating particles</li>
              <li>→ Vote every hour!</li>
            </ul>
          </div>
        </div>
        <p className="font-mono text-xs mt-4 text-gray-600">Music & audio starts after your first click or keypress...</p>
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

// 3D Waving pencil sprite in the gallery world
export function WavingPencil3D() {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRefs = useRef<THREE.Texture[]>([]);
  
  // Load all textures for animation
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    let loadedCount = 0;
    
    for (let i = 1; i <= 16; i++) {
      const texture = loader.load(
        `/sprites/waving-pencil/${i}.png`,
        () => {
          loadedCount++;
          if (loadedCount === 16) {
            setIsLoaded(true);
          }
        }
      );
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      texture.premultiplyAlpha = false;
      textures.push(texture);
    }
    
    textureRefs.current = textures;
    
    return () => {
      textures.forEach(texture => texture.dispose());
    };
  }, []);
  
  // Animation loop
  useEffect(() => {
    if (!isLoaded) return;
    
    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        const nextFrame = prev >= 16 ? 1 : prev + 1;
        console.log('Frame:', nextFrame); // Debug log
        return nextFrame;
      });
    }, 150); // 150ms per frame for clear animation
    
    return () => clearInterval(interval);
  }, [isLoaded]);
  
  // Update texture when frame changes
  useEffect(() => {
    if (meshRef.current && textureRefs.current[currentFrame - 1]) {
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      const newTexture = textureRefs.current[currentFrame - 1];
      material.map = newTexture;
      material.opacity = 1.0; // Ensure consistent opacity
      material.needsUpdate = true;
    }
  }, [currentFrame]);
  
  if (!isLoaded) return null;
  
  return (
    <mesh 
      ref={meshRef} 
      position={[-10, 0.8, -7]} // Back left corner, standing on ground
      rotation={[0, Math.PI / 4, 0]} // 45 degree rotation to face inward
      scale={[2, 2, 1]} // Make it bigger
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={textureRefs.current[0]} 
        transparent={true}
        opacity={1.0}
        side={THREE.DoubleSide}
        alphaTest={0.1}
        premultipliedAlpha={false}
        depthWrite={true}
      />
    </mesh>
  );
}