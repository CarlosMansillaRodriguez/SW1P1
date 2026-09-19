import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import * as authApi from '../api/authApi';
import type { AuthUser } from '../types/models';

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const loadStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser());

  const persist = (authUser: AuthUser) => {
    localStorage.setItem('token', authUser.token);
    localStorage.setItem('user', JSON.stringify(authUser));
    setUser(authUser);
  };

  const login = useCallback(async (email: string, password: string) => {
    const authUser = await authApi.login(email, password);
    persist(authUser);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const authUser = await authApi.register(name, email, password);
    persist(authUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}