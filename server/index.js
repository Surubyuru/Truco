import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { createDeck, shuffleDeck, dealHands, hasFlor } from './game/logic.js';


const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('<h1>Servidor de Truco Uruguayo Activo 🟢</h1><p>El juego se ejecuta en el cliente (puerto 5173).</p>');
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Permitir conexiones desde cualquier origen (dev)
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Estado del juego en memoria
const rooms = {};

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Crear sala
  socket.on('create_room', ({ playerName }) => {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    rooms[roomId] = {
      id: roomId,
      players: [{ id: socket.id, name: playerName, score: 0 }], // Max 2 por ahora
      status: 'waiting', // waiting, playing
      game: null, // Estado del juego de truco
      messages: []
    };
    socket.join(roomId);
    socket.emit('room_created', rooms[roomId]);
    io.emit('rooms_list', getPublicRooms());
    console.log(`Sala creada ${roomId} por ${playerName}`);
  });

  // Unirse a sala
  socket.on('join_room', ({ roomId, playerName }) => {
    const room = rooms[roomId];
    if (room && room.status === 'waiting' && room.players.length < 2) {
      room.players.push({ id: socket.id, name: playerName, score: 0 });
      socket.join(roomId);

      // Notificar a todos en la sala
      io.to(roomId).emit('player_joined', room);

      // Si están completos, iniciar juego automáticamente (o esperar botón)
      if (room.players.length === 2) {
        io.to(roomId).emit('room_ready', room);
      }

      io.emit('rooms_list', getPublicRooms());
    } else {
      socket.emit('error', 'Sala no encontrada o llena');
    }
  });

  // Listar salas
  socket.on('get_rooms', () => {
    socket.emit('rooms_list', getPublicRooms());
  });

  // Iniciar partida
  socket.on('start_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.players.length === 2) {
      // Inicializar lógica de juego aquí
      initializeGame(room);
      room.status = 'playing';
      io.to(roomId).emit('game_started', room);
      io.emit('rooms_list', getPublicRooms()); // Actualizar estado de sala en lobby
    }
  });



  // Realizar una cantada (Truco, Envido, Flor, etc.)
  socket.on('make_call', ({ roomId, callType }) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'playing') return;
    const game = room.game;
    const playerIndex = room.players.findIndex(p => p.id === socket.id);

    // Validaciones básicas
    // Solo puedes cantar si es tu turno O si es una respuesta a un envido/flor (manejado en respond_call mejor)
    // O si es "Flor" que se puede cantar 'antes' de jugar? Simplificaremos: Solo en tu turno.
    if (playerIndex !== game.turnArg && !game.challenge) return;


    // Lógica de transición de estados
    let challenge = { type: callType, from: socket.id, to: room.players[(playerIndex + 1) % 2].id };

    if (callType === 'truco') {
      if (game.trucoLevel > 0) return; // Ya se cantó (o falta lógica de quien puede cantar)
      // En realidad, si nadie cantó, cualquiera puede.
      challenge.value = 2;
      challenge.nextLevel = 1;
    } else if (callType === 'retruco') {
      if (game.trucoLevel !== 1) return;
      // Solo puede cantar retruco el que NO cantó el truco
      if (game.lastCallSender === socket.id) return;

      challenge.value = 3;
      challenge.nextLevel = 2;
    } else if (callType === 'vale4') {
      if (game.trucoLevel !== 2) return;
      // Solo puede cantar vale4 el que NO cantó el retruco
      if (game.lastCallSender === socket.id) return;

      challenge.value = 4;
      challenge.nextLevel = 3;
    } else if (callType === 'envido') {
      if (game.envidoPlayed || game.round > 1) return;
      challenge.value = 2;
    } else if (callType === 'real_envido') {
      // Simplificado
      challenge.value = 3;
    } else if (callType === 'falta_envido') {
      const p1Score = game.score[room.players[0].id];
      const p2Score = game.score[room.players[1].id];
      const maxScore = Math.max(p1Score, p2Score);
      const pointsToWin = 40 - maxScore; // Asumimos a 30 por defecto o 40 según config
      challenge.value = pointsToWin < 1 ? 1 : pointsToWin;
    } else if (callType === 'flor') {
      const hand = game.hands[socket.id];
      if (!hasFlor(hand, game.muestra)) return;

      if (game.florPlayed || game.round > 1) return;
      challenge.value = 3;
    }

    game.challenge = challenge;
    io.to(roomId).emit('game_update', room);
  });

  // Responder a una cantada
  socket.on('respond_call', ({ roomId, response }) => {
    const room = rooms[roomId];
    if (!room || !room.game || !room.game.challenge) return;

    const game = room.game;
    if (socket.id !== game.challenge.to) return;

    if (response === 'quiero') {
      if (['truco', 'retruco', 'vale4'].includes(game.challenge.type)) {
        game.trucoLevel = game.challenge.nextLevel;
        game.pointsAtStake = game.challenge.value;
        game.lastCallSender = game.challenge.from; // El que cantó y fue aceptado tiene el "token"
      } else if (['envido', 'real_envido', 'falta_envido'].includes(game.challenge.type)) {
        game.envidoPlayed = true;
        resolveEnvido(game);
      } else if (game.challenge.type === 'flor') {
        game.florPlayed = true;
        const idx = room.players.findIndex(p => p.id === game.challenge.from);
        game.score[room.players[idx].id] += 3;
      }
      game.challenge = null;
      checkWinCondition(room, io); // Check tras sumar puntos

    } else if (response === 'no_quiero') {
      if (['truco', 'retruco', 'vale4'].includes(game.challenge.type)) {
        const winnerIdx = room.players.findIndex(p => p.id === game.challenge.from);
        // Puntos que valía la mano ANTES del canto actual
        let points = 1;
        if (game.challenge.type === 'retruco') points = 2;
        if (game.challenge.type === 'vale4') points = 3;

        game.score[room.players[winnerIdx].id] += points;
        game.status = 'finished_hand';
        // Aquí deberíamos reiniciar mano automáticamente tras delay
        // Por ahora, simulamos checkWin
        checkWinCondition(room, io);
        // Si no ganó, reiniciar mano (Mock reset simple o emitir hand_finished)
        if (room.status !== 'finished') {
          // Resetear mano?
          // startNextHand(room);
        }
      } else {
        const idx = room.players.findIndex(p => p.id === game.challenge.from);
        game.score[room.players[idx].id] += 1;
        game.envidoPlayed = true;
        game.challenge = null;
        checkWinCondition(room, io);
      }
    }

    io.to(roomId).emit('game_update', room);
  });

  // ... (play_card se mantiene similar, añadir checkWinCondition al final de ronda)


  // Jugar carta
  socket.on('play_card', ({ roomId, card }) => {
    const room = rooms[roomId];
    if (room && room.status === 'playing') {
      if (room.game.challenge) return; // No se puede jugar si hay un desafío pendiente

      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== room.game.turnArg) return;

      const hand = room.game.hands[socket.id];
      const cardIdx = hand.findIndex(c => c.id === card.id);
      if (cardIdx !== -1) {
        hand.splice(cardIdx, 1);
        room.game.table.push({
          playerId: socket.id,
          playerName: room.players[playerIndex].name,
          card: card
        });
        room.game.turnArg = (room.game.turnArg + 1) % 2;
        io.to(roomId).emit('game_update', room);
      }
    }
  });


  // Irse al Mazo (abandonar la mano)
  socket.on('leave_room', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || !room.game) return;

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) return;

    // El otro jugador gana los puntos en juego
    const otherPlayerIndex = (playerIndex + 1) % 2;
    const pointsToAward = room.game.pointsAtStake || 1;

    room.game.score[room.players[otherPlayerIndex].id] += pointsToAward;

    // Check si ganó
    checkWinCondition(room, io);

    // Si no terminó el juego, reiniciar la mano (mock: solo emitir update)
    if (room.status !== 'finished') {
      room.game.status = 'hand_abandoned';
      io.to(roomId).emit('game_update', room);
    }
  });

  socket.on('get_room_state', (roomId) => {
    const room = rooms[roomId];
    socket.emit('room_state', room || null);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    // Manejar desconexión (eliminar de salas, etc)
    // Por simplicidad, si el host se va, cerramos la sala O marcamos desconectado.
    // Implementación simple: Eliminar jugador de salas waiting.
    for (const id in rooms) {
      const room = rooms[id];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        io.to(id).emit('player_left', room);
        if (room.players.length === 0) {
          delete rooms[id];
        }
        io.emit('rooms_list', getPublicRooms());
      }
    }
  });
});

