'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  kind: string;
  alias?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authenticate: () => Promise<void>;
  updateAlias: (alias: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/user');
      const data = await response.json();
      
      if (data.authenticated) {
        setUser(data.user);
      } else {
        await authenticate();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const authenticate = async () => {
    try {
      const response = await fetch('/api/guest', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setUser({
          id: data.userId,
          kind: data.kind,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const updateAlias = async (alias: string) => {
    try {
      const response = await fetch('/api/user/alias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(prev => prev ? { ...prev, alias: data.alias } : null);
      }
    } catch (error) {
      console.error('Alias update failed:', error);
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authenticate, updateAlias }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}