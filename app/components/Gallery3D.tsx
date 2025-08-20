'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Edges } from '@react-three/drei';
import { Suspense, useRef, useEffect } from 'react';

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
  
  // Apply edges effect to all meshes in the scene
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as any).isMesh) {
        // This ensures proper rendering with edges
        (child as any).material.polygonOffset = true;
        (child as any).material.polygonOffsetFactor = 1;
        (child as any).material.polygonOffsetUnits = 1;
      }
    });
  }, [scene]);
  
  return (
    <>
      <primitive object={scene} />
      {/* Create edges for each mesh in the scene */}
      {scene.children.map((child, index) => {
        if ((child as any).isMesh) {
          return (
            <mesh key={index} geometry={(child as any).geometry}>
              <Edges threshold={15} color="black" linewidth={2} />
            </mesh>
          );
        }
        return null;
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