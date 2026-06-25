import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api';

interface User {
  id: string;
  username: string;
  realName: string;
  tenantId: string;
  roles: { id: string; name: string; code: string }[];
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, tenantCode: string) => Promise<void>;
  logout: () => void;
  hasPermission: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.profile()
        .then((res: any) => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string, tenantCode: string) => {
    const res: any = await authApi.login({ username, password, tenantCode });
    localStorage.setItem('token', res.data.accessToken);
    localStorage.setItem('tenantCode', tenantCode);
    const profileRes: any = await authApi.profile();
    setUser(profileRes.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const hasPermission = (code: string) => {
    if (!user) return false;
    return user.permissions?.includes(code) || user.roles?.some(r => r.code === 'boss' || r.code === 'admin');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
