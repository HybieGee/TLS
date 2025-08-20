'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the 3D scene to avoid SSR issues
const Gallery3D = dynamic(() => import('./components/Gallery3D'), { ssr: false });

export default function HomePage() {
  return (
    <div className="w-full h-screen bg-white">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-2xl font-mono text-black">Loading The Living Sketchbook...</div>
        </div>
      }>
        <Gallery3D />
      </Suspense>
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-3xl font-bold font-mono text-black mb-2">
          The Living Sketchbook
        </h1>
        <p className="text-sm font-mono text-gray-700 max-w-md">
          Community-voted characters come to life every hour.<br/>
          WASD to move • Mouse to look • Click frames to explore
        </p>
      </div>
      
      {/* Navigation Menu */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <a href="/create" className="block px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 text-black font-mono text-sm">
          Create
        </a>
        <a href="/vote" className="block px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 text-black font-mono text-sm">
          Vote
        </a>
        <a href="/hall" className="block px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 text-black font-mono text-sm">
          Hall of Fame
        </a>
      </div>
    </div>
  );
}