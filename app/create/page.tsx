'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';

export default function CreatePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas for black & white drawing
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const submitCharacter = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !characterName.trim()) {
      alert('Please enter a character name and draw something!');
      return;
    }

    // Convert canvas to data URL
    const imageData = canvas.toDataURL('image/png');
    
    // TODO: Send to API endpoint
    console.log({
      name: characterName,
      description: description,
      imageData: imageData
    });

    alert('Character submitted! (API integration coming soon)');
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold font-mono text-black mb-8">
          Create Your Character
        </h1>
        
        <div className="border-2 border-black p-8 bg-white">
          {/* Drawing Canvas */}
          <div className="mb-8">
            <h2 className="text-lg font-mono font-bold mb-4">Draw Your Character</h2>
            <div className="border-2 border-black mb-4">
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            
            <div className="flex gap-2 mb-4">
              <button 
                onClick={clearCanvas}
                className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 text-black font-mono"
              >
                Clear Canvas
              </button>
              <span className="px-4 py-2 font-mono text-sm text-gray-600">
                Black & white only • Click and drag to draw
              </span>
            </div>
          </div>
          
          {/* Character Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono font-bold mb-2">
                Character Name (max 40 characters)
              </label>
              <input 
                type="text" 
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value.slice(0, 40))}
                className="w-full px-3 py-2 border-2 border-black font-mono"
                placeholder="Enter character name..."
              />
              <div className="text-xs font-mono text-gray-500 mt-1">
                {characterName.length}/40 characters
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-mono font-bold mb-2">
                Description (max 200 characters)
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                className="w-full px-3 py-2 border-2 border-black font-mono resize-none"
                rows={3}
                placeholder="Describe your character..."
              />
              <div className="text-xs font-mono text-gray-500 mt-1">
                {description.length}/200 characters
              </div>
            </div>
            
            <button 
              onClick={submitCharacter}
              className="px-6 py-3 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-mono transition-colors"
            >
              Submit Character
            </button>
          </div>
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