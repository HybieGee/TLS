'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
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
      
      {/* UI Overlay - Sketchbook Style */}
      <div className="absolute top-4 left-4 z-10 bg-white border-2 border-black p-4 shadow-lg">
        <h1 className="text-2xl font-bold font-mono text-black mb-2 tracking-wide">
          THE LIVING SKETCHBOOK
        </h1>
        <div className="border-t-2 border-black pt-2">
          <p className="text-xs font-mono text-black leading-relaxed">
            → Community-voted characters come to life every hour<br/>
            → Click canvas to lock mouse • WASD to move<br/>
            → ESC to unlock • Click frames to explore
          </p>
        </div>
      </div>
      
      {/* Navigation Menu - Sketch Style */}
      <div className="absolute top-4 right-4 z-10 space-y-1">
        <Link href="/create" className="block px-3 py-2 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-mono text-sm font-bold tracking-wider transition-colors">
          ✎ CREATE
        </Link>
        <Link href="/vote" className="block px-3 py-2 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-mono text-sm font-bold tracking-wider transition-colors">
          ★ VOTE  
        </Link>
        <Link href="/hall" className="block px-3 py-2 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-mono text-sm font-bold tracking-wider transition-colors">
          ♚ HALL
        </Link>
      </div>
    </div>
  );
}