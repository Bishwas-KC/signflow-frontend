import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '@/api/auth.api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
 const [user, setUser] = useState(() => {
 try { return JSON.parse(localStorage.getItem('user')); }
 catch { return null; }
 });
 const [loading, setLoading] = useState(true);

 // Verify token on mount
 useEffect(() => {
 const token = localStorage.getItem('token');
 if (!token) { setLoading(false); return; }

  authApi.me()
  .then(res => setUser(res.data.user))
  .catch((error) => {
  if (error?.response?.status === 401) {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setUser(null);
  }
  })
  .finally(() => setLoading(false));
 }, []);

 const saveSession = useCallback((userData, token) => {
 localStorage.setItem('token', token);
 localStorage.setItem('user', JSON.stringify(userData));
 setUser(userData);
 }, []);

 const register = useCallback(async (data) => {
 const res = await authApi.register(data);
 saveSession(res.data.user, res.data.token);
  toast.success('Welcome to Signflow.');
 return res;
 }, [saveSession]);

 const login = useCallback(async (data) => {
 const res = await authApi.login(data);
 saveSession(res.data.user, res.data.token);
  toast.success(`Welcome back, ${res.data.user.name}.`);
 return res;
 }, [saveSession]);

 const logout = useCallback(async () => {
 try { await authApi.logout(); } catch { /* ignore */ }
 localStorage.removeItem('token');
 localStorage.removeItem('user');
 setUser(null);
 }, []);

 const loginWithGoogle = useCallback(async () => {
   try {
     const res = await authApi.googleRedirect();
     window.location.href = res.data.redirect_url;
   } catch {
     toast.error('Failed to initiate Google sign-in.');
   }
  }, []);

 return (
 <AuthContext.Provider value={{ user, loading, register, login, logout, loginWithGoogle, saveSession }}>
 {children}
 </AuthContext.Provider>
 );
}

export function useAuth() {
 const ctx = useContext(AuthContext);
 if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
 return ctx;
}