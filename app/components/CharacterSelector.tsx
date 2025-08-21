'use client';

import { useState, useEffect } from 'react';
import { characterModels } from './PlayerAvatar';

interface CharacterSelectorProps {
  onCharacterChange?: (model: string, color: string, name: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function CharacterSelector({ onCharacterChange, isOpen, onClose }: CharacterSelectorProps) {
  const [selectedColor, setSelectedColor] = useState('#333333');
  const [playerName, setPlayerName] = useState('');

  // Load saved preferences on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedColor = localStorage.getItem('playerColor') || '#333333';
      const savedName = localStorage.getItem('playerName') || '';
      
      setSelectedColor(savedColor);
      setPlayerName(savedName);
    }
  }, []);

  const handleSave = () => {
    const finalName = playerName.trim() || `Guest_${Math.floor(Math.random() * 1000)}`;
    
    // Save to localStorage (always stick figure)
    localStorage.setItem('playerModel', 'stick');
    localStorage.setItem('playerColor', selectedColor);
    localStorage.setItem('playerName', finalName);
    
    // Notify parent component
    onCharacterChange?.('stick', selectedColor, finalName);
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full m-4 border-2 border-black">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Choose Your Avatar</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Player Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2">
            Player Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
            maxLength={20}
          />
        </div>

        {/* Color Selection with Preview */}
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2">
            Choose Your Stick Figure Color
          </label>
          <div className="grid grid-cols-4 gap-3">
            {characterModels.stick.colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`p-3 border-2 rounded hover:scale-105 transition-transform ${
                  selectedColor === color
                    ? 'border-black border-4 bg-gray-100'
                    : 'border-gray-300'
                }`}
              >
                {/* Mini stick figure preview */}
                <div className="flex flex-col items-center">
                  <svg width="32" height="48" viewBox="0 0 32 48" className="mb-1">
                    {/* Head */}
                    <circle cx="16" cy="8" r="4" fill={color} />
                    {/* Body */}
                    <line x1="16" y1="12" x2="16" y2="28" stroke={color} strokeWidth="2" />
                    {/* Arms */}
                    <line x1="8" y1="20" x2="24" y2="20" stroke={color} strokeWidth="2" />
                    {/* Left leg */}
                    <line x1="16" y1="28" x2="10" y2="42" stroke={color} strokeWidth="2" />
                    {/* Right leg */}
                    <line x1="16" y1="28" x2="22" y2="42" stroke={color} strokeWidth="2" />
                  </svg>
                  <div className="text-xs" style={{ color }}>{color}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="mb-4 p-4 bg-gray-50 rounded border">
          <div className="text-sm text-gray-600 mb-2">Preview:</div>
          <div className="flex items-center">
            <svg width="40" height="60" viewBox="0 0 40 60" className="mr-3">
              {/* Head */}
              <circle cx="20" cy="10" r="5" fill={selectedColor} />
              {/* Body */}
              <line x1="20" y1="15" x2="20" y2="35" stroke={selectedColor} strokeWidth="3" />
              {/* Arms */}
              <line x1="10" y1="25" x2="30" y2="25" stroke={selectedColor} strokeWidth="3" />
              {/* Left leg */}
              <line x1="20" y1="35" x2="12" y2="55" stroke={selectedColor} strokeWidth="3" />
              {/* Right leg */}
              <line x1="20" y1="35" x2="28" y2="55" stroke={selectedColor} strokeWidth="3" />
            </svg>
            <div>
              <div className="font-semibold text-lg">
                {playerName || `Guest_${Math.floor(Math.random() * 1000)}`}
              </div>
              <div className="text-sm text-gray-600">Stick Figure</div>
              <div className="text-xs" style={{ color: selectedColor }}>{selectedColor}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Save & Join Gallery
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to manage character selection state
export function useCharacterSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [characterData, setCharacterData] = useState({
    model: 'stick',
    color: '#333333',
    name: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem('playerModel') || 'stick';
      const savedColor = localStorage.getItem('playerColor') || '#333333';
      const savedName = localStorage.getItem('playerName') || '';
      
      setCharacterData({
        model: savedModel,
        color: savedColor,
        name: savedName
      });
    }
  }, []);

  const openSelector = () => setIsOpen(true);
  const closeSelector = () => setIsOpen(false);

  const handleCharacterChange = (model: string, color: string, name: string) => {
    setCharacterData({ model, color, name });
  };

  return {
    isOpen,
    openSelector,
    closeSelector,
    characterData,
    handleCharacterChange
  };
}