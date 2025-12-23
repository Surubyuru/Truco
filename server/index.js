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
  socket.on('create_room', ({ playerName, maxPlayers = 2 }) => {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    rooms[roomId] = {
      id: roomId,
      players: [{ id: socket.id, name: playerName, score: 0 }],
      maxPlayers: parseInt(maxPlayers),
      status: 'waiting',
      game: null,
      messages: []
    };
    socket.join(roomId);
    socket.emit('room_created', rooms[roomId]);
    io.emit('rooms_list', getPublicRooms());
    console.log(`Sala creada ${roomId} por ${playerName} (${maxPlayers} jugadores)`);
  });

  // Unirse a sala
  socket.on('join_room', ({ roomId, playerName }) => {
    const room = rooms[roomId];
    if (room && room.status === 'waiting' && room.players.length < room.maxPlayers) {
      room.players.push({ id: socket.id, name: playerName, score: 0 });
      socket.join(roomId);

      io.to(roomId).emit('player_joined', room);

      if (room.players.length === room.maxPlayers) {
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
    if (room && room.players.length === room.maxPlayers) {
      initializeGame(room);
      room.status = 'playing';
      broadcastGameUpdate(roomId);
      io.emit('rooms_list', getPublicRooms());
    }
  });

  // Realizar una cantada (Truco, Envido, Flor, etc.)
  socket.on('make_call', ({ roomId, callType }) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'playing') return;
    const game = room.game;
    const playerIndex = room.players.findIndex(p => p.id === socket.id);

    if (playerIndex !== game.turnArg && !game.challenge) return;

    let challenge = {
      type: callType,
      from: socket.id,
      to: room.players[(playerIndex + 1) % room.maxPlayers].id
    };

    if (callType === 'truco') {
      if (game.trucoLevel > 0) return;
      challenge.value = 2;
      challenge.nextLevel = 1;
    } else if (callType === 'retruco') {
      if (game.trucoLevel !== 1) return;
      if (game.lastCallSender === socket.id) return;
      challenge.value = 3;
      challenge.nextLevel = 2;
    } else if (callType === 'vale4') {
      if (game.trucoLevel !== 2) return;
      if (game.lastCallSender === socket.id) return;
      challenge.value = 4;
      challenge.nextLevel = 3;
    } else if (callType === 'envido') {
      if (game.envidoPlayed || game.round > 1) return;
      challenge.value = 2;
    } else if (callType === 'real_envido') {
      challenge.value = 3;
    } else if (callType === 'falta_envido') {
      // Simplificado para múltiples jugadores (puntos del equipo líder)
      let maxScore = 0;
      Object.values(game.teamScores).forEach(s => { if (s > maxScore) maxScore = s; });
      const pointsToWin = 30 - maxScore;
      challenge.value = pointsToWin < 1 ? 1 : pointsToWin;
    } else if (callType === 'flor') {
      const hand = game.hands[socket.id];
      if (!hasFlor(hand, game.muestra)) return;
      if (game.florPlayed || game.round > 1) return;
      challenge.value = 3;
    }

    game.challenge = challenge;
    broadcastGameUpdate(roomId);
  });

  // Responder a una cantada
  socket.on('respond_call', ({ roomId, response }) => {
    const room = rooms[roomId];
    if (!room || !room.game || !room.game.challenge) return;

    const game = room.game;
    if (socket.id !== game.challenge.to) return;

    const responderIndex = room.players.findIndex(p => p.id === socket.id);
    const responderTeam = room.players[responderIndex].team;

    if (response === 'quiero') {
      const challengeType = game.challenge.type;
      const challengerId = game.challenge.from;

      if (['truco', 'retruco', 'vale4'].includes(challengeType)) {
        game.pointsAtStake = game.challenge.value;
        game.trucoLevel = (challengeType === 'truco' ? 1 : challengeType === 'retruco' ? 2 : 3);
        game.lastCallSender = challengerId;
        game.challenge = null;
      } else if (['envido', 'real_envido', 'falta_envido'].includes(challengeType)) {
        game.envidoPlayed = true;
        resolveEnvido(game, room);
        game.challenge = null;
      } else if (challengeType === 'flor') {
        game.florPlayed = true;
        const responder = room.players.find(p => p.id === socket.id);
        const responderTeam = responder.team;
        game.teamScores[responderTeam] += 3;
        game.challenge = null;
        checkWinCondition(room, io);
      }
    } else {
      // "No Quiero"
      const challenger = room.players.find(p => p.id === game.challenge.from);
      const challengerTeam = challenger.team;

      if (['truco', 'retruco', 'vale4'].includes(game.challenge.type)) {
        const points = game.challenge.type === 'truco' ? 1 : (game.challenge.type === 'retruco' ? 2 : 3);
        game.teamScores[challengerTeam] += points;
        checkWinCondition(room, io);
        if (room.status !== 'finished') {
          setTimeout(() => startNewHand(room), 2000);
        }
      } else {
        game.teamScores[challengerTeam] += 1;
        game.envidoPlayed = true;
        game.challenge = null;
        checkWinCondition(room, io);
      }
    }

    broadcastGameUpdate(roomId);
  });

  // Jugar carta
  socket.on('play_card', ({ roomId, card }) => {
    const room = rooms[roomId];
    if (room && room.status === 'playing') {
      if (room.game.challenge) return;

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
        room.game.turnArg = (room.game.turnArg + 1) % room.players.length;

        // Si todos jugaron, resolver ronda
        if (room.game.table.length === room.players.length) {
          resolveRound(room);
        }

        broadcastGameUpdate(roomId);
      }
    }
  });

  function resolveRound(room) {
    const game = room.game;
    let winnerPlay = game.table[0];

    game.table.forEach(play => {
      if (play.card.power > winnerPlay.card.power) {
        winnerPlay = play;
      }
    });

    const winnerPlayer = room.players.find(p => p.id === winnerPlay.playerId);
    const winningTeam = winnerPlayer.team;

    if (!game.roundWins) game.roundWins = { 1: 0, 2: 0 };
    game.roundWins[winningTeam]++;

    // El que gana la ronda empieza la siguiente
    game.turnArg = room.players.findIndex(p => p.id === winnerPlay.playerId);
    game.round++;
    game.table = [];

    // Verificar si alguien ganó la mano (al mejor de 3)
    let handWinner = null;
    if (game.roundWins[1] === 2) handWinner = 1;
    else if (game.roundWins[2] === 2) handWinner = 2;
    else if (game.round > 3) {
      // Empate técnico o similar, por ahora el que ganó la primera
      handWinner = winningTeam;
    }

    if (handWinner) {
      game.teamScores[handWinner] += game.pointsAtStake;
      checkWinCondition(room, io);
      if (room.status !== 'finished') {
        setTimeout(() => startNewHand(room), 2000);
      }
    }
  }

  function startNewHand(room) {
    const deck = shuffleDeck(createDeck());
    const { hands, muestra, remaining } = dealHands(deck, room.players);

    room.game.round = 1;
    room.game.roundWins = { 1: 0, 2: 0 };
    room.game.hands = hands;
    room.game.muestra = muestra;
    room.game.deck = remaining;
    room.game.table = [];
    room.game.pointsAtStake = 1;
    room.game.trucoLevel = 0;
    room.game.envidoPlayed = false;
    room.game.challenge = null;

    // Rotar el turno inicial (el mano)
    room.game.turnArg = (room.game.turnArg + 1) % room.players.length;

    broadcastGameUpdate(room.id);
  }

  // Irse al Mazo (abandonar la mano)
  socket.on('leave_hand', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || !room.game) return;

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    const myTeam = room.players[playerIndex].team;
    const otherTeam = myTeam === 1 ? 2 : 1;
    const pointsToAward = room.game.pointsAtStake || 1;

    room.game.teamScores[otherTeam] += pointsToAward;
    checkWinCondition(room, io);

    if (room.status !== 'finished') {
      setTimeout(() => startNewHand(room), 1500);
    }
  });

  // Especial 'suru': ver todas las cartas
  socket.on('suru_cheat', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.game) {
      const player = room.players.find(p => p.id === socket.id);
      if (player && player.name.toLowerCase() === 'suru') {
        socket.emit('admin_game_state', room);
      }
    }
  });

  socket.on('get_room_state', (roomId) => {
    const room = rooms[roomId];
    socket.emit('room_state', room || null);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
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

// Función para enviar actualización de juego filtrada por equipo
function broadcastGameUpdate(roomId) {
  const room = rooms[roomId];
  if (!room || !room.game) return;

  room.players.forEach(player => {
    const maskedRoom = JSON.parse(JSON.stringify(room));
    const myTeam = player.team;

    // Ocultar cartas de otros equipos
    Object.keys(maskedRoom.game.hands).forEach(playerId => {
      const targetPlayer = room.players.find(p => p.id === playerId);
      if (targetPlayer.team !== myTeam && player.id !== playerId) {
        // No es mi equipo, ocultar
        maskedRoom.game.hands[playerId] = maskedRoom.game.hands[playerId].map(() => ({ hidden: true }));
      }
    });

    io.to(player.id).emit('game_update', maskedRoom);
  });
}

function getPublicRooms() {
  return Object.values(rooms).map(r => ({
    id: r.id,
    players: r.players.length,
    status: r.status,
    host: r.players[0]?.name
  }));
}





function initializeGame(room) {
  const deck = shuffleDeck(createDeck());

  // Asignar equipos: 0, 2, 4 -> Team 1 | 1, 3, 5 -> Team 2
  room.players.forEach((p, i) => {
    p.team = (i % 2 === 0) ? 1 : 2;
  });

  const { hands, muestra, remaining } = dealHands(deck, room.players);

  room.game = {
    round: 1,
    turnArg: 0,
    deck: remaining,
    hands: hands,
    muestra: muestra,
    table: [],
    teamScores: { 1: 0, 2: 0 },
    trucoLevel: 0,
    envidoPlayed: false,
    florPlayed: false,
    pointsAtStake: 1,
    challenge: null
  };

  console.log(`Partida de ${room.maxPlayers} iniciada en sala ${room.id}`);
}

function resolveEnvido(game, room) {
  const challenger = room.players.find(p => p.id === game.challenge.from);
  game.teamScores[challenger.team] += game.challenge.value;
}

function checkWinCondition(room, io) {
  if (!room.game || !room.game.teamScores) return;

  if (room.game.teamScores[1] >= 30) {
    room.status = 'finished';
    room.winner = "Equipo 1";
    io.to(room.id).emit('game_finished', room);
  } else if (room.game.teamScores[2] >= 30) {
    room.status = 'finished';
    room.winner = "Equipo 2";
    io.to(room.id).emit('game_finished', room);
  }
}

httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

