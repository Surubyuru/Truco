import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { createDeck, shuffleDeck, dealHands } from './game/logic.js';
import Room from './models/Room.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/truco_db';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('Truco Server is running!');
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('get_rooms', async () => {
        const publicRooms = await getPublicRooms();
        socket.emit('rooms_list', publicRooms);
    });

    socket.on('create_room', async ({ hostName, maxPlayers }) => {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        const newRoom = new Room({
            id: roomId,
            host: hostName,
            maxPlayers: parseInt(maxPlayers),
            players: [{ id: socket.id, name: hostName, team: 1 }]
        });
        await newRoom.save();
        socket.join(roomId);
        socket.emit('room_created', roomId);
        const publicRooms = await getPublicRooms();
        io.emit('rooms_list', publicRooms);
    });

    socket.on('join_room', async ({ roomId, playerName }) => {
        const room = await Room.findOne({ id: roomId });
        if (room && room.players.length < room.maxPlayers && room.status === 'waiting') {
            const team = room.players.length % 2 === 0 ? 1 : 2;
            room.players.push({ id: socket.id, name: playerName, team });

            if (room.players.length === room.maxPlayers) {
                room.status = 'playing';
                initializeGame(room);
            }

            await room.save();
            socket.join(roomId);
            io.to(roomId).emit('player_joined', room);
            const publicRooms = await getPublicRooms();
            io.emit('rooms_list', publicRooms);
            broadcastGameUpdate(roomId);
        }
    });

    socket.on('play_card', async ({ roomId, card }) => {
        const room = await Room.findOne({ id: roomId });
        if (!room || room.status !== 'playing') return;

        const playerIdx = room.players.findIndex(p => p.id === socket.id);
        if (room.game.turnArg !== playerIdx) return;

        // Remove card from hand
        const hand = room.game.hands[socket.id];
        const cardIdx = hand.findIndex(c => c.suit === card.suit && c.value === card.value);
        if (cardIdx === -1) return;
        hand.splice(cardIdx, 1);

        room.game.table.push({
            playerId: socket.id,
            playerName: room.players[playerIdx].name,
            card
        });

        // Next turn
        room.game.turnArg = (room.game.turnArg + 1) % room.players.length;

        // Mark paths as modified for Mongoose mixed objects
        room.markModified('game.hands');
        room.markModified('game.table');
        room.markModified('game.turnArg');

        if (room.game.table.length === room.players.length) {
            resolveRound(room);
        }

        await room.save();
        broadcastGameUpdate(roomId);
    });

    socket.on('leave_hand', async ({ roomId }) => {
        const room = await Room.findOne({ id: roomId });
        if (room && room.game) {
            const player = room.players.find(p => p.id === socket.id);
            const opponentTeam = player.team === 1 ? 2 : 1;
            room.game.teamScores[opponentTeam] += 1;
            room.markModified('game.teamScores');
            checkWinCondition(room);
            await room.save(); // Save after checkWinCondition might modify status
            if (room.status !== 'finished') {
                setTimeout(async () => {
                    await startNewHand(room);
                    await room.save();
                }, 1500);
            }
        }
    });

    socket.on('leave_room', async ({ roomId }) => {
        const room = await Room.findOne({ id: roomId });
        if (room) {
            const idx = room.players.findIndex(p => p.id === socket.id);
            if (idx !== -1) {
                room.players.splice(idx, 1);
                socket.leave(roomId);
                if (room.players.length === 0) {
                    await Room.deleteOne({ id: roomId });
                } else {
                    io.to(roomId).emit('player_left', room);
                    broadcastGameUpdate(roomId);
                    await room.save();
                }
                const publicRooms = await getPublicRooms();
                io.emit('rooms_list', publicRooms);
            }
        }
    });

    socket.on('suru_cheat', async ({ roomId }) => {
        const room = await Room.findOne({ id: roomId });
        const player = room?.players.find(p => p.id === socket.id);
        if (player?.name.toLowerCase() === 'suru') {
            socket.emit('admin_game_state', room);
        }
    });

    socket.on('disconnect', async () => {
        const roomsToUpdate = await Room.find({ "players.id": socket.id });
        for (const room of roomsToUpdate) {
            const idx = room.players.findIndex(p => p.id === socket.id);
            if (idx !== -1) {
                room.players.splice(idx, 1);
                if (room.players.length === 0) {
                    await Room.deleteOne({ id: room.id });
                } else {
                    io.to(room.id).emit('player_left', room);
                    broadcastGameUpdate(room.id);
                    await room.save();
                }
                const publicRooms = await getPublicRooms();
                io.emit('rooms_list', publicRooms);
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
    room.markModified('game');
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

    room.markModified('game');
    broadcastGameUpdate(room.id);
}

function resolveRound(room) {
    const game = room.game;
    if (game.table.length === 0) return;

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
    // Simple draw logic: first winner wins if round 3 is a draw, or winner of round 3
    else if (game.round > 3) handWinner = winnerPlayer.team;

    if (handWinner) {
        game.teamScores[handWinner] += game.pointsAtStake;
        checkWinCondition(room);
        if (room.status !== 'finished') {
            setTimeout(async () => {
                const r = await Room.findOne({ id: room.id });
                if (r) {
                    startNewHand(r);
                    await r.save();
                }
            }, 2000);
        }
    }
    room.markModified('game');
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

async function broadcastGameUpdate(roomId) {
    const room = await Room.findOne({ id: roomId });
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

async function getPublicRooms() {
    const rooms = await Room.find({});
    return rooms.map(r => ({
        id: r.id,
        host: r.host,
        players: r.players.length,
        maxPlayers: r.maxPlayers,
        status: r.status
    }));
}

// ADMIN API for external management
app.get('/api/admin/rooms', async (req, res) => {
    const rooms = await Room.find({});
    res.json(rooms);
});

app.delete('/api/admin/rooms/:id', async (req, res) => {
    await Room.deleteOne({ id: req.params.id });
    const publicRooms = await getPublicRooms();
    io.emit('rooms_list', publicRooms);
    res.sendStatus(200);
});

app.post('/api/admin/rooms/:id/score', async (req, res) => {
    const { team, score } = req.body;
    const room = await Room.findOne({ id: req.params.id });
    if (room && room.game) {
        room.game.teamScores[team] = score;
        room.markModified('game');
        await room.save();
        broadcastGameUpdate(room.id);
        res.json(room);
    } else {
        res.sendStatus(404);
    }
});

httpServer.listen(PORT, () => console.log(`Server on:${PORT} `));
