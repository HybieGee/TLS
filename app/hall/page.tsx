export default function HallPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold font-mono text-black mb-8">
          Hall of Fame
        </h1>
        
        <div className="border-2 border-black p-8 bg-white mb-8">
          <p className="text-lg font-mono text-gray-700 mb-4">
            🏆 Hall of Fame coming soon...
          </p>
          <p className="font-mono text-sm text-gray-600">
            This will show all past winners with their vote counts, creation dates, and artist credits.<br/>
            Click any winner to see them in the living gallery!
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="border-2 border-black bg-white p-4">
              <div className="aspect-square border border-gray-300 bg-gray-50 mb-4 flex items-center justify-center">
                <span className="font-mono text-gray-400">Winner #{i}</span>
              </div>
              <h3 className="font-mono font-bold text-sm mb-1">Historic Winner</h3>
              <p className="font-mono text-xs text-gray-600 mb-2">
                Won with 42 votes
              </p>
              <p className="font-mono text-xs text-gray-500">
                2024-01-{i.toString().padStart(2, '0')} 15:00 UTC
              </p>
              <button className="mt-2 text-xs font-mono border border-black px-2 py-1 hover:bg-gray-100">
                View in Gallery
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-8">
          <a href="/" className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 text-black font-mono">
            ← Back to Gallery
          </a>
        </div>
      </div>
    </div>
  );
}