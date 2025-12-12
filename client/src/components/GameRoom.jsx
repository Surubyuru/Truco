
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { motion, AnimatePresence } from 'framer-motion';

// Mock UI por ahora
export default function GameRoom() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [myHand, setMyHand] = useState([]);
    const [muestra, setMuestra] = useState(null);
    const [gameStatus, setGameStatus] = useState('waiting'); // waiting, playing, showing_points

    useEffect(() => {
        if (!socket.connected) socket.connect();

        // Escuchar eventos de PARTIDA
        socket.on('player_joined', (updatedRoom) => {
            if (updatedRoom.id === id) setRoom(updatedRoom);
        });

        socket.on('room_ready', (updatedRoom) => {
            // El host debería ver un botón "Iniciar" o auto-iniciar
            setRoom(updatedRoom);
        });


        socket.on('game_started', (updatedRoom) => {
            setRoom(updatedRoom);
            setGameStatus('playing');
            updateGameState(updatedRoom);
        });

        socket.on('game_update', (updatedRoom) => {
            setRoom(updatedRoom);
            updateGameState(updatedRoom);
        });



        socket.on('game_finished', (finishedRoom) => {
            setRoom(finishedRoom);
            setGameStatus('finished');
        });

        // Simular obtener estado inicial si entramos tarde
        socket.emit('get_room_state', id);

        return () => {
            socket.off('player_joined');
            socket.off('room_ready');
            socket.off('game_started');
            socket.off('game_update');
            socket.off('room_state');
            socket.off('game_finished');
        }
    }, [id]);

    // Listener para recibir el estado inicial bajo demanda
    useEffect(() => {
        socket.on('room_state', (roomState) => {
            if (roomState) {
                setRoom(roomState);
                if (roomState.status === 'playing') {
                    setGameStatus('playing');
                    updateGameState(roomState);
                }
            } else {
                // Sala no existe o error, volver a lobby
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
        }
    };

    const startGame = () => {
        socket.emit('start_game', { roomId: id });
    };

    const handleCardDragEnd = (event, info, card) => {
        // Si se soltó arriba (y < -100 aprox)
        if (info.offset.y < -100) {
            socket.emit('play_card', { roomId: id, card });
        }
    };

    // Helper para saber si es mi turno
    const isMyTurn = () => {
        if (!room || !room.game) return false;
        const myIdx = room.players.findIndex(p => p.id === socket.id);
        return room.game.turnArg === myIdx;
    };

    if (!room) return <div className="page-container flex-center"><h1>Cargando Sala...</h1></div>;

    return (
        <div className="page-container" style={{ background: '#0f172a' }}>
            {/* Header / Puntaje */}
            <div className="fixed top-0 left-0 w-full p-4 flex-row justify-between items-center glass-panel" style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid #334155' }}>
                <div className="flex-col">
                    <span className="text-secondary text-sm">SALA: {id}</span>
                    <span className="text-white font-bold">{room.players[0]?.name || 'P1'} vs {room.players[1]?.name || 'P2'}</span>
                </div>
                <div className="glass-panel" style={{ padding: '8px 16px', background: isMyTurn() ? 'rgba(251, 191, 36, 0.2)' : undefined, border: isMyTurn() ? '1px solid #fbbf24' : '1px solid transparent' }}>
                    <span style={{ color: isMyTurn() ? '#fbbf24' : '#fff', fontWeight: 'bold' }}>
                        {isMyTurn() ? 'TU TURNO' : 'ESPERANDO...'}
                    </span>
                </div>
                <div className="glass-panel" style={{ padding: '8px 16px' }}>
                    <span className="text-accent font-bold text-xl">{room.game?.score ? `${room.game.score[room.players[0].id]} - ${room.game.score[room.players[1].id]}` : '0 - 0'}</span>
                </div>
            </div>

            {/* Waiting State */}
            {gameStatus === 'waiting' && (
                <div className="flex-col gap-8 items-center">
                    <h2 className="title-gradient">Esperando Jugadores...</h2>
                    <div className="flex-row gap-4">
                        {room.players.map(p => (
                            <div key={p.id} className="glass-panel text-center" style={{ width: 150 }}>
                                <div className="mb-2" style={{ fontSize: '2rem' }}>👤</div>
                                <div>{p.name}</div>
                            </div>
                        ))}
                        {room.players.length < 2 && (
                            <div className="glass-panel text-center" style={{ width: 150, opacity: 0.5 }}>
                                <div className="mb-2" style={{ fontSize: '2rem' }}>⏳</div>
                                <div>Esperando...</div>
                            </div>
                        )}
                    </div>
                    {room.players.length === 2 && (
                        <button onClick={startGame} className="btn-primary pulse">INICIAR PARTIDA</button>
                    )}
                </div>
            )}

            {/* Game State */}
            {gameStatus === 'playing' && (
                <div className="w-full h-full flex-col justify-between" style={{ padding: '80px 0 20px 0', height: '100vh', boxSizing: 'border-box' }}>

                    {/* Mesa (Cartas jugadas) */}
                    <div className="flex-center flex-grow relative" style={{ minHeight: '300px' }}>

                        {/* Muestra (A la izquierda, vertical) */}
                        {muestra && (
                            <div className="absolute left-8 playing-card" style={{ transform: 'scale(0.9)', opacity: 1, border: '2px solid #fbbf24', boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)' }}>
                                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>MUESTRA</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{muestra.value}</div>
                                <div style={{ fontSize: '2.5rem', textAlign: 'center' }}>
                                    {muestra.suit === 'espada' ? '⚔️' : muestra.suit === 'basto' ? '🌿' : muestra.suit === 'oro' ? '🪙' : '🏆'}
                                </div>
                            </div>
                        )}

                        {/* Cartas jugadas */}
                        <div className="flex-center gap-4">
                            {room.game.table.map((play, i) => (
                                <div key={i} className="playing-card" style={{ transform: `rotate(${Math.random() * 10 - 5}deg)` }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{play.card.value}</div>
                                    <div style={{ fontSize: '2.5rem', textAlign: 'center' }}>
                                        {play.card.suit === 'espada' ? '⚔️' : play.card.suit === 'basto' ? '🌿' : play.card.suit === 'oro' ? '🪙' : '🏆'}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', textAlign: 'center', color: '#94a3b8' }}>{play.playerName}</div>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* Mi Mano */}
                    <div className="flex-center gap-4 relative" style={{ height: '180px' }}>
                        {myHand.map((card, i) => (
                            <motion.div
                                key={card.id || i}
                                className="playing-card"
                                initial={{ y: 200, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                drag={isMyTurn()} // Solo arrastrable si es mi turno
                                dragSnapToOrigin={true} // Vuelve si no se juega
                                whileHover={{ y: -20, scale: 1.05, zIndex: 100 }}
                                onDragEnd={(e, info) => handleCardDragEnd(e, info, card)}
                                style={{ cursor: isMyTurn() ? 'grab' : 'not-allowed', filter: isMyTurn() ? 'none' : 'grayscale(0.5)' }}
                            >
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{card.value}</div>
                                <div style={{ fontSize: '2.5rem', textAlign: 'center' }}>
                                    {card.suit === 'espada' ? '⚔️' : card.suit === 'basto' ? '🌿' : card.suit === 'oro' ? '🪙' : '🏆'}
                                </div>
                                <div style={{ fontSize: '1rem', textAlign: 'right', opacity: 0.5 }}>{card.suit[0].toUpperCase()}</div>
                            </motion.div>
                        ))}
                    </div>

                </div>
            )}

            {/* Challenge Modal/Overlay */}
            {room.game && room.game.challenge && room.game.challenge.to === socket.id && (
                <div className="fixed inset-0 z-50 flex-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
                    <div className="glass-panel text-center" style={{ minWidth: 300, border: '2px solid #fbbf24' }}>
                        <h3 className="title-gradient mb-4" style={{ fontSize: '1.5rem' }}>
                            ¡{room.players.find(p => p.id === room.game.challenge.from)?.name} CANTÓ {room.game.challenge.type.replace('_', ' ').toUpperCase()}!
                        </h3>
                        <div className="flex-col gap-4">
                            <button onClick={() => socket.emit('respond_call', { roomId: id, response: 'quiero' })} className="btn-primary" style={{ background: '#22c55e' }}>QUIERO</button>
                            <button onClick={() => socket.emit('respond_call', { roomId: id, response: 'no_quiero' })} className="btn-primary" style={{ background: '#ef4444' }}>NO QUIERO</button>

                            {/* Lógica de Contra-Canto (Simplificada) */}
                            {room.game.challenge.type === 'envido' && (
                                <>
                                    <button onClick={() => socket.emit('make_call', { roomId: id, callType: 'real_envido' })} className="btn-primary">REAL ENVIDO</button>
                                    <button onClick={() => socket.emit('make_call', { roomId: id, callType: 'falta_envido' })} className="btn-primary">FALTA ENVIDO</button>
                                </>
                            )}
                            {room.game.challenge.type === 'truco' && (
                                <button onClick={() => socket.emit('make_call', { roomId: id, callType: 'retruco' })} className="btn-primary">QUIERO RETRUCO</button>
                            )}
                            {room.game.challenge.type === 'retruco' && (
                                <button onClick={() => socket.emit('make_call', { roomId: id, callType: 'vale4' })} className="btn-primary">QUIERO VALE CUATRO</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Actions Bar */}
            {isMyTurn() && !room.game.challenge && gameStatus === 'playing' && (
                <div className="fixed bottom-0 left-0 w-full p-4 glass-panel flex-center gap-4" style={{ borderRadius: 0, border: 'none', borderTop: '1px solid #334155', background: 'rgba(15, 23, 42, 0.9)' }}>
                    {/* Truco Logic */}
                    {room.game.trucoLevel === 0 && (
                        <button onClick={() => socket.emit('make_call', { roomId: id, callType: 'truco' })} className="btn-primary" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>TRUCO</button>
                    )}
                    {room.game.trucoLevel === 1 && false /* Solo contestando se puede subir? En uruguayo el que tiene el "quiero" puede subir? Por simplicidad, solo respuesta en modal por ahora */}

                    {/* Envido Logic (Solo ronda 1 y si no se cantó) */}
                    {room.game.round === 1 && !room.game.envidoPlayed && (
                        <>
                            <button onClick={() => socket.emit('make_call', { roomId: id, callType: 'envido' })} className="btn-primary" style={{ fontSize: '0.9rem', padding: '8px 16px', background: 'transparent', border: '1px solid #94a3b8' }}>ENVIDO</button>
                            <button onClick={() => socket.emit('make_call', { roomId: id, callType: 'real_envido' })} className="btn-primary" style={{ fontSize: '0.9rem', padding: '8px 16px', background: 'transparent', border: '1px solid #94a3b8' }}>REAL ENVIDO</button>
                            <button onClick={() => socket.emit('make_call', { roomId: id, callType: 'falta_envido' })} className="btn-primary" style={{ fontSize: '0.9rem', padding: '8px 16px', background: 'transparent', border: '1px solid #94a3b8' }}>FALTA ENVIDO</button>
                        </>
                    )}

                    {/* Flor Logic */}
                    {room.game.round === 1 && !room.game.florPlayed && (
                        <button onClick={() => socket.emit('make_call', { roomId: id, callType: 'flor' })} className="btn-primary" style={{ fontSize: '0.9rem', padding: '8px 16px', background: '#d946ef' }}>FLOR</button>
                    )}

                    <button className="btn-primary" style={{ fontSize: '0.9rem', padding: '8px 16px', background: '#64748b' }} onClick={() => socket.emit('leave_room', { roomId: id })}>IRSE AL MAZO</button>
                </div>
            )}

            {/* Game Over Overlay */}
            {gameStatus === 'finished' && (
                <div className="fixed inset-0 z-50 flex-center flex-col" style={{ background: 'rgba(0,0,0,0.95)' }}>
                    <h1 className="title-large title-gradient mb-8">FIN DE PARTIDA</h1>
                    <div className="flex-row gap-8 text-center">
                        <div className="flex-col">
                            <span className="subtitle" style={{ color: room.winner === room.players[0].name ? '#fbbf24' : '#fff' }}>
                                {room.players[0].name}
                            </span>
                            <span style={{ fontSize: '4rem', fontWeight: 'bold' }}>{room.game.score[room.players[0].id]}</span>
                        </div>
                        <div className="flex-col">
                            <span className="subtitle" style={{ color: room.winner === room.players[1].name ? '#fbbf24' : '#fff' }}>
                                {room.players[1].name}
                            </span>
                            <span style={{ fontSize: '4rem', fontWeight: 'bold' }}>{room.game.score[room.players[1].id]}</span>
                        </div>
                    </div>
                    <div className="mt-8">
                        <span style={{ fontSize: '2rem', color: '#22c55e' }}>GANADOR: {room.winner}</span>
                    </div>
                    <button onClick={() => navigate('/lobby')} className="btn-primary mt-8">VOLVER AL LOBBY</button>
                </div>
            )}
        </div>
    );


}
