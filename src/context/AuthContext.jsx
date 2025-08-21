import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';
import { createSocketConnection } from '../socket.js';
import { createPeer } from '../peer.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [peer, setPeer] = useState(null);
  const [peerReady, setPeerReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      if (!token) return;
      try {
        const { data } = await api.get('/api/auth/me');
        if (!isMounted) return;
        setUser(data.user);
        const s = createSocketConnection(token);
        setSocket(s);
        
        const p = createPeer(data.user.id);
        setPeer(p);
        
        // Wait for peer to be ready
        p.on('open', () => {
          if (isMounted) {
            setPeerReady(true);
          }
        });
        
        p.on('error', (error) => {
          console.error('Peer connection error:', error);
          if (isMounted) {
            setPeerReady(false);
          }
        });
        
        return () => {
          s?.disconnect();
          p?.destroy();
        };
      } catch (e) {
        console.error(e);
        // logout();
      }
    }
    const cleanup = init();
    return () => {
      isMounted = false;
      if (typeof cleanup === 'function') cleanup();
    };
  }, [token]);

  async function login(email, password) {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function signup(name, email, password) {
    const { data } = await api.post('/api/auth/signup', { name, email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    socket?.disconnect();
    peer?.destroy();
    setSocket(null);
    setPeer(null);
    setPeerReady(false);
  }

  const value = useMemo(() => ({ token, user, login, signup, logout, socket, peer, peerReady }), [token, user, socket, peer, peerReady]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}