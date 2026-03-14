import React from 'react';
import Login from './components/Login';
import RoomList from './components/RoomList';
import MessageRoom from './components/Room';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  const [user, setUser] = React.useState<any>(null);

  const handleLogin = (token: string, userData: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', userData.username);
    setUser(userData);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/" element={user ? <RoomList user={user} /> : <Login onLogin={handleLogin} />} />
        <Route path="/room/:roomId" element={<MessageRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;