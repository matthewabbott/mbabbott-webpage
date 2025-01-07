// src/models/card.js
export class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    toString() {
        return `${this.value}${this.suit}`;
    }

    isRed() {
        return ['♥', '♦'].includes(this.suit);
    }
}