function getPublicRooms() {
  return Object.values(rooms).map(r => ({
    id: r.id,
    players: r.players.length,
    status: r.status,
    host: r.players[0]?.name
  }));
}




// Helper simple para Envido (Mock por ahora, gana siempre el Host o random)
function resolveEnvido(game) {
  // Lógica real requeriría calcular puntos de las manos
  // Aquí simulamos que gana quien cantó +2 puntos por ahora
  const challenger = game.challenge.from;
  game.score[challenger] += game.challenge.value;
}

function initializeGame(room) {
  const deck = shuffleDeck(createDeck());
  const { hand1, hand2, muestra, remaining } = dealHands(deck);

  const p1Id = room.players[0].id;
  const p2Id = room.players[1].id;

  room.game = {
    round: 1, // Ronda 1, 2, 3 de la mano
    turnArg: 0,
    deck: remaining,
    hands: { [p1Id]: hand1, [p2Id]: hand2 },
    muestra: muestra,
    table: [],
    score: { [p1Id]: 0, [p2Id]: 0 },

    // Estado de cantos
    trucoLevel: 0, // 0: Nada, 1: Truco, 2: Retruco, 3: Vale4
    envidoPlayed: false,
    florPlayed: false,
    pointsAtStake: 1, // Puntos bases de la mano
    challenge: null // { type: 'truco', from: 'id', to: 'id', value: 2 }
  };

  console.log(`Partida iniciada en sala ${room.id} de Truco Uruguayo`);
}




function checkWinCondition(room, io) {
  // Si algún jugador >= 30, terminar
  if (!room.game || !room.game.score) return;

  for (const p of room.players) {
    if (room.game.score[p.id] >= 30) {
      room.status = 'finished';
      room.winner = p.name;
      io.to(room.id).emit('game_finished', room);
      console.log(`¡Partida terminada! Ganador: ${p.name} con ${room.game.score[p.id]} puntos`);
      return; // Importante: salir después de encontrar ganador
    }
  }
}

httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

