
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Lobby from './components/Lobby';
import AdminPanel from './components/AdminPanel';
import GameRoom from './components/GameRoom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/room/:id" element={<GameRoom />} />
      </Routes>
    </BrowserRouter>
  );
}
