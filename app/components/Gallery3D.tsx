'use client';

import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { useGLTF, Float } from '@react-three/drei';
import React, { Suspense, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { FloatingParticles, AnimatedSpotlight, WelcomeOverlay, AudioTrigger, WavingPencil3D } from './GalleryEffects';

// FPS Movement Controls with Collision Detection
function MovementControls() {
  const { camera, gl } = useThree();
  const moveSpeed = 5; // Units per second (not per frame)
  const lookSpeed = 0.002;
  const playerRadius = 0.5; // Collision radius
  
  const keys = useRef({
    w: false, a: false, s: false, d: false, space: false
  });
  
  const mouse = useRef({ x: 0, y: 0 });
  const isPointerLocked = useRef(false);
  
  // Jump physics
  const jumpState = useRef({
    isJumping: false,
    jumpVelocity: 0,
    groundLevel: 1.6
  });

  // Simple collision check
  const checkCollision = (newPos: THREE.Vector3): boolean => {
    // X-axis back to what it was, only Z-axis changed
    const bounds = {
      minX: -12,   // Front/back walls (with large paintings) - BACK TO ORIGINAL
      maxX: 12,    // Front/back walls (with large paintings) - BACK TO ORIGINAL
      minZ: -9,    // Left/right side walls (with small frames) - flush with walls
      maxZ: 9      // Left/right side walls (with small frames) - flush with walls
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
      if (key === ' ') {
        keys.current.space = true;
      } else if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === ' ') {
        keys.current.space = false;
      } else if (key in keys.current) {
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

  useFrame((state, delta) => {
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

    // Calculate movement directions (frame-rate independent)
    const frameMoveSpeed = moveSpeed * delta; // Scale by delta time
    let deltaX = 0;
    let deltaZ = 0;

    if (keys.current.w) {
      deltaX += forward.x * frameMoveSpeed;
      deltaZ += forward.z * frameMoveSpeed;
    }
    if (keys.current.s) {
      deltaX -= forward.x * frameMoveSpeed;
      deltaZ -= forward.z * frameMoveSpeed;
    }
    if (keys.current.a) {
      deltaX -= right.x * frameMoveSpeed;
      deltaZ -= right.z * frameMoveSpeed;
    }
    if (keys.current.d) {
      deltaX += right.x * frameMoveSpeed;
      deltaZ += right.z * frameMoveSpeed;
    }

    // Try movement with wall sliding
    const currentPos = camera.position.clone();
    
    // Try moving on both axes
    const newPos = currentPos.clone();
    newPos.x += deltaX;
    newPos.z += deltaZ;
    
    if (!checkCollision(newPos)) {
      // No collision, move normally
      camera.position.x = newPos.x;
      camera.position.z = newPos.z;
    } else {
      // Collision detected, try sliding along walls
      
      // Try X-axis only (slide along Z walls)
      const xOnlyPos = currentPos.clone();
      xOnlyPos.x += deltaX;
      if (!checkCollision(xOnlyPos)) {
        camera.position.x = xOnlyPos.x;
      }
      
      // Try Z-axis only (slide along X walls)
      const zOnlyPos = currentPos.clone();
      zOnlyPos.z += deltaZ;
      if (!checkCollision(zOnlyPos)) {
        camera.position.z = zOnlyPos.z;
      }
    }
    
    // Jump physics (frame-rate independent)
    if (keys.current.space && !jumpState.current.isJumping) {
      jumpState.current.isJumping = true;
      jumpState.current.jumpVelocity = 8; // Initial jump velocity (units per second)
    }
    
    if (jumpState.current.isJumping) {
      jumpState.current.jumpVelocity -= 25 * delta; // Gravity (units per second²)
      camera.position.y += jumpState.current.jumpVelocity * delta;
      
      // Check if landed
      if (camera.position.y <= jumpState.current.groundLevel) {
        camera.position.y = jumpState.current.groundLevel;
        jumpState.current.isJumping = false;
        jumpState.current.jumpVelocity = 0;
      }
    } else {
      // Keep camera at eye level when not jumping
      camera.position.y = jumpState.current.groundLevel;
    }
  });

  return null;
}

// Blender Gallery Component with Sketchbook Outlines and Coming Soon Textures
function BlenderGallery() {
  const { scene } = useGLTF('/models/Gallery.glb');
  
  // Load Coming Soon texture
  const comingSoonTexture = useLoader(THREE.TextureLoader, '/images/coming-soon.svg');
  
  // Clone scene to add edges and replace artwork textures
  const sceneWithEdges = React.useMemo(() => {
    const cloned = scene.clone();
    
    // Configure texture settings
    if (comingSoonTexture) {
      comingSoonTexture.flipY = false;
      comingSoonTexture.wrapS = THREE.ClampToEdgeWrapping;
      comingSoonTexture.wrapT = THREE.ClampToEdgeWrapping;
      comingSoonTexture.needsUpdate = true;
    }
    
    // Debug: List all mesh names
    console.log('=== Gallery Model Meshes ===');
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const childNameLower = child.name.toLowerCase();
        const wouldBeArtwork = (childNameLower.includes('art') || childNameLower.includes('plane') || childNameLower.includes('canvas')) && 
                              !childNameLower.includes('frame');
        console.log('Mesh:', child.name, '| Would be artwork:', wouldBeArtwork, '| Material:', child.material?.type);
      }
    });
    
    // Add edges to each mesh and replace artwork textures
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Target only specific artwork objects
        const childNameLower = child.name.toLowerCase();
        // Only apply to specific artworks, excluding Artwork006
        const isArtwork = childNameLower === 'artwork' ||
                          childNameLower === 'artwork001' ||
                          childNameLower === 'artwork002' ||
                          childNameLower === 'artwork003' ||
                          childNameLower === 'artwork004' ||
                          childNameLower === 'artwork005' ||
                          childNameLower === 'artwork007';
        // Artwork006 is excluded by not being in the list above
        
        if (isArtwork && comingSoonTexture) {
          console.log('Applying texture to:', child.name);
          // Clone texture for rotation
          const rotatedTexture = comingSoonTexture.clone();
          
          // Apply rotation
          rotatedTexture.rotation = -Math.PI / 2; // -90 degree rotation for ALL
          
          // Flip horizontally for artworks that appear backwards
          const childNameLower = child.name.toLowerCase();
          if (childNameLower === 'artwork003' || 
              childNameLower === 'artwork004' || 
              childNameLower === 'artwork005' ||
              childNameLower === 'artwork007') {
            // Flip texture horizontally to fix backwards text
            rotatedTexture.wrapS = THREE.RepeatWrapping;
            rotatedTexture.repeat.x = -1;
            rotatedTexture.offset.x = 1;
          }
          
          rotatedTexture.center.set(0.5, 0.5);
          rotatedTexture.needsUpdate = true;
          
          const newMaterial = new THREE.MeshStandardMaterial({
            map: rotatedTexture,
            transparent: false,
            side: THREE.DoubleSide, // Show on both sides to help with visibility
            color: 0xffffff
          });
          child.material = newMaterial;
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
  }, [scene, comingSoonTexture]);
  
  return <primitive object={sceneWithEdges} />;
}

// Your Blender model already has Coming Soon placeholders built-in!

// Preload the model
useGLTF.preload('/models/Gallery.glb');

function GalleryScene() {
  return (
    <>
      <MovementControls />
      <AudioTrigger />
      
      {/* Ultra bright lighting to match Blender render */}
      <ambientLight intensity={4.0} />
      <directionalLight position={[5, 10, 5]} intensity={5.0} castShadow />
      <directionalLight position={[-5, 10, -5]} intensity={4.0} />
      <directionalLight position={[0, 10, 0]} intensity={3.0} />
      <directionalLight position={[5, 5, 0]} intensity={2.0} />
      <directionalLight position={[-5, 5, 0]} intensity={2.0} />
      <pointLight position={[0, 8, 0]} intensity={2.0} />
      <pointLight position={[0, 8, 5]} intensity={1.5} />
      <pointLight position={[0, 8, -5]} intensity={1.5} />
      
      {/* Animated spotlight for dynamic lighting */}
      <AnimatedSpotlight />
      
      {/* Floating particles for atmosphere */}
      <FloatingParticles />
      
      {/* Your Blender Gallery Model */}
      <Float 
        speed={0.5}
        rotationIntensity={0.005}
        floatIntensity={0.02}
        floatingRange={[-0.01, 0.01]}
      >
        <BlenderGallery />
      </Float>
      
      
      
      {/* Animated 3D pencil character */}
      <WavingPencil3D />
    </>
  );
}

export default function Gallery3D() {
  return (
    <>
      <WelcomeOverlay />
      <Canvas
        camera={{ position: [0, 1.6, 6], fov: 60 }}
        style={{ background: '#ffffff' }}
        shadows
        gl={{ 
          antialias: true, 
          toneMapping: THREE.NoToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMappingExposure: 1.5
        }}
      >
        <Suspense fallback={null}>
          <GalleryScene />
        </Suspense>
      </Canvas>
    </>
  );
}