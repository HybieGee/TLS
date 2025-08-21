'use client';

import { useState, useEffect } from 'react';
import { characterModels } from './PlayerAvatar';

interface CharacterSelectorProps {
  onCharacterChange?: (model: string, color: string, name: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function CharacterSelector({ onCharacterChange, isOpen, onClose }: CharacterSelectorProps) {
  const [selectedModel, setSelectedModel] = useState('capsule');
  const [selectedColor, setSelectedColor] = useState('#4A90E2');
  const [playerName, setPlayerName] = useState('');

  // Load saved preferences on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem('playerModel') || 'capsule';
      const savedColor = localStorage.getItem('playerColor') || '#4A90E2';
      const savedName = localStorage.getItem('playerName') || '';
      
      setSelectedModel(savedModel);
      setSelectedColor(savedColor);
      setPlayerName(savedName);
    }
  }, []);

  const handleSave = () => {
    const finalName = playerName.trim() || `Guest_${Math.floor(Math.random() * 1000)}`;
    
    // Save to localStorage
    localStorage.setItem('playerModel', selectedModel);
    localStorage.setItem('playerColor', selectedColor);
    localStorage.setItem('playerName', finalName);
    
    // Notify parent component
    onCharacterChange?.(selectedModel, selectedColor, finalName);
    
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

        {/* Model Selection */}
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2">
            Character Model
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(characterModels).map(([key, model]) => (
              <button
                key={key}
                onClick={() => setSelectedModel(key)}
                className={`p-3 border-2 rounded text-center hover:bg-gray-50 ${
                  selectedModel === key
                    ? 'border-black bg-gray-100'
                    : 'border-gray-300'
                }`}
              >
                <div className="text-sm font-semibold">{model.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2">
            Character Color
          </label>
          <div className="grid grid-cols-6 gap-2">
            {characterModels[selectedModel as keyof typeof characterModels].colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded border-2 hover:scale-110 transition-transform ${
                  selectedColor === color
                    ? 'border-black border-4'
                    : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Preview Text */}
        <div className="mb-4 p-3 bg-gray-50 rounded border">
          <div className="text-sm text-gray-600">Preview:</div>
          <div className="font-semibold">
            {playerName || `Guest_${Math.floor(Math.random() * 1000)}`} - {characterModels[selectedModel as keyof typeof characterModels].name}
          </div>
          <div 
            className="w-4 h-4 rounded inline-block ml-2 border border-gray-300"
            style={{ backgroundColor: selectedColor }}
          />
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
    model: 'capsule',
    color: '#4A90E2',
    name: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem('playerModel') || 'capsule';
      const savedColor = localStorage.getItem('playerColor') || '#4A90E2';
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