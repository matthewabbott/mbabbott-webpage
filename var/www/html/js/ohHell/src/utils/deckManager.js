// src/utils/deckManager.js
import { Card } from '../models/card.js';
export class DeckManager {
    constructor() {
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    }

    createDeck() {
        let deck = [];
        for (let suit of this.suits) {
            for (let value of this.values) {
                deck.push(new Card(suit, value));
            }
        }
        return this.shuffle(deck);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    dealCards(players, handSize) {
        const deck = this.createDeck();
        let currentPlayer = 0;

        // Deal cards to each player
        for (let i = 0; i < handSize; i++) {
            for (let j = 0; j < players.length; j++) {
                const playerIndex = (currentPlayer + j) % players.length;
                const card = deck.pop();
                if (card) {
                    players[playerIndex].addCard(card);
                }
            }
        }

        // Return the next card as trump
        return deck.pop();
    }
}