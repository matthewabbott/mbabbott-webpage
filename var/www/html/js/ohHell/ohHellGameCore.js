export class OhHellGameCore {
    constructor() {
        this.currentRound = 1;
        this.bids = [0, 0, 0, 0];
        this.tricks = [0, 0, 0, 0];
        this.scores = [0, 0, 0, 0];
        this.roundHistory = [];
        this.currentPlayer = 0;
        this.dealer = Math.floor(Math.random() * 4);
        this.biddingPhase = true;
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.playerNames = ['You', 'West AI', 'North AI', 'East AI'];
    }

    createDeck() {
        let deck = [];
        for (let suit of this.suits) {
            for (let value of this.values) {
                deck.push({ suit, value });
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

    evaluateTrickWinner(trick, trumpSuit) {
        const leadSuit = trick[0].card.suit;
        let winner = 0;
        let highestValue = this.values.indexOf(trick[0].card.value);
        let trumpInTrick = false;
        
        trick.forEach((play, index) => {
            const isTrump = play.card.suit === trumpSuit;
            const cardValue = this.values.indexOf(play.card.value);
            
            if (isTrump && !trumpInTrick) {
                winner = index;
                highestValue = cardValue;
                trumpInTrick = true;
            } else if (isTrump && trumpInTrick) {
                if (cardValue > highestValue) {
                    winner = index;
                    highestValue = cardValue;
                }
            } else if (!trumpInTrick && play.card.suit === leadSuit) {
                if (cardValue > highestValue) {
                    winner = index;
                    highestValue = cardValue;
                }
            }
        });
        
        return trick[winner].player;
    }

    calculateRoundScores(bids, tricks) {
        return bids.map((bid, index) => {
            if (bid === tricks[index]) {
                return 10 + bid;
            }
            return 0;
        });
    }

    isCardPlayable(card, hand, leadCard) {
        if (!leadCard) return true;
        if (card.suit === leadCard.suit) return true;
        return !hand.some(c => c.suit === leadCard.suit);
    }

    getValidPlays(hand, leadCard) {
        if (!leadCard) return hand;
        const suitCards = hand.filter(card => card.suit === leadCard.suit);
        return suitCards.length > 0 ? suitCards : hand;
    }

    rotateDealer() {
        this.dealer = (this.dealer + 1) % 4;
        return this.dealer;
    }

    getNextPlayer(currentPlayer) {
        return (currentPlayer + 1) % 4;
    }
}