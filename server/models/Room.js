const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    id: String,
    name: String,
    team: Number
});

const roomSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    host: String,
    maxPlayers: Number,
    status: { type: String, default: 'waiting' },
    players: [playerSchema],
    winner: String,
    game: {
        round: Number,
        turnArg: Number,
        dealerIdx: Number,
        muestra: Object,
        hands: Object, // Keyed by player ID
        table: Array,
        teamScores: {
            1: { type: Number, default: 0 },
            2: { type: Number, default: 0 }
        },
        roundWins: {
            1: { type: Number, default: 0 },
            2: { type: Number, default: 0 }
        },
        pointsAtStake: { type: Number, default: 1 }
    }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
