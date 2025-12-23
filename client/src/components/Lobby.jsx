
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
        <div className="app-container" style={{ justifyContent: 'flex-start', padding: '60px 20px' }}>
            <div className="w-full max-w-4xl">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="title-gradient" style={{ fontSize: '2.5rem' }}>LOBBY</h1>
                        <p style={{ color: 'var(--text-dim)' }}>Bienvenido, {name}</p>
                    </div>

                    <div className="glass-panel flex-row gap-4 p-6 items-center">
                        <select
                            className="input-glass"
                            style={{ width: '140px' }}
                            value={maxPlayers}
                            onChange={(e) => setMaxPlayers(e.target.value)}
                        >
                            <option value={2}>2 Jugadores</option>
                            <option value={4}>4 Jugadores</option>
                            <option value={6}>6 Jugadores</option>
                        </select>
                        <button className="btn-primary" onClick={createRoom}>NUEVA SALA</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rooms.map(room => (
                        <div key={room.id} className="glass-panel p-6 flex justify-between items-center">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Sala de {room.host}</h3>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{room.players}/{room.maxPlayers} Jugadores</p>
                            </div>
                            <button
                                className="btn-primary"
                                disabled={room.players >= room.maxPlayers || room.status !== 'waiting'}
                                onClick={() => joinRoom(room.id)}
                            >
                                {room.status === 'playing' ? 'EN JUEGO' : 'ENTRAR'}
                            </button>
                        </div>
                    ))}
                    {rooms.length === 0 && (
                        <div className="col-span-2 text-center py-20" style={{ color: 'var(--text-dim)' }}>
                            No hay salas activas. ¡Crea una para empezar!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
