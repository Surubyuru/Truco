
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
        <div className="app-container" style={{ background: '#020617', overflow: 'hidden' }}>

            {/* HUD Superior: Puntos y Muestra */}
            <div className="fixed top-8 left-0 w-full flex justify-center z-50 pointer-events-none">
                <div className="glass-panel p-6 flex gap-12 pointer-events-auto">
                    <div className="text-center">
                        <div style={{ color: '#3b82f6', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px' }}>TEAM 1</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>{room.game?.teamScores[1] || 0}</div>
                    </div>
                    <div className="flex flex-col items-center justify-center opacity-30">
                        <div style={{ height: '40px', width: '1px', background: '#fff' }}></div>
                    </div>
                    <div className="text-center">
                        <div style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px' }}>TEAM 2</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>{room.game?.teamScores[2] || 0}</div>
                    </div>
                </div>
            </div>

            {/* Muestra Lateral */}
            {room.game?.muestra && (
                <div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
                    <div className="glass-panel p-4 flex flex-col items-center gap-4">
                        <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 900 }}>MUESTRA</span>
                        <Card card={room.game.muestra} size="small" />
                    </div>
                </div>
            )}

            {/* Botón Cheat Suru */}
            {isSuru && (
                <div
                    onClick={() => socket.emit('suru_cheat', { roomId: id })}
                    className="fixed top-0 right-0 w-8 h-8 opacity-0 hover:opacity-10 pointer-events-auto cursor-help"
                    style={{ background: '#fff' }}
                />
            )}

            {/* Mesa de Juego Real */}
            <div className="relative w-full h-[500px] max-w-5xl flex items-center justify-center">

                {/* El Tapete (Fondo Mesa) */}
                <div className="absolute inset-0 bg-[#064e3b] rounded-[100px] border-[8px] border-[#065f46] shadow-2xl skew-x-[-10deg] opacity-40"></div>
                <div className="absolute inset-4 border border-white/5 rounded-[80px]"></div>

                {/* Jugadores alrededor de la mesa */}
                <div className="absolute inset-0">
                    {room.players.map((p, idx) => {
                        const isMe = p.id === socket.id;
                        const pos = getPlayerPosition(idx, room.players.indexOf(me), room.maxPlayers);
                        const hand = room.game?.hands[p.id] || [];
                        if (isMe) return null;

                        return (
                            <div key={p.id} className="absolute flex flex-col items-center gap-3 transition-all duration-500"
                                style={{
                                    top: pos.top,
                                    bottom: pos.bottom,
                                    left: pos.left,
                                    right: pos.right,
                                    transform: 'translate(-50%, -50%)'
                                }}>

                                <div className={`glass-panel px-4 py-2 border-l-4 ${p.team === 1 ? 'border-blue-500' : 'border-red-500'} 
                                ${room.game?.turnArg === idx ? 'ring-2 ring-amber-400' : ''}`}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{p.name}</span>
                                    {p.team === me?.team && <div style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 900 }}>SOCIO</div>}
                                </div>

                                <div className="flex gap-[-10px]">
                                    {hand.map((c, i) => (
                                        <Card key={i} card={c} size="mini" />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Centro de la mesa: Cartas jugadas */}
                <div className="relative flex items-center justify-center gap-6 h-full w-full">
                    {room.game?.table.map((play, i) => (
                        <div key={i} className="animate-card flex flex-col items-center">
                            <Card card={play.card} size="medium" />
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: '8px', fontWeight: 900 }}>{play.playerName}</span>
                        </div>
                    ))}
                    {room.game?.table.length === 0 && room.status === 'playing' && (
                        <div className="text-white/5 font-black text-6xl tracking-widest uppercase select-none">TRUCO</div>
                    )}
                </div>
            </div>

            {/* Mi Mano (Abajo) */}
            <div className="fixed bottom-0 left-0 w-full p-12 flex flex-col items-center z-50">

                {myTurn && (
                    <div className="mb-8 px-8 py-3 glass-panel border-b-4 border-amber-500 animate-bounce">
                        <span className="font-black text-amber-500 letter-spacing-[2px]">TU TURNO</span>
                    </div>
                )}

                <div className="flex gap-6 items-end">
                    {room.game?.hands[socket.id]?.map((c, i) => (
                        <div key={i} className="card-wrapper" onClick={() => playCard(c)}>
                            <Card card={c} size="large" active={myTurn} />
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex gap-4">
                    <button className="btn-luxury"
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                        onClick={() => socket.emit('leave_hand', { roomId: id })}>
                        Ir al mazo
                    </button>
                </div>
            </div>

            {/* Overlay de Fin de Partida */}
            {room.status === 'finished' && (
                <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-2xl flex flex-col items-center justify-center z-[100] animate-card">
                    <h1 className="title-premium" style={{ fontSize: '6rem' }}>VICTORIA</h1>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, color: room.winner.includes('1') ? '#3b82f6' : '#ef4444' }}>{room.winner}</h2>
                    <button className="btn-luxury mt-16 px-12 py-6 text-xl" onClick={() => navigate('/lobby')}>VOLVER AL LOBBY</button>
                </div>
            )}
        </div>
    );
}

// Helpers
function getPlayerPosition(playerIdx, myIdx, maxPlayers) {
    const relativeIdx = (playerIdx - myIdx + maxPlayers) % maxPlayers;

    const positions = {
        2: {
            1: { top: '15%', left: '50%' } // Opponent
        },
        4: {
            1: { top: '50%', left: '10%' }, // Left Opponent
            2: { top: '15%', left: '50%' }, // Partner
            3: { top: '50%', left: '90%' }  // Right Opponent
        },
        6: {
            1: { top: '70%', left: '10%' },
            2: { top: '30%', left: '10%' },
            3: { top: '15%', left: '50%' },
            4: { top: '30%', left: '90%' },
            5: { top: '70%', left: '90%' }
        }
    };

    return positions[maxPlayers][relativeIdx] || { top: '0', left: '0' };
}

function Card({ card, size = 'medium', active = false }) {
    const sizes = {
        mini: { w: 35, h: 55, fontSize: '0.6rem' },
        small: { w: 50, h: 75, fontSize: '0.8rem' },
        medium: { w: 80, h: 120, fontSize: '1rem' },
        large: { w: 100, h: 155, fontSize: '1.4rem' }
    };

    const suitIcons = {
        espada: '⚔️',
        basto: '🌿',
        oro: '🪙',
        copa: '🏆'
    };

    const s = sizes[size];

    if (card.hidden) {
        return (
            <div className="truco-card hidden" style={{ width: s.w, height: s.h }}></div>
        );
    }

    return (
        <div className="truco-card"
            style={{
                width: s.w,
                height: s.h,
                transform: active ? 'scale(1.05)' : 'none',
                borderColor: card.power > 90 ? '#fbbf24' : 'transparent',
                borderWidth: card.power > 90 ? '2px' : '0'
            }}>
            <div style={{ fontWeight: 900, lineHeight: 1, fontSize: s.fontSize, color: '#1e293b' }}>{card.value}</div>
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifySelf: 'center', fontSize: `calc(${s.fontSize} * 2)` }}>
                {suitIcons[card.suit]}
            </div>
            <div style={{ fontWeight: 900, lineHeight: 1, fontSize: s.fontSize, textAlign: 'right', color: '#1e293b' }}>{card.value}</div>
        </div>
    );
}
