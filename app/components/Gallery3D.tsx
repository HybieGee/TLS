'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Edges } from '@react-three/drei';
import React, { Suspense, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

// FPS Movement Controls with Collision Detection
function MovementControls() {
  const { camera, gl, scene } = useThree();
  const moveSpeed = 0.1;
  const lookSpeed = 0.002;
  const playerRadius = 0.5; // Collision radius
  
  const keys = useRef({
    w: false, a: false, s: false, d: false
  });
  
  const mouse = useRef({ x: 0, y: 0 });
  const isPointerLocked = useRef(false);

  // Simple collision check
  const checkCollision = (newPos: THREE.Vector3): boolean => {
    // Front/back perfect, side walls need to allow MORE movement (bigger boundaries)
    const bounds = {
      minX: -12,   // Front/back walls (with large paintings) - PERFECT, don't change
      maxX: 12,    // Front/back walls (with large paintings) - PERFECT, don't change
      minZ: -7.5,  // Left/right side walls (with small frames) - BIGGER boundaries = more room to move
      maxZ: 7.5    // Left/right side walls (with small frames) - BIGGER boundaries = more room to move
    };
    
    // Check boundary collisions
    if (newPos.x < bounds.minX + playerRadius || 
        newPos.x > bounds.maxX - playerRadius ||
        newPos.z < bounds.minZ + playerRadius || 
        newPos.z > bounds.maxZ - playerRadius) {
      return true; // Collision detected
    }
    
    return false; // No collision
  };

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

    // Store potential new position
    const newPos = camera.position.clone();

    // Apply movement to new position
    if (keys.current.w) {
      newPos.x += forward.x * moveSpeed;
      newPos.z += forward.z * moveSpeed;
    }
    if (keys.current.s) {
      newPos.x -= forward.x * moveSpeed;
      newPos.z -= forward.z * moveSpeed;
    }
    if (keys.current.a) {
      newPos.x -= right.x * moveSpeed;
      newPos.z -= right.z * moveSpeed;
    }
    if (keys.current.d) {
      newPos.x += right.x * moveSpeed;
      newPos.z += right.z * moveSpeed;
    }
    
    // Only apply movement if no collision
    if (!checkCollision(newPos)) {
      camera.position.x = newPos.x;
      camera.position.z = newPos.z;
    }
    
    // Keep camera at eye level
    camera.position.y = 1.6;
  });

  return null;
}

// Blender Gallery Component with Sketchbook Outlines
function BlenderGallery() {
  const { scene, nodes } = useGLTF('/models/Gallery.glb');
  
  // Clone scene to add edges
  const sceneWithEdges = React.useMemo(() => {
    const cloned = scene.clone();
    
    // Add edges to each mesh in the cloned scene
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Check if this is a black frame
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat && mat.color) {
          const isBlack = mat.color.r < 0.2 && mat.color.g < 0.2 && mat.color.b < 0.2;
          // Skip black frames
          if (isBlack) return;
        }
        
        // Create edges geometry with threshold for clean lines
        const edges = new THREE.EdgesGeometry(child.geometry, 30);
        
        // Create single line for cleaner look
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ 
            color: 'black',
            depthTest: true
          })
        );
        
        // Copy transforms and scale slightly inward for better appearance
        line.position.copy(child.position);
        line.rotation.copy(child.rotation);
        line.scale.copy(child.scale);
        line.scale.multiplyScalar(0.998); // Tiny bit inward to prevent edge bleeding
        line.renderOrder = 1; // Render after meshes
        
        // Add line to parent
        if (child.parent) {
          child.parent.add(line);
        }
      }
    });
    
    return cloned;
  }, [scene]);
  
  return <primitive object={sceneWithEdges} />;
}

// Preload the model
useGLTF.preload('/models/Gallery.glb');

function GalleryScene() {
  return (
    <>
      <MovementControls />
      
      {/* Even brighter lighting for pure white sketchbook feel */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 8, 5]} intensity={2.0} castShadow />
      <directionalLight position={[-5, 8, -5]} intensity={1.2} />
      <pointLight position={[0, 5, 0]} intensity={0.5} />
      
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