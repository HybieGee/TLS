'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Suspense } from 'react';

function GalleryScene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      
      {/* Gallery Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Gallery Walls */}
      <mesh position={[-10, 0, 0]}>
        <planeGeometry args={[1, 10]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[10, 0, 0]}>
        <planeGeometry args={[1, 10]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Sample Picture Frames */}
      <group position={[-9.8, 1, -5]}>
        <mesh>
          <boxGeometry args={[0.1, 3, 2]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[0.05, 0, 0]}>
          <planeGeometry args={[2.8, 1.8]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <Text
          position={[0.1, 0, 0]}
          fontSize={0.2}
          color="black"
          anchorX="center"
          anchorY="center"
        >
          Coming Soon...
        </Text>
      </group>
      
      <group position={[-9.8, 1, 0]}>
        <mesh>
          <boxGeometry args={[0.1, 3, 2]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[0.05, 0, 0]}>
          <planeGeometry args={[2.8, 1.8]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <Text
          position={[0.1, 0, 0]}
          fontSize={0.2}
          color="black"
          anchorX="center"
          anchorY="center"
        >
          Your Art Here
        </Text>
      </group>
      
      <group position={[-9.8, 1, 5]}>
        <mesh>
          <boxGeometry args={[0.1, 3, 2]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[0.05, 0, 0]}>
          <planeGeometry args={[2.8, 1.8]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <Text
          position={[0.1, 0, 0]}
          fontSize={0.2}
          color="black"
          anchorX="center"
          anchorY="center"
        >
          Gallery
        </Text>
      </group>
      
      {/* Right Wall Frames */}
      <group position={[9.8, 1, -5]} rotation={[0, Math.PI, 0]}>
        <mesh>
          <boxGeometry args={[0.1, 3, 2]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[0.05, 0, 0]}>
          <planeGeometry args={[2.8, 1.8]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </group>
    </>
  );
}

export default function Gallery3D() {
  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 60 }}
      style={{ background: '#f8f8f8' }}
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