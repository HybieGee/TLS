export default function CreatePage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold font-mono text-black mb-8">
          Create Your Character
        </h1>
        
        <div className="border-2 border-black p-8 bg-white">
          <p className="text-lg font-mono text-gray-700 mb-4">
            🎨 Drawing canvas coming soon...
          </p>
          <p className="font-mono text-sm text-gray-600 mb-8">
            This will be where you can draw black & white characters that come to life in the gallery.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono font-bold mb-2">
                Character Name (max 40 characters)
              </label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border-2 border-black font-mono"
                placeholder="Enter character name..."
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-mono font-bold mb-2">
                Description (max 200 characters)
              </label>
              <textarea 
                className="w-full px-3 py-2 border-2 border-black font-mono resize-none"
                rows={3}
                placeholder="Describe your character..."
                disabled
              />
            </div>
            
            <button 
              className="px-6 py-3 border-2 border-black bg-gray-200 text-gray-500 font-mono cursor-not-allowed"
              disabled
            >
              Submit Character (Coming Soon)
            </button>
          </div>
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