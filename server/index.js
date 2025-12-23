
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createDeck, shuffleDeck, dealHands } from './game/logic.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const rooms = {};

app.get('/', (req, res) => {
    res.send('Truco Server is running!');
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('get_rooms', () => {
        socket.emit('rooms_list', getPublicRooms());
    });

    socket.on('create_room', ({ hostName, maxPlayers }) => {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        rooms[roomId] = {
            id: roomId,
            host: hostName,
            maxPlayers: parseInt(maxPlayers),
            players: [{ id: socket.id, name: hostName, team: 1 }],
            status: 'waiting',
            game: null
        };
        socket.join(roomId);
        io.emit('rooms_list', getPublicRooms());
        socket.emit('room_created', roomId);
    });

    socket.on('join_room', ({ roomId, playerName }) => {
        const room = rooms[roomId];
        if (room && room.players.length < room.maxPlayers) {
            // Assign team based on index
            const team = (room.players.length % 2 === 0) ? 1 : 2;
            room.players.push({ id: socket.id, name: playerName, team });
            socket.join(roomId);

            if (room.players.length === room.maxPlayers) {
                room.status = 'playing';
                initializeGame(room);
            }

            broadcastGameUpdate(roomId);
            io.emit('rooms_list', getPublicRooms());
        }
    });

    socket.on('play_card', ({ roomId, card }) => {
        const room = rooms[roomId];
        if (room && room.game && room.status === 'playing') {
            const game = room.game;
            const playerIndex = room.players.findIndex(p => p.id === socket.id);

            if (game.turnArg !== playerIndex) return;

            const hand = game.hands[socket.id];
            const cardIdx = hand.findIndex(c => c.id === card.id);

            if (cardIdx !== -1) {
                hand.splice(cardIdx, 1);
                game.table.push({
                    playerId: socket.id,
                    playerName: room.players[playerIndex].name,
                    card: card
                });

                game.turnArg = (game.turnArg + 1) % room.players.length;

                if (game.table.length === room.players.length) {
                    resolveRound(room);
                }

                broadcastGameUpdate(roomId);
            }
        }
    });

    socket.on('leave_hand', ({ roomId }) => {
        const room = rooms[roomId];
        if (room && room.game) {
            const player = room.players.find(p => p.id === socket.id);
            const opponentTeam = player.team === 1 ? 2 : 1;
            room.game.teamScores[opponentTeam] += 1;
            checkWinCondition(room);
            if (room.status !== 'finished') {
                setTimeout(() => startNewHand(room), 1500);
            }
        }
    });

    socket.on('suru_cheat', ({ roomId }) => {
        const room = rooms[roomId];
        const player = room?.players.find(p => p.id === socket.id);
        if (player?.name.toLowerCase() === 'suru') {
            socket.emit('admin_game_state', room);
        }
    });

    socket.on('disconnect', () => {
        for (const id in rooms) {
            const room = rooms[id];
            const idx = room.players.findIndex(p => p.id === socket.id);
            if (idx !== -1) {
                room.players.splice(idx, 1);
                if (room.players.length === 0) delete rooms[id];
                else io.to(id).emit('player_left', room);
                io.emit('rooms_list', getPublicRooms());
            }
        }
    });
});

function initializeGame(room) {
    const deck = shuffleDeck(createDeck());
    const { hands, muestra, remaining } = dealHands(deck, room.players);

    room.game = {
        round: 1,
        turnArg: 0, // Who plays now
        dealerIdx: 0, // Who is the "mano" initially
        hands,
        muestra,
        table: [],
        teamScores: { 1: 0, 2: 0 },
        roundWins: { 1: 0, 2: 0 },
        pointsAtStake: 1
    };
}

function startNewHand(room) {
    const deck = shuffleDeck(createDeck());
    const { hands, muestra } = dealHands(deck, room.players);

    room.game.dealerIdx = (room.game.dealerIdx + 1) % room.players.length;
    room.game.turnArg = room.game.dealerIdx;
    room.game.hands = hands;
    room.game.muestra = muestra;
    room.game.table = [];
    room.game.round = 1;
    room.game.roundWins = { 1: 0, 2: 0 };
    room.game.pointsAtStake = 1;

    broadcastGameUpdate(room.id);
}

function resolveRound(room) {
    const game = room.game;
    let winnerPlay = game.table[0];

    game.table.forEach(play => {
        if (play.card.power > winnerPlay.card.power) winnerPlay = play;
    });

    const winnerPlayer = room.players.find(p => p.id === winnerPlay.playerId);
    game.roundWins[winnerPlayer.team]++;

    // Winner starts next round
    game.turnArg = room.players.indexOf(winnerPlayer);
    game.round++;
    game.table = [];

    let handWinner = null;
    if (game.roundWins[1] === 2) handWinner = 1;
    else if (game.roundWins[2] === 2) handWinner = 2;
    else if (game.round > 3) handWinner = winnerPlayer.team; // Fallback for draws

    if (handWinner) {
        game.teamScores[handWinner] += game.pointsAtStake;
        checkWinCondition(room);
        if (room.status !== 'finished') {
            setTimeout(() => startNewHand(room), 2000);
        }
    }
}

function checkWinCondition(room) {
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

function broadcastGameUpdate(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.players.forEach(player => {
        const masked = JSON.parse(JSON.stringify(room));
        Object.keys(masked.game?.hands || {}).forEach(pid => {
            const p = room.players.find(x => x.id === pid);
            if (pid !== player.id && p.team !== player.team) {
                masked.game.hands[pid] = masked.game.hands[pid].map(() => ({ hidden: true }));
            }
        });
        io.to(player.id).emit('game_update', masked);
    });
}

function getPublicRooms() {
    return Object.values(rooms).map(r => ({
        id: r.id,
        host: r.host,
        players: r.players.length,
        maxPlayers: r.maxPlayers,
        status: r.status
    }));
}

httpServer.listen(PORT, () => console.log(`Server on :${PORT}`));
