'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, OrbitControls } from '@react-three/drei';
import { Suspense, useRef, useEffect } from 'react';

// Simple WASD Movement Controls
function MovementControls() {
  const { camera } = useThree();
  const moveSpeed = 0.2;
  const keys = useRef({
    w: false, a: false, s: false, d: false
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    // Simple movement based on camera rotation
    if (keys.current.w) {
      camera.position.z -= moveSpeed * Math.cos(camera.rotation.y);
      camera.position.x -= moveSpeed * Math.sin(camera.rotation.y);
    }
    if (keys.current.s) {
      camera.position.z += moveSpeed * Math.cos(camera.rotation.y);
      camera.position.x += moveSpeed * Math.sin(camera.rotation.y);
    }
    if (keys.current.a) {
      camera.position.x -= moveSpeed * Math.cos(camera.rotation.y);
      camera.position.z += moveSpeed * Math.sin(camera.rotation.y);
    }
    if (keys.current.d) {
      camera.position.x += moveSpeed * Math.cos(camera.rotation.y);
      camera.position.z -= moveSpeed * Math.sin(camera.rotation.y);
    }
    
    // Keep camera at reasonable height
    camera.position.y = Math.max(0.5, Math.min(4, camera.position.y));
  });

  return null;
}

// Sketch-style Material Component
function SketchMaterial({ color = "white", wireframe = false }) {
  return (
    <meshBasicMaterial 
      color={color}
      wireframe={wireframe}
      transparent={color === "white"}
      opacity={color === "white" ? 0.95 : 1.0}
    />
  );
}

// Picture Frame Component
function PictureFrame({ position, rotation = [0, 0, 0], text }: { 
  position: [number, number, number]; 
  rotation?: [number, number, number];
  text: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Black Frame Border */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[3.2, 2.2, 0.1]} />
        <SketchMaterial color="black" />
      </mesh>
      {/* White Paper/Canvas */}
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[2.8, 1.8]} />
        <SketchMaterial color="white" />
      </mesh>
      {/* Sketch-style text */}
      <Text
        position={[0, 0, 0.06]}
        fontSize={0.15}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
}

function GalleryScene() {
  return (
    <>
      <MovementControls />
      
      {/* Simple ambient lighting for sketch effect */}
      <ambientLight intensity={1.0} />
      
      {/* Clean white floor - like paper */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[50, 50]} />
        <SketchMaterial color="white" />
      </mesh>
      
      {/* Left Wall - clean white like sketchbook page */}
      <mesh position={[-12, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[50, 8]} />
        <SketchMaterial color="white" />
      </mesh>
      
      {/* Right Wall */}
      <mesh position={[12, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[50, 8]} />
        <SketchMaterial color="white" />
      </mesh>
      
      {/* Back Wall */}
      <mesh position={[0, 2, -25]} rotation={[0, 0, 0]}>
        <planeGeometry args={[50, 8]} />
        <SketchMaterial color="white" />
      </mesh>
      
      {/* Ceiling - subtle sketch lines */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6, 0]}>
        <planeGeometry args={[50, 50]} />
        <SketchMaterial color="white" wireframe={true} />
      </mesh>
      
      {/* Left Wall Frames */}
      <PictureFrame position={[-11.8, 2, -8]} rotation={[0, Math.PI / 2, 0]} text="Coming Soon..." />
      <PictureFrame position={[-11.8, 2, -4]} rotation={[0, Math.PI / 2, 0]} text="Your Art Here" />
      <PictureFrame position={[-11.8, 2, 0]} rotation={[0, Math.PI / 2, 0]} text="Gallery" />
      <PictureFrame position={[-11.8, 2, 4]} rotation={[0, Math.PI / 2, 0]} text="Sketch" />
      <PictureFrame position={[-11.8, 2, 8]} rotation={[0, Math.PI / 2, 0]} text="Create" />
      
      {/* Right Wall Frames */}
      <PictureFrame position={[11.8, 2, -8]} rotation={[0, -Math.PI / 2, 0]} text="Vote Now" />
      <PictureFrame position={[11.8, 2, -4]} rotation={[0, -Math.PI / 2, 0]} text="Hall of Fame" />
      <PictureFrame position={[11.8, 2, 0]} rotation={[0, -Math.PI / 2, 0]} text="Winners" />
      <PictureFrame position={[11.8, 2, 4]} rotation={[0, -Math.PI / 2, 0]} text="Community" />
      <PictureFrame position={[11.8, 2, 8]} rotation={[0, -Math.PI / 2, 0]} text="Live Art" />
      
      {/* Simple black lines on floor for perspective - like sketch guidelines */}
      <group>
        <mesh position={[0, -0.99, 0]}>
          <boxGeometry args={[0.02, 0.01, 50]} />
          <SketchMaterial color="black" />
        </mesh>
        <mesh position={[-6, -0.99, 0]}>
          <boxGeometry args={[0.01, 0.01, 50]} />
          <SketchMaterial color="black" />
        </mesh>
        <mesh position={[6, -0.99, 0]}>
          <boxGeometry args={[0.01, 0.01, 50]} />
          <SketchMaterial color="black" />
        </mesh>
      </group>
    </>
  );
}

export default function Gallery3D() {
  return (
    <Canvas
      camera={{ position: [0, 1.6, 12], fov: 75 }}
      style={{ background: '#ffffff' }}
    >
      <Suspense fallback={null}>
        <GalleryScene />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={3}
          maxDistance={20}
        />
      </Suspense>
    </Canvas>
  );
}