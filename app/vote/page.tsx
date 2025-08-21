'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface Submission {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  userAlias?: string;
  voteCount: number;
}

interface Period {
  key: string;
  startsAt: string;
  endsAt: string;
  timeRemaining: number;
  isResolved: boolean;
  winnerId?: string;
}

export default function VotePage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [period, setPeriod] = useState<Period | null>(null);
  const [votedSubmissionId, setVotedSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('--:--');

  useEffect(() => {
    fetchCurrentPeriod();
  }, []);

  useEffect(() => {
    if (period) {
      fetchSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!period) return;
      
      const now = Date.now();
      const end = new Date(period.endsAt).getTime();
      const remaining = Math.max(0, end - now);
      
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      
      if (remaining === 0) {
        setTimeout(() => {
          fetchCurrentPeriod();
          setVotedSubmissionId(null);
        }, 2000);
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchCurrentPeriod = async () => {
    try {
      const response = await fetch('/api/periods/current');
      const data = await response.json();
      setPeriod(data.period);
    } catch (error) {
      console.error('Failed to fetch period:', error);
    }
  };

  const fetchSubmissions = async () => {
    if (!period) return;
    
    try {
      const response = await fetch(`/api/votes?period=${period.key}`);
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleVote = async (submissionId: string) => {
    if (!period || votedSubmissionId) return;
    
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          periodKey: period.key
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setVotedSubmissionId(submissionId);
        setSubmissions(prev => prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, voteCount: sub.voteCount + 1 }
            : sub
        ));
      } else {
        alert(data.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Vote error:', error);
      alert('Failed to submit vote');
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-mono text-black">
            Vote for Characters
          </h1>
          <div className="border-2 border-black px-4 py-2 bg-white">
            <span className="font-mono font-bold">Time left: </span>
            <span className="font-mono text-xl">{timeLeft}</span>
          </div>
        </div>
        
        {loading ? (
          <div className="border-2 border-black p-8 bg-white mb-8">
            <p className="text-lg font-mono text-gray-700">
              Loading submissions...
            </p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="border-2 border-black p-8 bg-white mb-8">
            <p className="text-lg font-mono text-gray-700 mb-4">
              No submissions yet for this voting period.
            </p>
            <Link href="/create" className="font-mono underline text-blue-600">
              Be the first to submit a character!
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map(submission => (
              <div key={submission.id} className="border-2 border-black bg-white p-4">
                <div className="aspect-square border border-gray-300 bg-gray-50 mb-4 overflow-hidden relative">
                  {submission.imageUrl.startsWith('data:') ? (
                    <img 
                      src={submission.imageUrl} 
                      alt={submission.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Image 
                      src={submission.imageUrl} 
                      alt={submission.name}
                      fill
                      className="object-contain"
                    />
                  )}
                </div>
                <h3 className="font-mono font-bold text-lg mb-2">{submission.name}</h3>
                <p className="font-mono text-sm text-gray-600 mb-2">
                  {submission.description}
                </p>
                {submission.userAlias && (
                  <p className="font-mono text-xs text-gray-500 mb-4">
                    by {submission.userAlias}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold">{submission.voteCount} votes</span>
                  <button 
                    onClick={() => handleVote(submission.id)}
                    disabled={!!votedSubmissionId}
                    className={`px-4 py-2 border-2 border-black font-mono transition-colors ${
                      votedSubmissionId === submission.id
                        ? 'bg-green-500 text-white'
                        : votedSubmissionId
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-white hover:bg-black hover:text-white cursor-pointer'
                    }`}
                  >
                    {votedSubmissionId === submission.id ? 'Voted!' : 
                     votedSubmissionId ? 'Already Voted' : 'Vote'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 flex gap-4">
          <Link href="/" className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 text-black font-mono">
            ← Back to Gallery
          </Link>
          <Link href="/create" className="px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-mono transition-colors">
            + Create Character
          </Link>
        </div>
      </div>
    </div>
  );
}