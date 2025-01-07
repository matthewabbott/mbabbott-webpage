// src/models/player.js
export class Player {
    constructor(name, isAI = false, position = 0) {
        this.name = name;
        this.isAI = isAI;
        this.position = position; // 0: bottom, 1: left, 2: top, 3: right
        this.hand = [];
        this.bid = 0;
        this.tricks = 0;
        this.score = 0;
        this.roundScores = [];
    }

    clearRound() {
        this.hand = [];
        this.bid = 0;
        this.tricks = 0;
    }

    addCard(card) {
        this.hand.push(card);
    }

    removeCard(index) {
        return this.hand.splice(index, 1)[0];
    }

    hasCard(suit) {
        return this.hand.some(card => card.suit === suit);
    }
}