'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Edges } from '@react-three/drei';
import React, { Suspense, useRef, useEffect } from 'react';
import * as THREE from 'three';

// FPS Movement Controls (enhanced version of your existing system)
function MovementControls() {
  const { camera, gl } = useThree();
  const moveSpeed = 0.1;
  const lookSpeed = 0.002;
  
  const keys = useRef({
    w: false, a: false, s: false, d: false
  });
  
  const mouse = useRef({ x: 0, y: 0 });
  const isPointerLocked = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;

    // Keyboard controls
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

    // Pointer lock for mouse look
    const handleClick = () => {
      canvas.requestPointerLock();
    };

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isPointerLocked.current) {
        mouse.current.x += event.movementX * lookSpeed;
        mouse.current.y += event.movementY * lookSpeed;
        
        // Limit vertical look
        mouse.current.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouse.current.y));
      }
    };

    canvas.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      canvas.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [gl, lookSpeed]);

  useFrame(() => {
    // Apply mouse look
    camera.rotation.y = -mouse.current.x;
    camera.rotation.x = -mouse.current.y;
    camera.rotation.order = 'YXZ';

    // Calculate movement directions based on camera rotation
    const forward = {
      x: -Math.sin(camera.rotation.y),
      z: -Math.cos(camera.rotation.y)
    };
    
    const right = {
      x: Math.cos(camera.rotation.y),
      z: -Math.sin(camera.rotation.y)
    };

    // Apply movement
    if (keys.current.w) {
      camera.position.x += forward.x * moveSpeed;
      camera.position.z += forward.z * moveSpeed;
    }
    if (keys.current.s) {
      camera.position.x -= forward.x * moveSpeed;
      camera.position.z -= forward.z * moveSpeed;
    }
    if (keys.current.a) {
      camera.position.x -= right.x * moveSpeed;
      camera.position.z -= right.z * moveSpeed;
    }
    if (keys.current.d) {
      camera.position.x += right.x * moveSpeed;
      camera.position.z += right.z * moveSpeed;
    }
    
    // Keep camera at eye level
    camera.position.y = 1.6;
  });

  return null;
}

// Blender Gallery Component with Sketchbook Outlines
function BlenderGallery() {
  const { scene } = useGLTF('/models/Gallery.glb');
  const [meshesToOutline, setMeshesToOutline] = React.useState<THREE.Mesh[]>([]);
  
  // Find all meshes and apply edges selectively
  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Check if material is black (frames)
        const mat = child.material as THREE.MeshStandardMaterial;
        let isBlack = false;
        
        if (mat && mat.color) {
          const color = mat.color;
          isBlack = color.r < 0.2 && color.g < 0.2 && color.b < 0.2;
        }
        
        // Only add non-black meshes for outlining
        if (!isBlack) {
          // Clone and update world matrix for proper positioning
          child.updateWorldMatrix(true, false);
          meshes.push(child);
        }
      }
    });
    
    setMeshesToOutline(meshes);
  }, [scene]);
  
  return (
    <>
      <primitive object={scene} />
      {/* Create edges with proper world transforms */}
      {meshesToOutline.map((mesh, index) => {
        // Get world position, rotation, and scale
        const worldPos = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();
        const worldScale = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);
        mesh.getWorldQuaternion(worldQuat);
        mesh.getWorldScale(worldScale);
        
        return (
          <mesh
            key={index}
            position={worldPos}
            quaternion={worldQuat}
            scale={worldScale}
          >
            <edgesGeometry args={[mesh.geometry, 20]} />
            <lineBasicMaterial color="black" />
          </mesh>
        );
      })}
    </>
  );
}

// Preload the model
useGLTF.preload('/models/Gallery.glb');

function GalleryScene() {
  return (
    <>
      <MovementControls />
      
      {/* Bright lighting for clean white sketchbook feel */}
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-5, 8, -5]} intensity={0.8} />
      
      {/* Your Blender Gallery Model */}
      <BlenderGallery />
    </>
  );
}

export default function Gallery3D() {
  return (
    <Canvas
      camera={{ position: [0, 1.6, 6], fov: 60 }}
      style={{ background: '#ffffff' }}
      shadows
    >
      <Suspense fallback={null}>
        <GalleryScene />
      </Suspense>
    </Canvas>
  );
}