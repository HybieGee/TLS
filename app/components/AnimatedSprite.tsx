'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';

interface AnimatedSpriteProps {
  position?: [number, number, number];
  scale?: number;
  speed?: number;
}

export default function AnimatedSprite({ 
  position = [0, 1, 0], 
  scale = 0.5,
  speed = 2
}: AnimatedSpriteProps) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [time, setTime] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(new THREE.Vector3(...position));
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left

  // Create sprite frames from the SVG
  const frames = useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    
    canvas.width = 100;
    canvas.height = 100;
    
    // Create 4 frames for animation
    const frameData = [];
    for (let i = 0; i < 4; i++) {
      ctx.clearRect(0, 0, 100, 100);
      
      // Simple sketchbook character frames
      // Frame varies based on leg position for running animation
      const legOffset = i % 2 === 0 ? -5 : 5;
      const bodyBounce = i === 1 || i === 3 ? -2 : 0;
      
      // Draw sketchbook body
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.fillRect(30, 20 + bodyBounce, 25, 30);
      ctx.strokeRect(30, 20 + bodyBounce, 25, 30);
      
      // Draw spiral binding
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        ctx.arc(25, 25 + j * 5 + bodyBounce, 2, 0, Math.PI * 2);
      }
      ctx.stroke();
      
      // Draw face
      ctx.fillStyle = 'black';
      ctx.fillRect(35, 28 + bodyBounce, 2, 2); // left eye
      ctx.fillRect(45, 28 + bodyBounce, 2, 2); // right eye
      
      // Draw smile
      ctx.beginPath();
      ctx.arc(42, 38 + bodyBounce, 5, 0, Math.PI);
      ctx.stroke();
      
      // Draw pencil
      ctx.fillStyle = '#F4A460';
      ctx.fillRect(58, 15 + bodyBounce, 3, 20);
      ctx.fillStyle = 'black';
      ctx.fillRect(58, 10 + bodyBounce, 3, 5); // pencil tip
      ctx.fillStyle = '#FFB6C1';
      ctx.fillRect(58, 35 + bodyBounce, 3, 5); // eraser
      
      // Draw legs (animated)
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(35, 50 + bodyBounce);
      ctx.lineTo(30 + legOffset, 70);
      ctx.moveTo(48, 50 + bodyBounce);
      ctx.lineTo(53 - legOffset, 70);
      ctx.stroke();
      
      // Draw feet
      ctx.fillStyle = 'black';
      ctx.fillRect(28 + legOffset, 68, 8, 3);
      ctx.fillRect(51 - legOffset, 68, 8, 3);
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      frameData.push(texture);
    }
    
    return frameData;
  }, []);

  // Animation and movement logic
  useFrame((state, delta) => {
    if (!spriteRef.current) return;
    
    // Update animation frame
    setTime(prev => prev + delta);
    if (time > 0.2) { // Change frame every 0.2 seconds
      setCurrentFrame(prev => (prev + 1) % 4);
      setTime(0);
    }
    
    // Update position (move back and forth in gallery)
    setCurrentPosition(prev => {
      const newPos = prev.clone();
      newPos.x += direction * speed * delta;
      
      // Bounce off walls (approximate gallery bounds)
      if (newPos.x > 10) {
        setDirection(-1);
        spriteRef.current!.scale.x = Math.abs(spriteRef.current!.scale.x) * -1; // Flip sprite
      } else if (newPos.x < -10) {
        setDirection(1);
        spriteRef.current!.scale.x = Math.abs(spriteRef.current!.scale.x); // Normal orientation
      }
      
      return newPos;
    });
    
    // Apply position and current frame
    spriteRef.current.position.copy(currentPosition);
    if (frames[currentFrame]) {
      spriteRef.current.material.map = frames[currentFrame];
      spriteRef.current.material.needsUpdate = true;
    }
    
    // Make sprite always face camera
    spriteRef.current.lookAt(state.camera.position);
  });

  return (
    <sprite
      ref={spriteRef}
      scale={[scale, scale, scale]}
      position={position}
    >
      <spriteMaterial 
        map={frames[0]} 
        transparent={true}
        alphaTest={0.1}
      />
    </sprite>
  );
}