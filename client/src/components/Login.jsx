
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [name, setName] = useState(localStorage.getItem('playerName') || '');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        localStorage.setItem('playerName', name);
        navigate('/lobby');
    };

    return (
        <div className="app-container">
            <div className="glass-panel animate-fade-in" style={{ padding: '40px', width: '350px', textAlign: 'center' }}>
                <h1 className="title-gradient">TRUCO</h1>
                <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>URUGUAYO ONLINE</p>

                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        className="input-glass"
                        placeholder="Tu nombre..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className="btn-primary" style={{ marginTop: '20px', width: '100%' }}>
                        ENTRAR
                    </button>
                </form>
            </div>
        </div>
    );
}
