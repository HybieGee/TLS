'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense, useState, useEffect } from 'react';

// Dynamically import the 3D scene to avoid SSR issues
const Gallery3D = dynamic(() => import('./components/Gallery3D'), { ssr: false });

export default function HomePage() {
  const [contractAddress, setContractAddress] = useState('TBA - Coming Soon');
  const [isLaunched, setIsLaunched] = useState(false);
  const [copiedCA, setCopiedCA] = useState(false);

  useEffect(() => {
    // Load config from coin-config.json
    fetch('/coin-config.json')
      .then(res => res.json())
      .then(config => {
        setContractAddress(config.contractAddress);
        setIsLaunched(config.isLaunched);
      })
      .catch(() => {
        console.log('Config not found, using defaults');
      });
  }, []);

  const copyToClipboard = () => {
    if (isLaunched && contractAddress !== 'TBA - Coming Soon') {
      navigator.clipboard.writeText(contractAddress);
      setCopiedCA(true);
      setTimeout(() => setCopiedCA(false), 2000);
    }
  };

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

      {/* CA Display Box - Bottom Center */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white border-2 border-black p-3 shadow-lg">
          <div className="text-center">
            <div className="text-xs font-mono text-black mb-1 tracking-wider">CONTRACT ADDRESS</div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 border border-black font-mono text-xs ${isLaunched ? 'bg-green-50 text-black' : 'bg-gray-50 text-gray-500'}`}>
                {contractAddress}
              </div>
              {isLaunched && contractAddress !== 'TBA - Coming Soon' && (
                <button
                  onClick={copyToClipboard}
                  className="px-2 py-1 border border-black bg-white hover:bg-black hover:text-white font-mono text-xs transition-colors"
                >
                  {copiedCA ? '✓' : '📋'}
                </button>
              )}
              <Link href="/coin" className="px-2 py-1 border border-black bg-white hover:bg-black hover:text-white font-mono text-xs transition-colors">
                INFO
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}