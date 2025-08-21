'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface Winner {
  id: string;
  submissionId: string;
  periodKey: string;
  createdAt: string;
  votesAtWin: number;
  name: string;
  description: string;
  imageUrl: string;
  userAlias?: string;
}

export default function HallPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      const response = await fetch('/api/winners');
      const data = await response.json();
      setWinners(data.winners || []);
    } catch (error) {
      console.error('Failed to fetch winners:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold font-mono text-black mb-8">
          Hall of Fame
        </h1>
        
        {loading ? (
          <div className="border-2 border-black p-8 bg-white">
            <p className="text-lg font-mono text-gray-700">
              Loading hall of fame...
            </p>
          </div>
        ) : winners.length === 0 ? (
          <div className="border-2 border-black p-8 bg-white">
            <p className="text-lg font-mono text-gray-700 mb-4">
              No winners yet! Be the first to win a voting period.
            </p>
            <p className="font-mono text-sm text-gray-600">
              Winners are selected every hour based on community votes.
            </p>
          </div>
        ) : (
          <>
            <div className="border-2 border-black p-8 bg-white mb-8">
              <p className="text-lg font-mono text-gray-700 mb-4">
                These characters have won the hourly voting and now live forever in our gallery!
              </p>
              <p className="font-mono text-sm text-gray-600">
                Each winner earned their place through community votes and now appears in the 3D gallery.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {winners.map((winner, index) => (
                <div key={winner.id} className="border-2 border-black bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-2xl font-bold">#{index + 1}</span>
                    <span className="font-mono text-xs text-gray-500">
                      {formatDate(winner.createdAt)}
                    </span>
                  </div>
                  
                  <div className="aspect-square border border-gray-300 bg-gray-50 mb-4 overflow-hidden relative">
                    {winner.imageUrl.startsWith('data:') ? (
                      <img 
                        src={winner.imageUrl} 
                        alt={winner.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Image 
                        src={winner.imageUrl} 
                        alt={winner.name}
                        fill
                        className="object-contain"
                      />
                    )}
                  </div>
                  
                  <h3 className="font-mono font-bold text-lg mb-2">{winner.name}</h3>
                  <p className="font-mono text-sm text-gray-600 mb-2">
                    {winner.description}
                  </p>
                  
                  {winner.userAlias && (
                    <p className="font-mono text-xs text-gray-500 mb-2">
                      Created by {winner.userAlias}
                    </p>
                  )}
                  
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <span className="font-mono text-sm font-bold">
                      Won with {winner.votesAtWin} votes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        <div className="mt-8 flex gap-4">
          <Link href="/" className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 text-black font-mono">
            ← Back to Gallery
          </Link>
          <Link href="/vote" className="px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-mono transition-colors">
            Vote Now
          </Link>
          <Link href="/create" className="px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-mono transition-colors">
            + Create Character
          </Link>
        </div>
      </div>
    </div>
  );
}