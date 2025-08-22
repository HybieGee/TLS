'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function CoinPage() {
  const [copiedCA, setCopiedCA] = useState(false);
  const [contractAddress, setContractAddress] = useState('TBA - Coming Soon');
  const [isLaunched, setIsLaunched] = useState(false);

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
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-2 border-black p-8 bg-white mb-8">
          <h1 className="text-4xl font-bold font-mono text-black mb-4">
            🪙 The Living Sketchbook Coin
          </h1>
          <p className="font-mono text-gray-700">
            Supporting creativity and community-driven projects
          </p>
        </div>

        {/* Contract Address Section */}
        <div className="border-2 border-black p-6 bg-white mb-8">
          <h2 className="text-2xl font-bold font-mono mb-4">Contract Address (CA)</h2>
          <div className="flex items-center gap-4">
            <div className={`flex-1 p-4 border-2 ${isLaunched ? 'border-green-500 bg-green-50' : 'border-gray-400 bg-gray-50'} font-mono`}>
              <span className={isLaunched ? 'text-black' : 'text-gray-500'}>
                {contractAddress}
              </span>
            </div>
            {isLaunched && (
              <button
                onClick={copyToClipboard}
                className="px-6 py-4 border-2 border-black bg-white hover:bg-black hover:text-white font-mono transition-colors"
              >
                {copiedCA ? '✅ Copied!' : '📋 Copy'}
              </button>
            )}
          </div>
          {!isLaunched && (
            <p className="mt-4 font-mono text-sm text-gray-600">
              ⏰ The coin has not launched yet. Check back soon!
            </p>
          )}
        </div>

        {/* About the Coin */}
        <div className="border-2 border-black p-6 bg-white mb-8">
          <h2 className="text-2xl font-bold font-mono mb-4">About the Coin</h2>
          <div className="space-y-4 font-mono text-gray-800">
            <p>
              The Living Sketchbook Coin is more than just a token - it&apos;s a commitment to fostering 
              creativity and supporting genuine community-driven projects in the crypto space.
            </p>
            <p>
              By holding this coin, you&apos;re not just investing in a project, you&apos;re becoming part of 
              a movement that values art, creativity, and authentic community building over quick profits.
            </p>
          </div>
        </div>

        {/* Why Support Community Projects */}
        <div className="border-2 border-black p-6 bg-white mb-8">
          <h2 className="text-2xl font-bold font-mono mb-4">Supporting Real Community Projects</h2>
          <div className="space-y-4 font-mono text-gray-800">
            <div className="border-l-4 border-black pl-4">
              <h3 className="font-bold mb-2">💡 Why It Matters</h3>
              <p>
                We believe in using our platform and resources to help launch other real, 
                community-based projects. Too many projects in the crypto space are driven 
                by hype and speculation. We&apos;re different.
              </p>
            </div>
            <div className="border-l-4 border-black pl-4">
              <h3 className="font-bold mb-2">🎨 Creative Focus</h3>
              <p>
                Projects that encourage creativity, art, and genuine community engagement 
                will receive priority support. We&apos;re building a network of creators, not 
                just traders.
              </p>
            </div>
            <div className="border-l-4 border-black pl-4">
              <h3 className="font-bold mb-2">🤝 Community First</h3>
              <p>
                Every project we support must demonstrate real community value and engagement. 
                No pump and dumps, no rug pulls - just genuine projects with real people behind them.
              </p>
            </div>
          </div>
        </div>

        {/* Author Verification */}
        <div className="border-2 border-black p-6 bg-white mb-8">
          <h2 className="text-2xl font-bold font-mono mb-4">Author Verification</h2>
          <div className="space-y-4 font-mono text-gray-800">
            <div className="bg-yellow-50 border-2 border-yellow-400 p-4">
              <p className="font-bold mb-2">🔐 Coming Soon: Verification System</p>
              <p>
                We will be implementing author verification to ensure all supported projects 
                are legitimate and run by real, accountable individuals.
              </p>
            </div>
            <ul className="space-y-2">
              <li>✓ KYC verification for project leaders</li>
              <li>✓ Transparent team information</li>
              <li>✓ Regular community updates</li>
              <li>✓ Accountability measures</li>
            </ul>
          </div>
        </div>

        {/* Self-Funded Note */}
        <div className="border-2 border-black p-6 bg-white mb-8">
          <h2 className="text-2xl font-bold font-mono mb-4">100% Self-Funded Marketing</h2>
          <div className="space-y-4 font-mono text-gray-800">
            <div className="bg-green-50 border-2 border-green-500 p-4">
              <p className="font-bold mb-2">💰 No Hidden Costs</p>
              <p>
                All advertising and marketing for this coin is paid out of pocket by the 
                founding team. We&apos;re not using investor funds or community money for promotion.
              </p>
            </div>
            <p>
              This ensures that:
            </p>
            <ul className="space-y-2 ml-6">
              <li>• Your investment goes toward development, not ads</li>
              <li>• We&apos;re personally invested in the project&apos;s success</li>
              <li>• No artificial hype or paid influencer pumps</li>
              <li>• Organic, genuine growth driven by community value</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600">
              We believe in putting our own money where our mouth is. If we&apos;re asking you 
              to believe in this project, we should be the first ones to invest in its success.
            </p>
          </div>
        </div>

        {/* Tokenomics */}
        <div className="border-2 border-black p-6 bg-white mb-8">
          <h2 className="text-2xl font-bold font-mono mb-4">Tokenomics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
            <div className="border border-gray-300 p-4">
              <span className="text-gray-600">Total Supply:</span>
              <p className="font-bold">1,000,000,000</p>
            </div>
            <div className="border border-gray-300 p-4">
              <span className="text-gray-600">Network:</span>
              <p className="font-bold">Solana</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="border-2 border-black p-6 bg-white mb-8 text-center">
          <h2 className="text-2xl font-bold font-mono mb-4">Join the Movement</h2>
          <p className="font-mono text-gray-700 mb-6">
            Be part of something real. Support creativity. Build community.
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-6 py-3 border-2 border-black bg-white hover:bg-black hover:text-white font-mono transition-colors">
              🐦 Follow Twitter
            </button>
          </div>
        </div>

        {/* Back Navigation */}
        <div className="flex gap-4">
          <Link href="/" className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 text-black font-mono">
            ← Back to Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}