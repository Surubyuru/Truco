
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

export default function Lobby() {
    const [rooms, setRooms] = useState([]);
    const [maxPlayers, setMaxPlayers] = useState(2);
    const name = localStorage.getItem('playerName');
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket.connected) socket.connect();
        socket.emit('get_rooms');
        socket.on('rooms_list', setRooms);
        socket.on('room_created', (id) => navigate(`/room/${id}`));
        return () => {
            socket.off('rooms_list');
            socket.off('room_created');
        };
    }, [navigate]);

    const createRoom = () => {
        socket.emit('create_room', { hostName: name, maxPlayers });
    };

    const joinRoom = (id) => {
        socket.emit('join_room', { roomId: id, playerName: name });
        navigate(`/room/${id}`);
    };

    return (
        <div className="app-container" style={{ justifyContent: 'flex-start', padding: '80px 40px' }}>
            <div className="w-full max-w-6xl">
                <div className="flex justify-between items-end mb-16 px-4">
                    <div>
                        <h1 className="title-premium" style={{ fontSize: '3.5rem' }}>LOBBY</h1>
                        <p style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                            Bienvenido, <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{name}</span>
                        </p>
                    </div>

                    <div className="glass-panel p-6 flex items-center gap-6">
                        <div className="flex flex-col">
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '8px' }}>TAMAÑO MESA</label>
                            <select
                                className="input-glass"
                                style={{ width: '160px', cursor: 'pointer' }}
                                value={maxPlayers}
                                onChange={(e) => setMaxPlayers(e.target.value)}
                            >
                                <option value={2}>MESA PARA 2</option>
                                <option value={4}>MESA PARA 4</option>
                                <option value={6}>MESA PARA 6</option>
                            </select>
                        </div>
                        <button className="btn-luxury" style={{ height: 'fit-content', alignSelf: 'flex-end' }} onClick={createRoom}>CREAR MESA</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {rooms.map(room => (
                        <div key={room.id} className="glass-panel p-8 flex flex-col gap-6 hover:border-primary transition-all group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Mesa #{room.id}</h3>
                                    <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '4px' }}>Host: {room.host}</p>
                                </div>
                                <div className="glass-panel px-3 py-1" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {room.players}/{room.maxPlayers}
                                </div>
                            </div>

                            <button
                                className="btn-luxury"
                                style={{ width: '100%', fontSize: '0.9rem' }}
                                disabled={room.players >= room.maxPlayers || room.status !== 'waiting'}
                                onClick={() => joinRoom(room.id)}
                            >
                                {room.status === 'playing' ? 'MESA LLENA' : 'UNIRSE'}
                            </button>
                        </div>
                    ))}
                    {rooms.length === 0 && (
                        <div className="col-span-full glass-panel p-20 text-center" style={{ color: 'var(--text-dim)', borderStyle: 'dashed' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🃏</div>
                            No hay mesas activas. Crea una para invitar a tus amigos.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

