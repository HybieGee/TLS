import Link from 'next/link';

export default function VotePage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-mono text-black">
            Vote for Characters
          </h1>
          <div className="border-2 border-black px-4 py-2 bg-white">
            <span className="font-mono font-bold">Time left: </span>
            <span className="font-mono text-xl">--:--</span>
          </div>
        </div>
        
        <div className="border-2 border-black p-8 bg-white mb-8">
          <p className="text-lg font-mono text-gray-700 mb-4">
            🗳️ Voting system coming soon...
          </p>
          <p className="font-mono text-sm text-gray-600">
            This will show all submitted characters for this hour&apos;s voting period.<br/>
            Community votes determine which character comes to life in the gallery!
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="border-2 border-black bg-white p-4">
              <div className="aspect-square border border-gray-300 bg-gray-50 mb-4 flex items-center justify-center">
                <span className="font-mono text-gray-400">Character #{i}</span>
              </div>
              <h3 className="font-mono font-bold text-lg mb-2">Sample Character</h3>
              <p className="font-mono text-sm text-gray-600 mb-4">
                A placeholder character for demonstration...
              </p>
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold">0 votes</span>
                <button 
                  className="px-4 py-2 border-2 border-black bg-gray-200 text-gray-500 font-mono cursor-not-allowed"
                  disabled
                >
                  Vote (Soon)
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8">
          <Link href="/" className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 text-black font-mono">
            ← Back to Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}