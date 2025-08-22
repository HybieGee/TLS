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
    const music = new Audio('/audio/music.mp3');
    music.loop = true;
    music.volume = 0.02; // Set to 2% volume
    musicRef.current = music;
    
    try {
      await music.play();
      console.log('Gallery music started at 2% volume');
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

// Floating glowing cube particles for atmosphere
export function FloatingParticles() {
  const meshRef = useRef<THREE.Group>(null);
  const particleCount = 50;
  
  const particles = useMemo(() => {
    const group = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
      const material = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0x333333,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.7
      });
      
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        (Math.random() - 0.5) * 30,
        Math.random() * 6,
        (Math.random() - 0.5) * 20
      );
      
      // Store initial position for floating animation
      cube.userData = {
        initialY: cube.position.y,
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.5 + Math.random() * 0.5
      };
      
      group.add(cube);
    }
    
    return group;
  }, []);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0001;
      
      meshRef.current.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        const userData = mesh.userData;
        
        // Gentle floating animation
        mesh.position.y = userData.initialY + 
          Math.sin(state.clock.elapsedTime * userData.floatSpeed + userData.floatOffset) * 0.1;
        
        // Gentle rotation
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.005;
      });
    }
  });
  
  return <primitive ref={meshRef} object={particles} />;
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
  const [visible, setVisible] = useState(() => {
    // Don't show instructions if user has been here before
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('gallery_visited');
    }
    return true;
  });
  
  useEffect(() => {
    const handleInteraction = () => {
      setVisible(false);
      // Mark that user has visited the gallery
      if (typeof window !== 'undefined') {
        localStorage.setItem('gallery_visited', 'true');
      }
    };

    // Listen for click only to dismiss instructions
    const events = ['click'];
    
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
            <h3 className="font-bold mb-2">What You Can Do:</h3>
            <ul className="space-y-1">
              <li>→ Create drawings (3/hour)</li>
              <li>→ Vote for favorites (3/hour)</li>
              <li>→ Best artwork enters gallery</li>
              <li>→ New voting every hour!</li>
              <li>→ Click anywhere to start</li>
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
  const materialRefs = useRef<THREE.MeshBasicMaterial[]>([]);
  
  // Load all textures and create all materials for animation
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    const materials: THREE.MeshBasicMaterial[] = [];
    let loadedCount = 0;
    
    for (let i = 1; i <= 16; i++) {
      const texture = loader.load(
        `/sprites/waving-pencil/${i}.png`,
        () => {
          loadedCount++;
          if (loadedCount === 16) {
            // Create all materials once textures are loaded
            materials.length = 0; // Clear array
            textures.forEach(texture => {
              const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 1.0,
                side: THREE.DoubleSide,
                alphaTest: 0.1,
                premultipliedAlpha: false,
                depthWrite: true,
                color: 0xffffff
              });
              materials.push(material);
            });
            materialRefs.current = materials;
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
      materials.forEach(material => material.dispose());
    };
  }, []);
  
  // Animation loop
  useEffect(() => {
    if (!isLoaded) return;
    
    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        // Skip problematic frames - avoid frame 1 after 16
        const nextFrame = prev >= 16 ? 2 : prev + 1;
        console.log('Frame:', nextFrame); // Debug log
        return nextFrame;
      });
    }, 150); // 150ms per frame for clear animation
    
    return () => clearInterval(interval);
  }, [isLoaded]);
  
  // Update material when frame changes (use preloaded materials)
  useEffect(() => {
    if (meshRef.current && materialRefs.current[currentFrame - 1]) {
      meshRef.current.material = materialRefs.current[currentFrame - 1];
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
        color={0xffffff} // Full white to prevent dimming
      />
    </mesh>
  );
}