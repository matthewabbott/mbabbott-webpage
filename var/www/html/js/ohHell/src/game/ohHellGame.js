// src/game/ohHellGame.js
import { Player } from '../models/player.js';
import { DeckManager } from '../utils/deckManager.js';
import { GameState } from '../utils/gameState.js';
import { TrickEvaluator } from '../utils/trickEvaluator.js';
import { GameUI } from '../ui/gameUI.js';
import { AIPlayer } from '../ai/aiPlayer.js';

export class OhHellGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error('Container element not found');
        }

        // Initialize core components
        this.deckManager = new DeckManager();
        this.gameState = new GameState();
        this.trickEvaluator = new TrickEvaluator(this.deckManager.values);
        
        // Initialize players
        this.players = [
            new Player('You', false, 0),
            new Player('West AI', true, 1),
            new Player('North AI', true, 2),
            new Player('East AI', true, 3)
        ];

        // UI must be last, depends on other components
        this.ui = new GameUI(
            this.container, 
            this.gameState, 
            this.players, 
            this.trickEvaluator
        );
        this.ui.onCardPlayed = this.playCard.bind(this);
        this.ui.biddingUI.onBidSubmitted = this.submitBid.bind(this);

        this.startNewRound();
    }

    startNewRound() {
        console.log('Starting round:', this.gameState.currentRound);
        
        // Reset players for new round
        this.players.forEach(player => player.clearRound());
        
        // Clear game state
        this.gameState.currentTrick = [];
        this.gameState.biddingPhase = true;
        
        // Deal cards
        this.gameState.trumpCard = this.deckManager.dealCards(
            this.players, 
            this.gameState.currentRound
        );
        
        // Set starting player (after dealer)
        this.gameState.currentPlayer = (this.gameState.dealer + 1) % 4;
        
        // Render initial state
        this.ui.renderGameState();
        
        // Start bidding phase
        if (this.gameState.currentPlayer === 0) {
            this.ui.biddingUI.show();
        } else {
            this.makeAiBid();
        }
    }

	submitBid(bid) {
		console.log('submitBid called with bid:', bid);
		if (bid < 0 || bid > this.gameState.currentRound) {
			alert('Invalid bid!');
			return;
		}
		
		this.players[0].bid = bid;
		this.ui.biddingUI.hide();
		
		// Move to next player
		this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % 4;
		
		if (this.gameState.currentPlayer !== (this.gameState.dealer + 1) % 4) {
			this.makeAiBid();
		} else { // All bids are in
			this.transitionToPlay();
		}
	}

	makeAiBid() {
		console.log('makeAiBid called');
		const aiIndex = this.gameState.currentPlayer - 1;
		const aiPlayer = this.players[this.gameState.currentPlayer];
		
		const bid = AIPlayer.calculateBid(
			aiPlayer.hand,
			this.gameState.trumpCard.suit,
			this.gameState.currentRound,
			this.trickEvaluator
		);
		
		aiPlayer.bid = bid;
		this.ui.updateScoreDisplay();
		
		// Move to next player
		this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % 4;
		
		// Check if we've come full circle to the player after dealer
		if (this.gameState.currentPlayer === (this.gameState.dealer + 1) % 4) {
			console.log('Bidding complete in AI phase, transitioning to play');
			this.transitionToPlay();
		} else if (this.gameState.currentPlayer === 0) {
			this.ui.biddingUI.show();
		} else {
			setTimeout(() => this.makeAiBid(), this.gameState.getDelay());
		}
	}

	// Helper method: handle transition from bidding to play phase
	transitionToPlay() {
		console.log('Transitioning to play phase');
		this.gameState.biddingPhase = false;
		this.ui.renderGameState();
		
		// If it's an AI's turn to play first, kick off their play
		if (this.gameState.currentPlayer !== 0) {
			console.log('Starting AI play');
			setTimeout(() => this.aiPlay(), this.gameState.getDelay());
		}
	}

    playCard(index) {
        if (this.gameState.currentPlayer !== 0 || this.gameState.biddingPhase) return;
        
        const card = this.players[0].removeCard(index);
        this.gameState.currentTrick.push({ card, player: 0 });
        
        this.ui.renderGameState();
        
        if (this.gameState.currentTrick.length === 4) {
            setTimeout(() => this.evaluateTrick(), this.gameState.getDelay());
        } else {
            this.gameState.currentPlayer = 1;
            setTimeout(() => this.aiPlay(), this.gameState.getDelay());
        }
    }

	aiPlay() {
		const aiIndex = this.gameState.currentPlayer - 1;
		const aiPlayer = this.players[this.gameState.currentPlayer];
		
		const selectedCard = AIPlayer.selectCard(
			aiPlayer.hand,
			this.gameState.currentTrick,
			this.gameState.trumpCard.suit,
			this.trickEvaluator
		);
		
		if (!selectedCard) {
			console.error('AI failed to select a card');
			return;
		}
		
		const cardIndex = aiPlayer.hand.indexOf(selectedCard);
		const card = aiPlayer.removeCard(cardIndex);
		
		this.gameState.currentTrick.push({ card, player: this.gameState.currentPlayer });
		
		if (this.gameState.currentTrick.length === 4) {
			this.ui.renderGameState();
			setTimeout(() => this.evaluateTrick(), this.gameState.getDelay());
		} else {
			this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % 4;
			this.ui.renderGameState();
			
			if (this.gameState.currentPlayer !== 0) {
				setTimeout(() => this.aiPlay(), this.gameState.getDelay());
			}
		}
	}

    evaluateTrick() {
        const winningPlayer = this.trickEvaluator.evaluateTrick(
            this.gameState.currentTrick,
            this.gameState.trumpCard.suit
        );
        
        // Update tricks won
        this.players[winningPlayer].tricks++;
        this.gameState.currentTrick = [];
        this.gameState.currentPlayer = winningPlayer;
        
        // Check if round is over
        if (this.gameState.isRoundOver(this.players)) {
            setTimeout(() => this.endRound(), this.gameState.getDelay());
        } else {
            this.ui.renderGameState();
            if (winningPlayer !== 0) {
                setTimeout(() => this.aiPlay(), this.gameState.getDelay());
            }
        }
    }

    endRound() {
        // Calculate scores
        this.players.forEach(player => {
            const roundScore = player.bid === player.tricks ? 10 + player.bid : 0;
            player.roundScores.push(roundScore);
            player.score += roundScore;
        });
        
        // Add to round history
        this.gameState.addToRoundHistory(this.players);
        this.ui.updateScoreDisplay();
        
        // Move dealer button
        this.gameState.rotateDealer();
        
        if (this.gameState.currentRound < this.gameState.maxRounds) {
            this.gameState.currentRound++;
            setTimeout(() => this.startNewRound(), this.gameState.getDelay());
        } else {
            // Game over
            const winner = this.players.reduce((prev, current) => 
                (prev.score > current.score) ? prev : current
            );
            this.ui.showEndGameScreen(winner);
        }
    }
}