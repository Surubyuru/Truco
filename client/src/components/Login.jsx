
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

export default function Login() {
    const [name, setName] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        // Conectar socket y guardar user
        // socket.auth = { username: name }; // Si usaramos auth middleware
        socket.connect();
        localStorage.setItem('truco_player_name', name);
        navigate('/lobby');
    };

    return (
        <div className="page-container">
            <div className="glass-panel text-center floating" style={{ maxWidth: '400px', width: '100%' }}>
                <div className="mb-8">
                    <h1 className="title-large title-gradient">TRUCO</h1>
                    <h2 className="subtitle">Uruguayo</h2>
                </div>

                <form onSubmit={handleLogin} className="flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Tu Nombre de Jugador"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-premium"
                        maxLength={12}
                    />
                    <button type="submit" className="btn-primary w-full">
                        INGRESAR
                    </button>
                </form>
            </div>
        </div>
    );
}
