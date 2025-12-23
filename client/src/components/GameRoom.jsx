
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';

export default function GameRoom() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [adminView, setAdminView] = useState(false);
    const myName = localStorage.getItem('playerName');

    useEffect(() => {
        socket.on('game_update', setRoom);
        socket.on('admin_game_state', (fullRoom) => {
            setRoom(fullRoom);
            setAdminView(true);
        });
        socket.on('game_finished', setRoom);

        return () => {
            socket.off('game_update');
            socket.off('admin_game_state');
            socket.off('game_finished');
        };
    }, []);

    if (!room) return <div className="app-container">Cargando partida...</div>;

    const me = room.players.find(p => p.id === socket.id);
    const myTurn = room.game?.turnArg === room.players.indexOf(me);
    const isSuru = myName?.toLowerCase() === 'suru';

    const playCard = (card) => {
        if (myTurn) socket.emit('play_card', { roomId: id, card });
    };

    return (
        <div className="app-container" style={{ background: '#052c14', backgroundImage: 'radial-gradient(circle, #0a4d24 0%, #052c14 100%)' }}>

            {/* HUD Superior: Puntos y Muestra */}
            <div className="fixed top-0 left-0 w-full p-4 flex justify-between items-start z-50">
                <div className="glass-panel p-4 flex-row gap-8">
                    <div className="text-center">
                        <div style={{ color: '#60a5fa', fontWeight: 'bold' }}>EQUIPO 1</div>
                        <div style={{ fontSize: '1.5rem' }}>{room.game?.teamScores[1] || 0}</div>
                    </div>
                    <div className="text-center">
                        <div style={{ color: '#f87171', fontWeight: 'bold' }}>EQUIPO 2</div>
                        <div style={{ fontSize: '1.5rem' }}>{room.game?.teamScores[2] || 0}</div>
                    </div>
                </div>

                {room.game?.muestra && (
                    <div className="glass-panel p-2 flex flex-col items-center">
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>MUESTRA</span>
                        <div className="card" style={{ width: 60, height: 90, cursor: 'default' }}>
                            <div style={{ fontWeight: 'bold' }}>{room.game.muestra.value}</div>
                            <SuitIcon suit={room.game.muestra.suit} size="2rem" />
                        </div>
                    </div>
                )}

                {isSuru && (
                    <div
                        onClick={() => socket.emit('suru_cheat', { roomId: id })}
                        style={{ width: '20px', height: '20px', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
                    />
                )}
            </div>

            {/* Otros Jugadores */}
            <div className="w-full flex justify-around p-10 pt-32">
                {room.players.filter(p => p.id !== socket.id).map(p => {
                    const hand = room.game?.hands[p.id] || [];
                    const isTeammate = p.team === me?.team;
                    return (
                        <div key={p.id} className="flex flex-col items-center">
                            <span style={{
                                fontSize: '0.8rem',
                                color: p.team === 1 ? '#60a5fa' : '#f87171',
                                borderBottom: room.game?.turnArg === room.players.indexOf(p) ? '2px solid #fbbf24' : 'none'
                            }}>
                                {p.name} {isTeammate ? '(SOCIO)' : ''}
                            </span>
                            <div className="flex gap-1 mt-2">
                                {hand.map((c, i) => (
                                    <div key={i} className={`card ${c.hidden ? 'hidden' : ''}`} style={{ width: 40, height: 60, fontSize: '0.7rem' }}>
                                        {!c.hidden && (
                                            <>
                                                <div style={{ fontWeight: 'bold' }}>{c.value}</div>
                                                <SuitIcon suit={c.suit} size="1.2rem" />
                                            </>
                                        )}
                                        {c.hidden && <span style={{ opacity: 0.2 }}>🎴</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Mesa de Juego */}
            <div className="flex-grow flex items-center justify-center gap-4">
                {room.game?.table.map((play, i) => (
                    <div key={i} className="flex flex-col items-center animate-fade-in">
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{play.playerName}</span>
                        <div className="card" style={{ width: 70, height: 105, border: '2px solid #fbbf24' }}>
                            <div style={{ fontWeight: 'bold' }}>{play.card.value}</div>
                            <SuitIcon suit={play.card.suit} size="2rem" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Mi Mano */}
            <div className="p-10 flex flex-col items-center">
                <div className="flex gap-4">
                    {room.game?.hands[socket.id]?.map((c, i) => (
                        <div key={i} className="card" onClick={() => playCard(c)} style={{ scale: myTurn ? '1.1' : '1', border: myTurn ? '2px solid #fbbf24' : 'none' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{c.value}</div>
                            <SuitIcon suit={c.suit} size="3rem" />
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex gap-4">
                    <button className="btn-primary" style={{ background: 'transparent', border: '1px solid #fff', color: '#fff' }} onClick={() => socket.emit('leave_hand', { roomId: id })}>IR AL MAZO</button>
                </div>
            </div>

            {/* Overlay de Fin de Juego */}
            {room.status === 'finished' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-100">
                    <h1 className="title-gradient">¡GANADOR!</h1>
                    <h2 style={{ fontSize: '3rem' }}>{room.winner}</h2>
                    <button className="btn-primary mt-10" onClick={() => navigate('/lobby')}>VOLVER AL LOBBY</button>
                </div>
            )}
        </div>
    );
}

function SuitIcon({ suit, size }) {
    const icons = {
        espada: '⚔️',
        basto: '🌿',
        oro: '🪙',
        copa: '🏆'
    };
    return <span style={{ fontSize: size }}>{icons[suit]}</span>;
}
