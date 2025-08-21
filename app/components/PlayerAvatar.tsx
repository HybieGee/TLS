'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlayerAvatarProps {
  position: [number, number, number];
  color?: string;
  name?: string;
}

// Simple capsule-shaped player avatar
export function PlayerAvatar({ position, color = '#4A90E2', name = 'Player' }: PlayerAvatarProps) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Bobbing animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });
  
  return (
    <group ref={meshRef} position={position}>
      {/* Body (cylinder) */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Head (sphere) */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.1, 1.25, 0.2]}>
        <sphereGeometry args={[0.05, 4, 4]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[-0.1, 1.25, 0.2]}>
        <sphereGeometry args={[0.05, 4, 4]} />
        <meshStandardMaterial color="black" />
      </mesh>
      
      {/* Name label */}
      {name && (
        <sprite position={[0, 1.8, 0]}>
          <spriteMaterial color="white" />
        </sprite>
      )}
    </group>
  );
}

// Stick figure character with various colors
const StickFigure = ({ position, color = '#333333', name }: PlayerAvatarProps) => (
  <group position={position}>
    {/* Body */}
    <mesh position={[0, 0.8, 0]}>
      <cylinderGeometry args={[0.05, 0.05, 0.8, 4]} />
      <meshStandardMaterial color={color} />
    </mesh>
    {/* Head */}
    <mesh position={[0, 1.4, 0]}>
      <sphereGeometry args={[0.15, 6, 6]} />
      <meshStandardMaterial color={color} />
    </mesh>
    {/* Arms */}
    <mesh position={[0, 1.1, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.03, 0.03, 0.6, 4]} />
      <meshStandardMaterial color={color} />
    </mesh>
    {/* Legs */}
    <mesh position={[0.1, 0.3, 0]} rotation={[0, 0, 0.2]}>
      <cylinderGeometry args={[0.03, 0.03, 0.6, 4]} />
      <meshStandardMaterial color={color} />
    </mesh>
    <mesh position={[-0.1, 0.3, 0]} rotation={[0, 0, -0.2]}>
      <cylinderGeometry args={[0.03, 0.03, 0.6, 4]} />
      <meshStandardMaterial color={color} />
    </mesh>
    {/* Name label */}
    {name && (
      <sprite position={[0, 1.8, 0]}>
        <spriteMaterial color="white" />
      </sprite>
    )}
  </group>
);

// Only stick figures with different colors
export const characterModels = {
  stick: {
    name: 'Stick Figure',
    component: StickFigure,
    colors: ['#333333', '#E94B3C', '#4A90E2', '#6BCB77', '#FFD93D', '#6C5CE7', '#A8E6CF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#666666', '#999999', '#2C3E50', '#34495E']
  }
};