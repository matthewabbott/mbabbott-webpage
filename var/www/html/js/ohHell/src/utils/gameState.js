// src/utils/gameState.js
export class GameState {
    constructor() {
        this.currentRound = 1;
        this.maxRounds = 7;
        this.currentPlayer = 0;
        this.dealer = Math.floor(Math.random() * 4);
        this.biddingPhase = true;
        this.currentTrick = [];
        this.trumpCard = null;
        this.roundHistory = [];
        this.gameOver = false;
        this.isDragging = false;
        this.draggedCard = null;
        this.selectedCard = null;
        this.gameSpeed = 1;
        this.BASE_DELAY = 1000;
    }

    nextPlayer() {
        this.currentPlayer = (this.currentPlayer + 1) % 4;
        return this.currentPlayer;
    }

    rotateDealer() {
        this.dealer = (this.dealer + 1) % 4;
    }

    startNewRound() {
        this.currentTrick = [];
        this.biddingPhase = true;
        this.currentPlayer = (this.dealer + 1) % 4;
        return this.currentPlayer;
    }

    addToRoundHistory(players) {
        this.roundHistory.push({
            round: this.currentRound,
            bids: players.map(p => p.bid),
            tricks: players.map(p => p.tricks),
            roundScores: players.map(p => p.roundScores[p.roundScores.length - 1])
        });
    }

    isRoundOver(players) {
        return players.every(player => player.hand.length === 0);
    }

    isGameOver() {
        return this.currentRound > this.maxRounds;
    }

    getDelay(baseDelay = this.BASE_DELAY) {
        return baseDelay / this.gameSpeed;
    }
}