
export const SUITS = ['espada', 'basto', 'oro', 'copa'];
export const VALUES = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]; // No 8s and 9s

export function createDeck() {
    const deck = [];
    SUITS.forEach(suit => {
        VALUES.forEach(value => {
            deck.push({
                suit,
                value,
                id: `${value}_${suit}`
            });
        });
    });
    return deck;
}

export function shuffleDeck(deck) {
    return [...deck].sort(() => Math.random() - 0.5);
}

export function getCardPower(card, muestra) {
    // 1. Special "Piezas" of the muestra suit
    if (card.suit === muestra.suit) {
        if (card.value === 2) return 100;
        if (card.value === 4) return 99;
        if (card.value === 5) return 98;
        if (card.value === 11) return 97;
        if (card.value === 10) return 96;
    }

    // 2. Fixed "Matas" (Only if they are NOT piezas of the current muestra)
    if (card.suit === 'espada' && card.value === 1 && (muestra.suit !== 'espada' || ![2, 4, 5, 11, 10].includes(1))) return 90;
    if (card.suit === 'basto' && card.value === 1 && (muestra.suit !== 'basto' || ![2, 4, 5, 11, 10].includes(1))) return 89;
    if (card.suit === 'espada' && card.value === 7 && (muestra.suit !== 'espada' || ![2, 4, 5, 11, 10].includes(7))) return 88;
    if (card.suit === 'oro' && card.value === 7 && (muestra.suit !== 'oro' || ![2, 4, 5, 11, 10].includes(7))) return 87;

    // 3. Common values
    const commonPowers = {
        3: 80,
        2: 70,
        1: 60,
        12: 50,
        11: 40,
        10: 30,
        7: 20,
        6: 10,
        5: 5,
        4: 1
    };

    // If it's a piece that got downgraded/remained common (shouldn't happen with Piezas logic above)
    // or a common card.
    return commonPowers[card.value] || 0;
}

export function dealHands(deck, players = []) {
    const playerCount = players.length;
    if (deck.length < (3 * playerCount + 1)) throw new Error("Not enough cards in deck");

    // "Suru's Luck": If a player is named "suru", ensure they get good cards
    const suruIndex = players.findIndex(p => p.name.toLowerCase() === 'suru');
    if (suruIndex !== -1) {
        // 7th card is usually the Muestra
        const tentativeMuestra = deck[3 * playerCount];
        const pieces = deck.filter(c => c.suit === tentativeMuestra.suit && [2, 4, 5, 11, 10].includes(c.value));

        // Move 2 pieces to positions where "suru" will receive them
        // Deal logic: 0, 1, 2, ...
        if (pieces.length >= 2) {
            const luckyDeck = [...deck];
            // Target indices for suru's first 2 cards
            [0, 1].forEach(i => {
                const targetPos = suruIndex + (i * playerCount);
                const piece = pieces[i];
                const currentPiecePos = luckyDeck.indexOf(piece);
                [luckyDeck[targetPos], luckyDeck[currentPiecePos]] = [luckyDeck[currentPiecePos], luckyDeck[targetPos]];
            });
            deck = luckyDeck;
        }
    }

    const hands = {};
    players.forEach((p, i) => {
        hands[p.id] = [
            deck[i],
            deck[i + playerCount],
            deck[i + 2 * playerCount]
        ];
    });

    const muestra = deck[3 * playerCount];

    // Assign power to each card for easier frontend handling
    Object.keys(hands).forEach(id => {
        hands[id].forEach(card => {
            card.power = getCardPower(card, muestra);
        });
    });

    return {
        hands,
        muestra,
        remaining: deck.slice(3 * playerCount + 1)
    };
}

export function calculateEnvidoPoints(hand, muestra) {
    // Simplification for Rebuild: Just check for Flor or simple Envido base on card values
    const isPiece = (c) => c.suit === muestra.suit && [2, 4, 5, 11, 10].includes(c.value);
    const pieces = hand.filter(isPiece);

    if (pieces.length >= 2) return 30 + pieces.length; // Basic pieza scoring
    return 20; // Default fallback
}
