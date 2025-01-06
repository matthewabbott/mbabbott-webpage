export class AIPlayer {
    constructor(gameCore) {
        this.gameCore = gameCore;
    }

    calculateBid(hand, trumpSuit, currentBids = [], totalBids = 0) {
        let potentialTricks = 0;
        
        // Count high cards and trump cards
        hand.forEach(card => {
            if (card.suit === trumpSuit) {
                // Trump cards have higher potential
                if (['A', 'K', 'Q'].includes(card.value)) {
                    potentialTricks += 0.9;
                } else {
                    potentialTricks += 0.6;
                }
            } else {
                // Non-trump high cards
                if (card.value === 'A') potentialTricks += 0.8;
                if (card.value === 'K') potentialTricks += 0.6;
                if (card.value === 'Q') potentialTricks += 0.4;
            }
        });
        
        // Basic strategy adjustment
        let bid = Math.round(potentialTricks);
        
        // Consider dealer position and total bids
        if (currentBids.length === 3) {  // Last to bid
            const totalBidsWithMine = totalBids + bid;
            const handSize = hand.length;
            
            // Avoid total bids equaling number of tricks if possible
            if (totalBidsWithMine === handSize) {
                if (bid > 0) bid--;
                else bid++;
            }
        }
        
        // Ensure bid is within valid range
        bid = Math.max(0, Math.min(bid, hand.length));
        
        return bid;
    }

    selectCard(hand, currentTrick, trumpSuit) {
        // If leading
        if (currentTrick.length === 0) {
            return this.selectLeadCard(hand, trumpSuit);
        }
        
        // Following
        const leadSuit = currentTrick[0].card.suit;
        const suitCards = hand.filter(card => card.suit === leadSuit);
        
        // Must follow suit if possible
        if (suitCards.length > 0) {
            return this.selectFollowCard(suitCards, currentTrick, trumpSuit);
        }
        
        // Can't follow suit - consider trumping or discarding
        return this.selectDiscardCard(hand, currentTrick, trumpSuit);
    }

    selectLeadCard(hand, trumpSuit) {
        // Prefer non-trump high cards when leading
        const nonTrumpHighCards = hand.filter(card => 
            card.suit !== trumpSuit && ['A', 'K'].includes(card.value)
        );
        
        if (nonTrumpHighCards.length > 0) {
            // Lead highest non-trump
            return this.getHighestCard(nonTrumpHighCards);
        }
        
        // If no high non-trump cards, lead lowest card
        return this.getLowestCard(hand);
    }

    selectFollowCard(suitCards, currentTrick, trumpSuit) {
        const leadCard = currentTrick[0].card;
        const highestInTrick = this.getHighestCardInTrick(currentTrick, trumpSuit);
        
        // Try to win the trick if we have a higher card
        const winningCards = suitCards.filter(card => 
            this.gameCore.values.indexOf(card.value) > 
            this.gameCore.values.indexOf(highestInTrick.value)
        );
        
        if (winningCards.length > 0) {
            // Play lowest winning card
            return this.getLowestCard(winningCards);
        }
        
        // Can't win, play lowest card
        return this.getLowestCard(suitCards);
    }

    selectDiscardCard(hand, currentTrick, trumpSuit) {
        const trumpCards = hand.filter(card => card.suit === trumpSuit);
        const highestInTrick = this.getHighestCardInTrick(currentTrick, trumpSuit);
        
        // Consider trumping if we can win
        if (trumpCards.length > 0 && highestInTrick.suit !== trumpSuit) {
            return this.getLowestCard(trumpCards);
        }
        
        // Can't or shouldn't trump, discard lowest card
        return this.getLowestCard(hand);
    }

    getHighestCard(cards) {
        return cards.reduce((highest, current) => {
            if (this.gameCore.values.indexOf(current.value) > 
                this.gameCore.values.indexOf(highest.value)) {
                return current;
            }
            return highest;
        });
    }

    getLowestCard(cards) {
        return cards.reduce((lowest, current) => {
            if (this.gameCore.values.indexOf(current.value) < 
                this.gameCore.values.indexOf(lowest.value)) {
                return current;
            }
            return lowest;
        });
    }

    getHighestCardInTrick(trick, trumpSuit) {
        const leadSuit = trick[0].card.suit;
        let highest = trick[0].card;
        let trumpPlayed = false;
        
        trick.forEach(play => {
            const card = play.card;
            if (card.suit === trumpSuit && !trumpPlayed) {
                highest = card;
                trumpPlayed = true;
            } else if (card.suit === trumpSuit && trumpPlayed) {
                if (this.gameCore.values.indexOf(card.value) > 
                    this.gameCore.values.indexOf(highest.value)) {
                    highest = card;
                }
            } else if (!trumpPlayed && card.suit === leadSuit) {
                if (this.gameCore.values.indexOf(card.value) > 
                    this.gameCore.values.indexOf(highest.value)) {
                    highest = card;
                }
            }
        });
        
        return highest;
    }
}