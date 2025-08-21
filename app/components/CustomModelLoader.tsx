'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface CustomModelProps {
  position: [number, number, number];
  color?: string;
  name?: string;
  modelUrl: string;
  scale?: number;
}

// Custom GLTF model loader for player avatars
export function CustomModelAvatar({ position, color = '#4A90E2', name = 'Player', modelUrl, scale = 1 }: CustomModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Always call useGLTF unconditionally - errors will be handled by Suspense boundary
  const gltf = useGLTF(modelUrl);

  // Bobbing animation - always called
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  // Apply color tinting to model materials
  useEffect(() => {
    if (gltf?.scene && color) {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          // Clone material to avoid affecting original
          const material = child.material.clone();
          
          // Apply color tinting
          if (material instanceof THREE.MeshStandardMaterial) {
            material.color = new THREE.Color(color);
          }
          
          child.material = material;
        }
      });
    }
  }, [gltf, color]);

  return (
    <group ref={meshRef} position={position}>
      <primitive 
        object={gltf.scene.clone()} 
        scale={[scale, scale, scale]}
      />
      
      {/* Name label */}
      {name && (
        <sprite position={[0, 2, 0]}>
          <spriteMaterial color="white" />
        </sprite>
      )}
    </group>
  );
}

// Enhanced PlayerAvatar that supports both preset models and custom GLTF files
interface EnhancedPlayerAvatarProps {
  position: [number, number, number];
  color?: string;
  name?: string;
  model?: string;
  customModelUrl?: string;
}

export function EnhancedPlayerAvatar({ 
  position, 
  color = '#4A90E2', 
  name = 'Player', 
  model = 'capsule',
  customModelUrl 
}: EnhancedPlayerAvatarProps) {
  // Always call hooks at the top level
  const meshRef = useRef<THREE.Group>(null);
  
  // Always call useFrame hook
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });
  
  // If custom model URL is provided, use CustomModelAvatar
  if (customModelUrl) {
    return (
      <CustomModelAvatar
        position={position}
        color={color}
        name={name}
        modelUrl={customModelUrl}
        scale={1}
      />
    );
  }

  // Render based on model type
  switch (model) {
    case 'cube':
      return (
        <group ref={meshRef} position={position}>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.6, 1, 0.6]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {name && (
            <sprite position={[0, 1.8, 0]}>
              <spriteMaterial color="white" />
            </sprite>
          )}
        </group>
      );

    case 'stick':
      return (
        <group ref={meshRef} position={position}>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.8, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <sphereGeometry args={[0.15, 6, 6]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 1.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.6, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0.1, 0.3, 0]} rotation={[0, 0, 0.2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.6, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[-0.1, 0.3, 0]} rotation={[0, 0, -0.2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.6, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {name && (
            <sprite position={[0, 1.8, 0]}>
              <spriteMaterial color="white" />
            </sprite>
          )}
        </group>
      );

    default: // 'capsule'
      return (
        <group ref={meshRef} position={position}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.25, 8, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0.1, 1.25, 0.2]}>
            <sphereGeometry args={[0.05, 4, 4]} />
            <meshStandardMaterial color="black" />
          </mesh>
          <mesh position={[-0.1, 1.25, 0.2]}>
            <sphereGeometry args={[0.05, 4, 4]} />
            <meshStandardMaterial color="black" />
          </mesh>
          {name && (
            <sprite position={[0, 1.8, 0]}>
              <spriteMaterial color="white" />
            </sprite>
          )}
        </group>
      );
  }
}

// Popular free 3D model sources
export const MODEL_SOURCES = {
  sketchfab: {
    name: 'Sketchfab',
    url: 'https://sketchfab.com/3d-models?features=downloadable&sort_by=-likeCount',
    description: 'High-quality 3D models, many free with CC licenses',
    formats: ['GLTF', 'GLB', 'FBX', 'OBJ'],
    note: 'Look for "Downloadable" filter and Creative Commons licenses'
  },
  
  opengameart: {
    name: 'OpenGameArt',
    url: 'https://opengameart.org/art-search-advanced?keys=&field_art_type_tid[]=9',
    description: 'Free game assets including 3D models',
    formats: ['OBJ', 'BLEND', 'FBX', 'DAE'],
    note: 'All content is free to use, various licenses'
  },

  mixamo: {
    name: 'Adobe Mixamo',
    url: 'https://www.mixamo.com/#/?page=1&type=Character',
    description: 'Free rigged characters with animations',
    formats: ['FBX', 'COLLADA'],
    note: 'Requires Adobe account, great for animated characters'
  },

  quaternius: {
    name: 'Quaternius',
    url: 'https://quaternius.com/packs.html',
    description: 'Low-poly character and asset packs',
    formats: ['FBX', 'OBJ', 'BLEND'],
    note: 'CC0 license, perfect for multiplayer avatars'
  },

  kenney: {
    name: 'Kenney Assets',
    url: 'https://kenney.nl/assets?q=3D',
    description: 'Simple, clean 3D assets',
    formats: ['OBJ', 'FBX', 'BLEND'],
    note: 'CC0 license, great for prototyping'
  },

  polyhaven: {
    name: 'Poly Haven',
    url: 'https://polyhaven.com/models',
    description: 'High-quality PBR models',
    formats: ['BLEND', 'FBX', 'OBJ'],
    note: 'CC0 license, professional quality'
  }
};