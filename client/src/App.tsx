import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import MainChat from './components/MainChat';
import RoomList from './components/RoomList';
import Room from './components/Room';
import { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
            const userData = await res.json();
            const formattedUser: User = {
              id: userData.id,
              name: userData.full_name || userData.username,
              avatar: `https://i.pravatar.cc/150?u=${userData.username}`,
              email: userData.email || '',
              role: userData.role_level >= 50 ? 'admin' : 'user',
              role_level: userData.role_level
            };
            setUser(formattedUser);
          } else {
            // Invalid token
            handleLogout();
          }
        } catch (e) {
          console.error('Failed to authenticate session', e);
          handleLogout();
        }
      } else {
        handleLogout();
      }
      setLoading(false);
    };

    initApp();
  }, []);

  const handleLogin = (token: string, userData: any) => {
    const formattedUser: User = {
      id: userData.user_id || userData.id,
      name: userData.full_name || userData.username,
      avatar: `https://i.pravatar.cc/150?u=${userData.username}`,
      email: userData.email || '',
      role: userData.role_level >= 50 ? 'admin' : 'user',
      role_level: userData.role_level
    };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(formattedUser));
    localStorage.setItem('username', formattedUser.name);
    setUser(formattedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('username');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/" 
          element={user ? <MainChat user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/rooms" 
          element={user ? <RoomList user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/room/:roomId" 
          element={user ? <Room /> : <Navigate to="/login" />} 
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
