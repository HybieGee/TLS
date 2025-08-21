'use client';

import Link from 'next/link';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useNotification } from '@/app/components/Notification';

export default function CreatePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [description, setDescription] = useState('');
  const { showNotification, NotificationComponent } = useNotification();
  
  // Drawing tool state
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [isEraser, setIsEraser] = useState(false);
  const [brushType, setBrushType] = useState('round');

  const updateCanvasStyle = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2; // Eraser is bigger
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = opacity;
    }
    
    ctx.lineCap = brushType === 'square' ? 'square' : 'round';
    ctx.lineJoin = 'round';
  }, [isEraser, brushSize, currentColor, opacity, brushType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    updateCanvasStyle();
  }, [updateCanvasStyle]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    updateCanvasStyle();
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

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
      showNotification('Please enter a character name and draw something!', 'error');
      return;
    }

    const imageData = canvas.toDataURL('image/png');
    
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: characterName,
          description: description || 'A unique character for the Living Sketchbook',
          imageData: imageData,
          vectorJson: null
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        showNotification(data.message || 'Character submitted successfully!', 'success');
        clearCanvas();
        setCharacterName('');
        setDescription('');
      } else {
        showNotification(data.error || 'Failed to submit character', 'error');
      }
    } catch (error) {
      console.error('Submission error:', error);
      showNotification('Failed to submit character. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      {NotificationComponent}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold font-mono text-black mb-8">
          Create Your Character
        </h1>
        
        <div className="border-2 border-black p-8 bg-white">
          {/* Drawing Tools */}
          <div className="mb-8">
            <h2 className="text-lg font-mono font-bold mb-4">Drawing Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 border border-gray-300">
              
              {/* Color Palette */}
              <div>
                <label className="block text-sm font-mono font-bold mb-2">Color</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 border-2 ${currentColor === color ? 'border-gray-800 scale-110' : 'border-gray-400'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => { setCurrentColor(color); setIsEraser(false); }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => { setCurrentColor(e.target.value); setIsEraser(false); }}
                  className="w-full h-8 border border-gray-300"
                />
              </div>

              {/* Brush Size */}
              <div>
                <label className="block text-sm font-mono font-bold mb-2">Brush Size: {brushSize}px</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs font-mono text-gray-600 mt-1">
                  <span>1px</span>
                  <span>50px</span>
                </div>
              </div>

              {/* Opacity */}
              <div>
                <label className="block text-sm font-mono font-bold mb-2">Opacity: {Math.round(opacity * 100)}%</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs font-mono text-gray-600 mt-1">
                  <span>10%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Tools */}
              <div>
                <label className="block text-sm font-mono font-bold mb-2">Tools</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setIsEraser(!isEraser)}
                    className={`w-full px-3 py-2 border-2 font-mono text-sm ${isEraser ? 'border-red-500 bg-red-100' : 'border-black bg-white'}`}
                  >
                    {isEraser ? '🧹 Eraser ON' : '✏️ Brush'}
                  </button>
                  <select
                    value={brushType}
                    onChange={(e) => setBrushType(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 font-mono text-sm"
                  >
                    <option value="round">Round Brush</option>
                    <option value="square">Square Brush</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Drawing Canvas */}
          <div className="mb-8">
            <h2 className="text-lg font-mono font-bold mb-4">Draw Your Character</h2>
            <div className="border-2 border-black mb-4">
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="cursor-crosshair block"
                style={{ width: '600px', height: '400px' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            
            <div className="flex gap-2 mb-4 flex-wrap">
              <button 
                onClick={clearCanvas}
                className="px-4 py-2 border-2 border-red-500 bg-white hover:bg-red-50 text-red-600 font-mono"
              >
                🗑️ Clear All
              </button>
              <button 
                onClick={() => {setCurrentColor('#000000'); setBrushSize(3); setOpacity(1); setIsEraser(false); setBrushType('round');}}
                className="px-4 py-2 border-2 border-blue-500 bg-white hover:bg-blue-50 text-blue-600 font-mono"
              >
                🔄 Reset Tools
              </button>
              <span className="px-4 py-2 font-mono text-sm text-gray-600 flex items-center">
                Full color support • Click and drag to draw • Use tools above
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
        
        <div className="mt-8 flex gap-4 flex-wrap">
          <Link href="/" className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 text-black font-mono">
            ← Back to Gallery
          </Link>
          <Link href="/vote" className="px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-mono transition-colors">
            ★ Vote on Characters
          </Link>
          <Link href="/hall" className="px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-mono transition-colors">
            ♚ Hall of Fame
          </Link>
        </div>
      </div>
    </div>
  );
}