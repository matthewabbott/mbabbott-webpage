// src/ai/aiPlayer.js
export class AIPlayer {
    static calculateBid(hand, trumpSuit, maxBid, trickEvaluator) {
        let expectedTricks = 0;
        const values = trickEvaluator.values;

        hand.forEach(card => {
            // Count high cards and trump cards
            if (card.suit === trumpSuit) {
                // Trump cards are worth more
                const valueIndex = values.indexOf(card.value);
                if (valueIndex >= values.length - 3) {  // A, K, Q
                    expectedTricks += 0.9;
                } else if (valueIndex >= values.length - 5) {  // J, 10
                    expectedTricks += 0.7;
                } else {
                    expectedTricks += 0.5;
                }
            } else {
                // Non-trump high cards
                const valueIndex = values.indexOf(card.value);
                if (valueIndex >= values.length - 2) {  // A, K
                    expectedTricks += 0.8;
                } else if (valueIndex === values.length - 3) {  // Q
                    expectedTricks += 0.6;
                } else if (valueIndex === values.length - 4) {  // J
                    expectedTricks += 0.4;
                }
            }
        });

        // Round to nearest integer and ensure within bounds
        let bid = Math.min(Math.round(expectedTricks), maxBid);
        
        // Add some randomness to make the AI less predictable
        if (Math.random() < 0.2) {  // 20% chance to adjust bid
            bid += Math.random() < 0.5 ? -1 : 1;
            bid = Math.max(0, Math.min(bid, maxBid));
        }

        return bid;
    }

    static selectCard(hand, currentTrick, trumpSuit, trickEvaluator) {
        if (!Array.isArray(hand) || hand.length === 0) {
            console.error('Invalid hand provided to AI:', hand);
            return null;
        }

        // Get playable cards based on suit following rules
        let playableCards = [...hand];
        if (currentTrick.length > 0) {
            const leadSuit = currentTrick[0].card.suit;
            const suitCards = hand.filter(card => card.suit === leadSuit);
            if (suitCards.length > 0) {
                playableCards = suitCards;
            }
        }

        // If leading, prefer high cards or trump
        if (currentTrick.length === 0) {
            return this.selectLeadCard(playableCards, trumpSuit, trickEvaluator);
        }

        // If following, try to win if possible, otherwise dump lowest card
        return this.selectFollowCard(playableCards, currentTrick, trumpSuit, trickEvaluator);
    }

    static selectLeadCard(cards, trumpSuit, trickEvaluator) {
        const values = trickEvaluator.values;
        
        // Sort by value (high to low)
        cards.sort((a, b) => {
            const aValue = values.indexOf(a.value);
            const bValue = values.indexOf(b.value);
            return bValue - aValue;
        });

        // Prefer high non-trump cards first
        const nonTrumpCards = cards.filter(card => card.suit !== trumpSuit);
        if (nonTrumpCards.length > 0) {
            return nonTrumpCards[0];
        }

        // If only trump cards left, play highest
        return cards[0];
    }

    static selectFollowCard(cards, currentTrick, trumpSuit, trickEvaluator) {
        const values = trickEvaluator.values;
        const leadCard = currentTrick[0].card;
        
        // Find current winning card
        let winningCard = leadCard;
        let winningValue = values.indexOf(leadCard.value);
        let trumpInTrick = false;

        currentTrick.forEach(play => {
            const isTrump = play.card.suit === trumpSuit;
            const cardValue = values.indexOf(play.card.value);

            if (isTrump && !trumpInTrick) {
                winningCard = play.card;
                winningValue = cardValue;
                trumpInTrick = true;
            } else if (isTrump && trumpInTrick) {
                if (cardValue > winningValue) {
                    winningCard = play.card;
                    winningValue = cardValue;
                }
            } else if (!trumpInTrick && play.card.suit === leadCard.suit) {
                if (cardValue > winningValue) {
                    winningCard = play.card;
                    winningValue = cardValue;
                }
            }
        });

        // Try to win if possible
        const winningCards = cards.filter(card => {
            if (trumpInTrick) {
                return card.suit === trumpSuit && 
                       values.indexOf(card.value) > winningValue;
            } else if (card.suit === trumpSuit) {
                return true;
            } else {
                return card.suit === leadCard.suit && 
                       values.indexOf(card.value) > winningValue;
            }
        });

        if (winningCards.length > 0) {
            // Play lowest winning card
            winningCards.sort((a, b) => values.indexOf(a.value) - values.indexOf(b.value));
            return winningCards[0];
        }

        // If can't win, play lowest card
        cards.sort((a, b) => values.indexOf(a.value) - values.indexOf(b.value));
        return cards[0];
    }
}