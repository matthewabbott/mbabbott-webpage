export class GameCoordinator {
    constructor(gameCore, ui, cardManager, ai) {
        this.gameCore = gameCore;
        this.ui = ui;
        this.cardManager = cardManager;
        this.ai = ai;
        
        this.playerHand = [];
        this.aiHands = [[], [], []];
        this.currentTrick = [];
        this.trumpCard = null;
        
        // Bind event handlers
        this.handleBidSubmit = this.handleBidSubmit.bind(this);
        this.handleCardPlay = this.handleCardPlay.bind(this);
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Set up bid button listener
        const bidButton = document.getElementById('submit-bid');
        if (bidButton) {
            bidButton.addEventListener('click', this.handleBidSubmit);
        }
        
        // Set up card confirmation listeners
        const confirmButton = document.getElementById('confirm-card');
        const cancelButton = document.getElementById('cancel-card');
        
        if (confirmButton) {
            confirmButton.addEventListener('click', () => {
                if (this.cardManager.selectedCard !== null) {
                    this.handleCardPlay(this.cardManager.selectedCard);
                    this.clearSelectedCard();
                }
            });
        }
        
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                this.clearSelectedCard();
            });
        }
    }
    
    startNewRound() {
        console.log('Starting new round:', this.gameCore.currentRound);
        
        // Reset state
        this.playerHand = [];
        this.aiHands = [[], [], []];
        this.currentTrick = [];
        this.trumpCard = null;
        
        // Deal cards
        const deck = this.gameCore.createDeck();
        const handSize = this.gameCore.currentRound;
        
        // Deal to each player starting with the player after the dealer
        let currentPlayer = (this.gameCore.dealer + 1) % 4;
        for (let i = 0; i < handSize; i++) {
            for (let j = 0; j < 4; j++) {
                const playerIndex = (currentPlayer + j) % 4;
                const card = deck.pop();
                if (playerIndex === 0) {
                    this.playerHand.push(card);
                } else {
                    this.aiHands[playerIndex - 1].push(card);
                }
            }
        }
        
        // Set trump card
        this.trumpCard = deck.pop();
        
        this.gameCore.currentPlayer = (this.gameCore.dealer + 1) % 4;
        this.gameCore.biddingPhase = true;
        
        // Render initial state
        this.updateGameDisplay();
        
        // Start bidding phase
        if (this.gameCore.currentPlayer === 0) {
            this.ui.showBiddingInterface(this.gameCore.currentRound);
        } else {
            this.makeAiBid();
        }
    }
    
    handleBidSubmit() {
        const bidInput = document.getElementById('bid-input');
        const bid = parseInt(bidInput.value);
        
        if (bid < 0 || bid > this.gameCore.currentRound) {
            alert('Invalid bid!');
            return;
        }
        
        this.gameCore.bids[0] = bid;
        this.ui.hideBiddingInterface();
        this.gameCore.biddingPhase = false;
        this.updateGameDisplay();
        
        if (this.gameCore.currentPlayer !== 0) {
            this.makeAiBid();
        }
    }
    
    makeAiBid() {
        const aiIndex = this.gameCore.currentPlayer - 1;
        const bid = this.ai.calculateBid(
            this.aiHands[aiIndex],
            this.trumpCard.suit,
            this.gameCore.bids.slice(0, this.gameCore.currentPlayer),
            this.gameCore.bids.reduce((a, b) => a + b, 0)
        );
        
        this.gameCore.bids[this.gameCore.currentPlayer] = bid;
        this.updateGameDisplay();
        
        this.gameCore.currentPlayer = (this.gameCore.currentPlayer + 1) % 4;
        
        if (this.gameCore.currentPlayer === 0) {
            this.ui.showBiddingInterface(this.gameCore.currentRound);
        } else {
            setTimeout(() => this.makeAiBid(), this.ui.getDelay());
        }
    }
    
    handleCardPlay(cardIndex) {
        if (this.gameCore.currentPlayer !== 0 || this.gameCore.biddingPhase) return;
        
        const card = this.playerHand[cardIndex];
        if (!this.isCardPlayable(card)) {
            alert('You must follow suit if possible!');
            return;
        }
        
        this.currentTrick.push({ card, player: 0 });
        this.playerHand.splice(cardIndex, 1);
        
        this.updateGameDisplay();
        
        if (this.currentTrick.length === 4) {
            setTimeout(() => this.evaluateTrick(), this.ui.getDelay());
        } else {
            this.gameCore.currentPlayer = 1;
            setTimeout(() => this.aiPlay(), this.ui.getDelay());
        }
    }
    
    aiPlay() {
        const aiIndex = this.gameCore.currentPlayer - 1;
        const hand = this.aiHands[aiIndex];
        
        const leadCard = this.currentTrick.length > 0 ? this.currentTrick[0].card : null;
        const selectedCard = this.ai.selectCard(hand, this.currentTrick, this.trumpCard.suit);
        const cardIndex = hand.indexOf(selectedCard);
        
        this.currentTrick.push({ card: selectedCard, player: this.gameCore.currentPlayer });
        hand.splice(cardIndex, 1);
        
        this.updateGameDisplay();
        
        if (this.currentTrick.length === 4) {
            setTimeout(() => this.evaluateTrick(), this.ui.getDelay());
        } else {
            this.gameCore.currentPlayer = (this.gameCore.currentPlayer + 1) % 4;
            if (this.gameCore.currentPlayer !== 0) {
                setTimeout(() => this.aiPlay(), this.ui.getDelay());
            }
        }
    }
    
    evaluateTrick() {
        const winner = this.gameCore.evaluateTrickWinner(this.currentTrick, this.trumpCard.suit);
        this.gameCore.tricks[winner]++;
        this.currentTrick = [];
        this.gameCore.currentPlayer = winner;
        
        const roundComplete = this.playerHand.length === 0 && 
                            this.aiHands.every(hand => hand.length === 0);
        
        this.updateGameDisplay();
        
        if (roundComplete) {
            setTimeout(() => this.endRound(), this.ui.getDelay());
        } else {
            if (winner === 0) {
                this.ui.showCardSlot();
            } else {
                setTimeout(() => this.aiPlay(), this.ui.getDelay());
            }
        }
    }
    
    endRound() {
        const roundScores = this.gameCore.calculateRoundScores(
            this.gameCore.bids,
            this.gameCore.tricks
        );
        
        // Update total scores
        this.gameCore.scores = this.gameCore.scores.map(
            (score, index) => score + roundScores[index]
        );
        
        // Add to round history
        this.gameCore.roundHistory.push({
            round: this.gameCore.currentRound,
            bids: [...this.gameCore.bids],
            tricks: [...this.gameCore.tricks],
            roundScores
        });
        
        this.updateGameDisplay();
        
        // Move dealer pin
        this.gameCore.rotateDealer();
        
        if (this.gameCore.currentRound < 7) {
            this.gameCore.currentRound++;
            setTimeout(() => this.startNewRound(), this.ui.getDelay());
        } else {
            const winner = this.gameCore.scores.indexOf(Math.max(...this.gameCore.scores));
            alert(`Game Over! ${this.gameCore.playerNames[winner]} wins with ${this.gameCore.scores[winner]} points!`);
        }
    }
    
    isCardPlayable(card) {
        if (this.currentTrick.length === 0) return true;
        const leadSuit = this.currentTrick[0].card.suit;
        if (card.suit === leadSuit) return true;
        return !this.playerHand.some(c => c.suit === leadSuit);
    }
    
    clearSelectedCard() {
        this.cardManager.clearSelectedCard();
        this.ui.hideConfirmation();
        this.updateGameDisplay();
    }
    
    updateGameDisplay() {
        // Update UI elements
        this.ui.renderPlayerHand(this.playerHand, this.gameCore.currentPlayer === 0);
        this.ui.renderAiHands(this.aiHands);
        this.ui.renderTrick(this.currentTrick);
        this.ui.updatePlayerInfo();
        this.ui.updateScoreDisplay();
        this.ui.updateTrumpDisplay(this.trumpCard);
    }
}