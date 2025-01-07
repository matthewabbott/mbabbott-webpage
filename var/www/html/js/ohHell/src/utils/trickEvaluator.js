// src/utils/trickEvaluator.js
export class TrickEvaluator {
    constructor(values) {
        this.values = values;
    }

    evaluateTrick(trick, trumpSuit) {
        if (trick.length !== 4) {
            throw new Error('Invalid trick length');
        }

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

    isCardPlayable(card, hand, leadCard) {
        if (!leadCard) return true;
        if (card.suit === leadCard.suit) return true;
        return !hand.some(c => c.suit === leadCard.suit);
    }
}