
import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import { useNavigate } from 'react-router-dom';

export default function Lobby() {
    const [rooms, setRooms] = useState([]);
    const navigate = useNavigate();
    const playerName = localStorage.getItem('truco_player_name') || 'Anon';

    useEffect(() => {
        if (!socket.connected) socket.connect();

        socket.emit('get_rooms');

        socket.on('rooms_list', (updatedRooms) => {
            setRooms(updatedRooms);
        });

        socket.on('room_created', (room) => {
            navigate(`/room/${room.id}`);
        });

        return () => {
            socket.off('rooms_list');
            socket.off('room_created');
        };
    }, [navigate]);

    const createRoom = () => {
        socket.emit('create_room', { playerName });
    };

    const joinRoom = (roomId) => {
        socket.emit('join_room', { roomId, playerName });
        navigate(`/room/${roomId}`);
    };

    return (
        <div className="page-container" style={{ justifyContent: 'flex-start', paddingTop: '80px' }}>
            <div className="w-full" style={{ maxWidth: '800px' }}>
                <div className="flex-row justify-between mb-8" style={{ alignItems: 'center' }}>
                    <h1 className="title-gradient" style={{ fontSize: '2rem', margin: 0 }}>SALAS</h1>
                    <div className="flex-row gap-4">
                        <button onClick={() => navigate('/admin')} className="btn-primary" style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', boxShadow: 'none' }}>ADMIN</button>
                        <button onClick={createRoom} className="btn-primary">NUEVA PARTIDA</button>
                    </div>
                </div>

                <div className="flex-col gap-4">
                    {rooms.length === 0 ? (
                        <div className="glass-panel text-center">
                            <p style={{ color: 'var(--text-secondary)' }}>No hay partidas activas en este momento.</p>
                        </div>
                    ) : (
                        rooms.map(room => (
                            <div key={room.id} className="glass-panel flex-row justify-between" style={{ padding: '20px', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>Mesa de {room.host}</h3>
                                    <div className="flex-row gap-2" style={{ alignItems: 'center' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: room.status === 'waiting' ? '#22c55e' : '#f59e0b' }}></div>
                                        <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                                            {room.status === 'waiting' ? 'Esperando Jugador' : 'En Juego'}
                                        </span>
                                        <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>•</span>
                                        <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{room.players}/2</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => joinRoom(room.id)}
                                    disabled={room.players >= 2}
                                    className="btn-primary"
                                    style={{
                                        padding: '10px 24px',
                                        opacity: room.players >= 2 ? 0.5 : 1,
                                        background: room.players >= 2 ? '#334155' : undefined,
                                        boxShadow: room.players >= 2 ? 'none' : undefined,
                                        cursor: room.players >= 2 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {room.players >= 2 ? 'LLENA' : 'ENTRAR'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
