
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
            <div className="glass-panel animate-card" style={{ padding: '60px 40px', width: '400px', textAlign: 'center' }}>
                <h1 className="title-premium" style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>TRUCO</h1>
                <p style={{ color: 'var(--text-dim)', marginBottom: '40px', letterSpacing: '4px', fontSize: '0.8rem' }}>URUGUAYO ELITE</p>

                <form onSubmit={handleLogin}>
                    <div style={{ position: 'relative', marginBottom: '30px' }}>
                        <input
                            type="text"
                            className="input-glass"
                            placeholder="Escribe tu alias..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            style={{ textAlign: 'center', fontSize: '1.2rem', padding: '16px' }}
                        />
                    </div>
                    <button type="submit" className="btn-luxury" style={{ width: '100%' }}>
                        ENTRAR AL CLUB
                    </button>
                </form>
            </div>
        </div>
    );
}
