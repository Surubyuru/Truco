
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { motion, AnimatePresence } from 'framer-motion';

// Mock UI por ahora
export default function GameRoom() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [adminView, setAdminView] = useState(false);
    const [teamHands, setTeamHands] = useState({});

    useEffect(() => {
        if (!socket.connected) socket.connect();

        socket.on('player_joined', (updatedRoom) => {
            if (updatedRoom.id === id) setRoom(updatedRoom);
        });

        socket.on('room_ready', (updatedRoom) => {
            setRoom(updatedRoom);
        });

        socket.on('game_update', (updatedRoom) => {
            setRoom(updatedRoom);
            updateGameState(updatedRoom);
        });

        socket.on('admin_game_state', (adminRoom) => {
            setRoom(adminRoom);
            setAdminView(true);
        });

        socket.on('game_finished', (finishedRoom) => {
            setRoom(finishedRoom);
            setGameStatus('finished');
        });

        socket.emit('get_room_state', id);

        return () => {
            socket.off('player_joined');
            socket.off('room_ready');
            socket.off('game_update');
            socket.off('room_state');
            socket.off('game_finished');
            socket.off('admin_game_state');
        }
    }, [id]);

    useEffect(() => {
        socket.on('room_state', (roomState) => {
            if (roomState) {
                setRoom(roomState);
                if (roomState.status === 'playing') {
                    setGameStatus('playing');
                    updateGameState(roomState);
                }
            } else {
                alert("La sala no existe.");
                navigate('/lobby');
            }
        });
        return () => socket.off('room_state');
    }, [navigate]);


    const updateGameState = (updatedRoom) => {
        const myId = socket.id;
        if (updatedRoom.game) {
            if (updatedRoom.game.hands[myId]) {
                setMyHand(updatedRoom.game.hands[myId]);
            }
            setMuestra(updatedRoom.game.muestra);
            setTeamHands(updatedRoom.game.hands);
        }
    };

    const startGame = () => {
        socket.emit('start_game', { roomId: id });
    };

    const handleCardDragEnd = (event, info, card) => {
        if (info.offset.y < -100) {
            socket.emit('play_card', { roomId: id, card });
        }
    };

    const isMyTurn = () => {
        if (!room || !room.game) return false;
        const myIdx = room.players.findIndex(p => p.id === socket.id);
        return room.game.turnArg === myIdx;
    };

    const isSuru = localStorage.getItem('truco_player_name')?.toLowerCase() === 'suru';

    if (!room) return <div className="page-container flex-center"><h1>Cargando Sala...</h1></div>;

    const myPlayer = room.players.find(p => p.id === socket.id);
    const myTeam = myPlayer?.team;

    return (
        <div className="page-container" style={{ background: '#0f172a' }}>
            {/* Cheat Button (Almost Invisible) */}
            {isSuru && (
                <div
                    onClick={() => socket.emit('suru_cheat', { roomId: id })}
                    style={{ position: 'fixed', top: 5, right: 5, width: 20, height: 20, opacity: 0.05, cursor: 'pointer', zIndex: 1000, background: 'white' }}
                ></div>
            )}

            {/* Header / Puntaje */}
            <div className="fixed top-0 left-0 w-full p-4 flex-row justify-between items-center glass-panel" style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid #334155', zIndex: 100 }}>
                <div className="flex-col">
                    <span className="text-secondary text-sm">SALA: {id}</span>
                    <span className="text-white font-bold">
                        {room.maxPlayers === 2 ? `${room.players[0]?.name} vs ${room.players[1]?.name}` : `Equipos de ${room.maxPlayers / 2}`}
                    </span>
                </div>
                <div className="glass-panel" style={{ padding: '8px 16px', background: isMyTurn() ? 'rgba(251, 191, 36, 0.2)' : undefined, border: isMyTurn() ? '1px solid #fbbf24' : '1px solid transparent' }}>
                    <span style={{ color: isMyTurn() ? '#fbbf24' : '#fff', fontWeight: 'bold' }}>
                        {isMyTurn() ? 'TU TURNO' : 'ESPERANDO...'}
                    </span>
                </div>
                <div className="flex-row gap-4">
                    <div className="glass-panel" style={{ padding: '4px 12px', border: myTeam === 1 ? '1px solid #60a5fa' : 'none' }}>
                        <span className="text-secondary text-xs block">EQ 1</span>
                        <span className="text-white font-bold">{room.game?.teamScores ? room.game.teamScores[1] : 0}</span>
                    </div>
                    <div className="glass-panel" style={{ padding: '4px 12px', border: myTeam === 2 ? '1px solid #60a5fa' : 'none' }}>
                        <span className="text-secondary text-xs block">EQ 2</span>
                        <span className="text-white font-bold">{room.game?.teamScores ? room.game.teamScores[2] : 0}</span>
                    </div>
                </div>
            </div>

            {/* Waiting State */}
            {gameStatus === 'waiting' && (
                <div className="flex-col gap-8 items-center" style={{ marginTop: 80 }}>
                    <h2 className="title-gradient">Esperando Jugadores ({room.players.length}/{room.maxPlayers})</h2>
                    <div className="flex-row flex-wrap justify-center gap-4" style={{ maxWidth: 600 }}>
                        {room.players.map(p => (
                            <div key={p.id} className="glass-panel text-center" style={{ width: 120 }}>
                                <div className="mb-2" style={{ fontSize: '1.5rem' }}>👤</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{p.name}</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Team {(room.players.indexOf(p) % 2) + 1}</div>
                            </div>
                        ))}
                        {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
                            <div key={i} className="glass-panel text-center" style={{ width: 120, opacity: 0.3 }}>
                                <div className="mb-2" style={{ fontSize: '1.5rem' }}>⏳</div>
                                <div style={{ fontSize: '0.8rem' }}>Libre</div>
                            </div>
                        ))}
                    </div>
                    {room.players.length === room.maxPlayers && room.players[0].id === socket.id && (
                        <button onClick={startGame} className="btn-primary pulse">INICIAR PARTIDA</button>
                    )}
                </div>
            )}

            {/* Game State */}
            {gameStatus === 'playing' && (
                <div className="w-full h-full flex-col justify-between" style={{ padding: '80px 0 20px 0', height: '100vh', boxSizing: 'border-box' }}>

                    {/* Otros jugadores (Visualización compacta para 4 o 6) */}
                    <div className="flex-row justify-around w-full px-8 py-4 glass-panel" style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: 0, border: 'none', borderBottom: '1px solid #334155' }}>
                        {room.players.filter(p => p.id !== socket.id).map(p => {
                            const pHand = teamHands[p.id] || [];
                            const isTeammate = p.team === myTeam;
                            const isCurrentTurn = p.id === room.players[room.game.turnArg]?.id;

                            return (
                                <div key={p.id} className="flex-col items-center" style={{ scale: isCurrentTurn ? '1.1' : '1', transition: 'all 0.3s ease' }}>
                                    <div className="text-xs mb-1 font-bold" style={{ color: p.team === 1 ? '#60a5fa' : '#f87171', textShadow: isCurrentTurn ? '0 0 10px currentColor' : 'none' }}>
                                        {p.name} {isTeammate ? '(Socio)' : ''}
                                    </div>
                                    <div className="flex-row gap-1">
                                        {pHand.map((c, ci) => (
                                            <div
                                                key={ci}
                                                className="glass-panel"
                                                style={{
                                                    width: 35, height: 50, fontSize: '0.6rem',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    border: isCurrentTurn ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                                                    background: c.hidden ? '#1e293b' : 'white',
                                                    color: c.hidden ? 'white' : '#1e1e24',
                                                    borderRadius: '4px',
                                                    padding: '2px'
                                                }}
                                            >
                                                {!c.hidden && (
                                                    <>
                                                        <div style={{ fontWeight: 'bold' }}>{c.value}</div>
                                                        <div style={{ fontSize: '1rem' }}>{c.suit === 'espada' ? '⚔️' : c.suit === 'basto' ? '🌿' : c.suit === 'oro' ? '🪙' : '🏆'}</div>
                                                    </>
                                                )}
                                                {c.hidden && <span style={{ opacity: 0.3 }}>🎴</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mesa (Cartas jugadas) */}
                    <div className="flex-center flex-grow relative" style={{ minHeight: '200px' }}>
                        {muestra && (
                            <div className="absolute left-8 playing-card" style={{ transform: 'scale(0.7)', opacity: 0.8, border: '2px solid #fbbf24' }}>
                                <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#64748b' }}>MUESTRA</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{muestra.value}</div>
                                <div style={{ fontSize: '2rem', textAlign: 'center' }}>
                                    {muestra.suit === 'espada' ? '⚔️' : muestra.suit === 'basto' ? '🌿' : muestra.suit === 'oro' ? '🪙' : '🏆'}
                                </div>
                            </div>
                        )}

                        <div className="flex-wrap justify-center gap-4 flex-row" style={{ maxWidth: '400px' }}>
                            {room.game.table.map((play, i) => (
                                <div key={i} className="playing-card" style={{ transform: `rotate(${Math.random() * 20 - 10}deg)`, width: 80, height: 120 }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{play.card.value}</div>
                                    <div style={{ fontSize: '2rem', textAlign: 'center' }}>
                                        {play.card.suit === 'espada' ? '⚔️' : play.card.suit === 'basto' ? '🌿' : play.card.suit === 'oro' ? '🪙' : '🏆'}
                                    </div>
                                    <div style={{ fontSize: '0.6rem', textAlign: 'center', color: '#94a3b8' }}>{play.playerName}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mi Mano */}
                    <div className="flex-row justify-center items-end relative" style={{ height: '180px', paddingBottom: 20 }}>
                        <div className="flex-row gap-4">
                            {myHand.map((card, i) => (
                                <motion.div
                                    key={card.id || i}
                                    className="playing-card"
                                    initial={{ y: 200, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    drag={isMyTurn()}
                                    dragSnapToOrigin={true}
                                    whileHover={{ y: -40, scale: 1.1, zIndex: 50 }}
                                    onDragEnd={(e, info) => handleCardDragEnd(e, info, card)}
                                    style={{ cursor: isMyTurn() ? 'grab' : 'not-allowed', width: 100, height: 150 }}
                                >
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{card.value}</div>
                                    <div style={{ fontSize: '2.5rem', textAlign: 'center' }}>
                                        {card.suit === 'espada' ? '⚔️' : card.suit === 'basto' ? '🌿' : card.suit === 'oro' ? '🪙' : '🏆'}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', textAlign: 'right', opacity: 0.5 }}>{card.suit[0].toUpperCase()}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

            {/* Actions Bar & Challenges (Siguen similares pero con team logic) */}
            {/* ... Modal logic ... */}
            {room.game && room.game.challenge && room.game.challenge.to === socket.id && (
                <div className="fixed inset-0 z-50 flex-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
                    <div className="glass-panel text-center" style={{ minWidth: 300, border: '2px solid #fbbf24' }}>
                        <h3 className="title-gradient mb-4">
                            ¡PULSO DE TRUCO! {room.game.challenge.type.toUpperCase()}
                        </h3>
                        <div className="flex-col gap-4">
                            <button onClick={() => socket.emit('respond_call', { roomId: id, response: 'quiero' })} className="btn-primary" style={{ background: '#22c55e' }}>QUIERO</button>
                            <button onClick={() => socket.emit('respond_call', { roomId: id, response: 'no_quiero' })} className="btn-primary" style={{ background: '#ef4444' }}>NO QUIERO</button>
                        </div>
                    </div>
                </div>
            )}

            {isMyTurn() && !room.game.challenge && gameStatus === 'playing' && (
                <div className="fixed bottom-4 right-4 flex-col gap-2">
                    <button onClick={() => socket.emit('make_call', { roomId: id, callType: 'truco' })} className="btn-primary" style={{ padding: '10px 20px' }}>TRUCO</button>
                    {room.game.round === 1 && !room.game.envidoPlayed && (
                        <button onClick={() => socket.emit('make_call', { roomId: id, callType: 'envido' })} className="btn-primary" style={{ padding: '10px 20px', background: '#334155' }}>ENVIDO</button>
                    )}
                    <button onClick={() => socket.emit('leave_hand', { roomId: id })} className="btn-primary" style={{ padding: '10px 20px', background: '#64748b' }}>AL MAZO</button>
                </div>
            )}

            {gameStatus === 'finished' && (
                <div className="fixed inset-0 z-50 flex-center flex-col" style={{ background: 'rgba(0,0,0,0.95)' }}>
                    <h1 className="title-large title-gradient mb-8">¡PARTIDA TERMINADA!</h1>
                    <div className="text-white text-3xl mb-8">GANADOR: {room.winner}</div>
                    <button onClick={() => navigate('/lobby')} className="btn-primary">VOLVER AL LOBBY</button>
                </div>
            )}
        </div>
    );
}
