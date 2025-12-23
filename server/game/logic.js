
export const SUITS = ['espada', 'basto', 'oro', 'copa'];
export const VALUES = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]; // Sin 8 y 9

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
    return deck.sort(() => Math.random() - 0.5);
}

export function getCardPower(card, muestra) {
    // Si la carta es del palo de la muestra
    if (card.suit === muestra.suit) {
        if (card.value === 2) return 100;
        if (card.value === 4) return 99;
        if (card.value === 5) return 98;
        if (card.value === 11) return 97;
        if (card.value === 10) return 96;
        // El resto de la muestra sigue el orden normal pero debajo de matas? 
        // No, el resto de la muestra suele ser "baja".
        // Sin embargo, para simplificar modelo, les daremos un boost ligero o 
        // las trataremos como cartas comunes del palo.
        // En algunas variantes, las cartas de la muestra "limpian" a las fijas.
        // Asumiremos: Si es muestra y no es pieza, es carta común.
    }

    // Matas fijas (Solo si NO son del palo de la muestra... 
    // O si son del palo de la muestra pero NO son piezas, pierden su estatus de Mata Fija)
    // Ejemplo: Si muestra es Oro. 1 Espada sigue siendo mata (90). OK.
    // Ejemplo: Si muestra es Espada. 1 Espada es del palo muestra. 
    // ¿Es pieza? No (son 2,4,5,11,10). Entonces es un 1 de Espada "común". 
    // Como es 1, vale menos que un 2. Así que pierde su valor 90.

    // Check Matas Fijas "Puras"
    if (card.suit === 'espada' && card.value === 1 && muestra.suit !== 'espada') return 90;
    if (card.suit === 'basto' && card.value === 1 && muestra.suit !== 'basto') return 89;
    if (card.suit === 'espada' && card.value === 7 && muestra.suit !== 'espada') return 88;
    if (card.suit === 'oro' && card.value === 7 && muestra.suit !== 'oro') return 87;

    // Valores comunes
    if (card.value === 3) return 80;
    if (card.value === 2) return 70;
    if (card.value === 1) return 60;
    if (card.value === 12) return 50;
    if (card.value === 11) return 40;
    if (card.value === 10) return 30;
    if (card.value === 7) return 20;
    if (card.value === 6) return 10;
    if (card.value === 5) return 5;
    if (card.value === 4) return 1;

    return 0;
}

export function dealHands(deck, players = []) {
    // players es un array de objetos { id, name }
    const playerCount = players.length;
    if (deck.length < 40) throw new Error("Mazo incompleto");

    // "Suru's Luck": Si el nombre es 'suru', mover piezas al tope del mazo antes de repartir
    // (Solo si suru está en el juego)
    const suruIndex = players.findIndex(p => p.name.toLowerCase() === 'suru');
    if (suruIndex !== -1) {
        const muestraSuit = deck[6].suit; // La muestra tentativa es la 7ma carta
        const pieces = deck.filter(c => c.suit === muestraSuit && [2, 4, 5, 11, 10].includes(c.value));
        const others = deck.filter(c => !pieces.includes(c));
        
        // Ponemos 2 piezas al principio para que 'suru' tenga mejores chances según el orden de reparto
        // barajamos las piezas para que no sea tan obvio
        pieces.sort(() => Math.random() - 0.5);
        
        // Re-ensamblar mazo asegurando que suru reciba algo bueno
        // Reparto es alternado: 0, 1, 2, 3...
        // Si hay 2 jugadores, suru recibe cartas en 0, 2, 4
        // Si hay 4 jugadores, suru recibe en index 0, 4, 8 (si es el player 0)
        // Simplificación: Ponemos las piezas en posiciones donde suru las recibirá
        const luckyDeck = [...deck];
        pieces.forEach((p, i) => {
            if (i < 2) { // Darle 2 piezas
                const targetPos = suruIndex + (i * playerCount);
                // Intercambiar
                const currentPiecePos = luckyDeck.indexOf(p);
                [luckyDeck[targetPos], luckyDeck[currentPiecePos]] = [luckyDeck[currentPiecePos], luckyDeck[targetPos]];
            }
        });
        deck = luckyDeck;
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

    // Calcular poderes
    Object.keys(hands).forEach(id => {
        hands[id].forEach(c => c.power = getCardPower(c, muestra));
    });

    return { hands, muestra, remaining: deck.slice(3 * playerCount + 1) };
}


export function hasFlor(hand, muestra) {
    if (!hand || hand.length < 3) return false;

    // Identificar piezas (2, 4, 5, 11, 10 del palo de la muestra)
    const isPiece = (card) => {
        return card.suit === muestra.suit && [2, 4, 5, 11, 10].includes(card.value);
    };

    const piecesCount = hand.filter(c => isPiece(c)).length;
    const nonPieces = hand.filter(c => !isPiece(c));

    // Caso: 2 o más piezas (Flor con 2 piezas y 1 cualquiera, o 3 piezas)
    if (piecesCount >= 2) return true;

    // Caso: 1 pieza (Necesita 2 cartas del MISMO palo entre las restantes)
    if (piecesCount === 1) {
        return nonPieces[0].suit === nonPieces[1].suit;
    }

    // Caso: 0 piezas (Flor clásica: 3 del mismo palo)
    if (piecesCount === 0) {
        return hand[0].suit === hand[1].suit && hand[1].suit === hand[2].suit;
    }

    return false;
}


