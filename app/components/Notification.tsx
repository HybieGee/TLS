'use client';

import { useState, useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export function Notification({ message, type, duration = 5000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  const typeStyles = {
    success: 'border-black bg-white text-black',
    error: 'border-black bg-black text-white',
    info: 'border-black bg-gray-100 text-black'
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className={`border-2 font-mono p-4 shadow-lg ${typeStyles[type]}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-bold">
              {type === 'success' && '✓ Success'}
              {type === 'error' && '✗ Error'}
              {type === 'info' && 'ℹ Info'}
            </p>
            <p className="text-sm mt-1">{message}</p>
          </div>
          <button 
            onClick={handleClose}
            className="ml-2 font-bold text-lg leading-none hover:opacity-70"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for managing notifications
export function useNotification() {
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const NotificationComponent = notification ? (
    <Notification 
      message={notification.message}
      type={notification.type}
      onClose={hideNotification}
    />
  ) : null;

  return {
    showNotification,
    hideNotification,
    NotificationComponent
  };
}