
import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
    const [rooms, setRooms] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket.connected) socket.connect();
        socket.emit('get_rooms');
        socket.on('rooms_list', setRooms);
        return () => socket.off('rooms_list');
    }, []);

    return (
        <div className="page-container" style={{ justifyContent: 'flex-start', paddingTop: '80px' }}>
            <div className="w-full" style={{ maxWidth: '800px' }}>
                <div className="flex-row justify-between mb-8" style={{ alignItems: 'center' }}>
                    <h1 className="title-gradient" style={{ fontSize: '2rem', margin: 0 }}>ADMINISTRACIÓN</h1>
                    <button onClick={() => navigate('/lobby')} className="btn-primary" style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', boxShadow: 'none' }}>VOLVER</button>
                </div>
                <div className="glass-panel">
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#f8fafc' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155' }}>
                                <th style={{ padding: 12, textAlign: 'left', color: '#94a3b8', fontSize: '0.9rem' }}>ID</th>
                                <th style={{ padding: 12, textAlign: 'left', color: '#94a3b8', fontSize: '0.9rem' }}>HOST</th>
                                <th style={{ padding: 12, textAlign: 'left', color: '#94a3b8', fontSize: '0.9rem' }}>ESTADO</th>
                                <th style={{ padding: 12, textAlign: 'right', color: '#94a3b8', fontSize: '0.9rem' }}>JUGADORES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rooms.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No hay salas activas</td>
                                </tr>
                            ) : (
                                rooms.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: 12, fontFamily: 'monospace' }}>{r.id}</td>
                                        <td style={{ padding: 12 }}>{r.host}</td>
                                        <td style={{ padding: 12 }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                background: r.status === 'waiting' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                color: r.status === 'waiting' ? '#4ade80' : '#fbbf24',
                                                fontSize: '0.8rem'
                                            }}>
                                                {r.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: 12, textAlign: 'right' }}>{r.players}/{r.maxPlayers || 2}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
