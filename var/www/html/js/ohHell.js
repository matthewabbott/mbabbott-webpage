class OhHellGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.playerHand = [];
        this.aiHand = [];
        this.currentTrick = [];
        this.trumpCard = null;
        this.currentRound = 1;
        this.playerBid = 0;
        this.aiBid = 0;
        this.playerTricks = 0;
        this.aiTricks = 0;
        this.playerScore = 0;
        this.aiScore = 0;
        this.playerTurn = true;
        this.biddingPhase = true;
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.container.innerHTML = `
            <div class="game-container" style="padding: 20px; font-family: Arial, sans-serif;">
                <div class="scoreboard" style="margin-bottom: 20px;">
                    <h2>Round ${this.currentRound}</h2>
                    <div>Player Score: <span id="player-score">0</span></div>
                    <div>AI Score: <span id="ai-score">0</span></div>
                </div>
                <div class="trump-display" style="margin-bottom: 20px;">
                    <h3>Trump Card: <span id="trump-card"></span></h3>
                </div>
                <div class="bidding-section" id="bidding-section" style="margin-bottom: 20px;">
                    <h3>Bidding Phase</h3>
                    <div>Cards in hand: <span id="hand-size">0</span></div>
                    <div>Your bid: <input type="number" id="bid-input" min="0" max="13" value="0" style="width: 60px;">
                    <button id="submit-bid">Submit Bid</button></div>
                    <div>AI bid: <span id="ai-bid">-</span></div>
                </div>
                <div class="trick-info" style="margin-bottom: 20px;">
                    <div>Your tricks: <span id="player-tricks">0</span></div>
                    <div>AI tricks: <span id="ai-tricks">0</span></div>
                </div>
                <div class="current-trick" style="min-height: 150px; margin-bottom: 20px;">
                    <h3>Current Trick</h3>
                    <div id="trick-cards" style="display: flex; gap: 10px;"></div>
                </div>
                <div class="player-hand" id="player-hand" style="display: flex; gap: 10px;"></div>
            </div>
        `;
        
        this.setupEventListeners();
        this.startNewRound();
    }
    
    setupEventListeners() {
        const bidButton = document.getElementById('submit-bid');
        bidButton.addEventListener('click', () => this.submitBid());
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
    
    startNewRound() {
        this.playerHand = [];
        this.aiHand = [];
        this.currentTrick = [];
        this.playerTricks = 0;
        this.aiTricks = 0;
        this.biddingPhase = true;
        
        const deck = this.createDeck();
        const handSize = this.currentRound;
        
        // Deal cards
        for (let i = 0; i < handSize; i++) {
            this.playerHand.push(deck.pop());
            this.aiHand.push(deck.pop());
        }
        
        // Set trump card
        this.trumpCard = deck.pop();
        
        document.getElementById('hand-size').textContent = handSize;
        document.getElementById('trump-card').textContent = 
            `${this.trumpCard.value}${this.trumpCard.suit}`;
        
        this.renderPlayerHand();
        this.showBiddingPhase();
    }
    
    renderPlayerHand() {
        const handContainer = document.getElementById('player-hand');
        handContainer.innerHTML = '';
        
        this.playerHand.forEach((card, index) => {
            const cardElement = this.createCardElement(card);
            cardElement.style.cursor = this.biddingPhase ? 'default' : 'pointer';
            if (!this.biddingPhase) {
                cardElement.addEventListener('click', () => this.playCard(index));
            }
            handContainer.appendChild(cardElement);
        });
    }
    
    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.style.width = '100px';
        cardElement.style.height = '140px';
        cardElement.style.border = '1px solid black';
        cardElement.style.borderRadius = '5px';
        cardElement.style.display = 'flex';
        cardElement.style.justifyContent = 'center';
        cardElement.style.alignItems = 'center';
        cardElement.style.backgroundColor = 'white';
        cardElement.style.color = ['♥', '♦'].includes(card.suit) ? 'red' : 'black';
        cardElement.style.position = 'relative';
        cardElement.style.padding = '5px';
        
        cardElement.innerHTML = `
            <div style="position: absolute; top: 5px; left: 5px;">${card.value}${card.suit}</div>
            <div style="font-size: 24px;">${card.suit}</div>
            <div style="position: absolute; bottom: 5px; right: 5px; transform: rotate(180deg);">
                ${card.value}${card.suit}
            </div>
        `;
        
        return cardElement;
    }
    
    showBiddingPhase() {
        const biddingSection = document.getElementById('bidding-section');
        biddingSection.style.display = 'block';
        document.getElementById('ai-bid').textContent = '-';
    }
    
    submitBid() {
        const bidInput = document.getElementById('bid-input');
        this.playerBid = parseInt(bidInput.value);
        if (this.playerBid < 0 || this.playerBid > this.currentRound) {
            alert('Invalid bid!');
            return;
        }
        
        // Simple AI bid - random but tries to make total bids not equal hands
        this.aiBid = Math.floor(Math.random() * (this.currentRound + 1));
        document.getElementById('ai-bid').textContent = this.aiBid;
        
        this.biddingPhase = false;
        this.renderPlayerHand();
        this.playerTurn = true;
    }
    
    playCard(index) {
        if (!this.playerTurn || this.biddingPhase) return;
        
        const card = this.playerHand[index];
        if (!this.isCardPlayable(card)) {
            alert('You must follow suit if possible!');
            return;
        }
        
        // Player plays card
        this.currentTrick.push({ card, player: 'player' });
        this.playerHand.splice(index, 1);
        this.renderPlayerHand();
        this.playerTurn = false;
        
        // AI plays card
        setTimeout(() => this.aiPlay(), 500);
        
        this.renderTrick();
    }
    
    isCardPlayable(card) {
        if (this.currentTrick.length === 0) return true;
        
        const leadSuit = this.currentTrick[0].card.suit;
        if (card.suit === leadSuit) return true;
        
        // Check if player has any cards of lead suit
        return !this.playerHand.some(c => c.suit === leadSuit);
    }
    
    aiPlay() {
        // AI always plays first legal card
        let playedCard;
        if (this.currentTrick.length === 0) {
            playedCard = this.aiHand[0];
            this.aiHand.splice(0, 1);
        } else {
            const leadSuit = this.currentTrick[0].card.suit;
            const suitCards = this.aiHand.filter(c => c.suit === leadSuit);
            if (suitCards.length > 0) {
                playedCard = suitCards[0];
                this.aiHand.splice(this.aiHand.indexOf(playedCard), 1);
            } else {
                playedCard = this.aiHand[0];
                this.aiHand.splice(0, 1);
            }
        }
        
        this.currentTrick.push({ card: playedCard, player: 'ai' });
        this.renderTrick();
        
        if (this.currentTrick.length === 2) {
            setTimeout(() => this.evaluateTrick(), 1000);
        } else {
            this.playerTurn = true;
        }
    }
    
    renderTrick() {
        const trickContainer = document.getElementById('trick-cards');
        trickContainer.innerHTML = '';
        this.currentTrick.forEach(play => {
            trickContainer.appendChild(this.createCardElement(play.card));
        });
    }
    
    evaluateTrick() {
        const leadCard = this.currentTrick[0].card;
        const followCard = this.currentTrick[1].card;
        
        let winner;
        if (followCard.suit === this.trumpCard.suit && leadCard.suit !== this.trumpCard.suit) {
            winner = this.currentTrick[1].player;
        } else if (followCard.suit !== leadCard.suit) {
            winner = this.currentTrick[0].player;
        } else {
            const leadValue = this.values.indexOf(leadCard.value);
            const followValue = this.values.indexOf(followCard.value);
            winner = followValue > leadValue ? this.currentTrick[1].player : this.currentTrick[0].player;
        }
        
        if (winner === 'player') {
            this.playerTricks++;
        } else {
            this.aiTricks++;
        }
        
        document.getElementById('player-tricks').textContent = this.playerTricks;
        document.getElementById('ai-tricks').textContent = this.aiTricks;
        
        this.currentTrick = [];
        this.renderTrick();
        
        if (this.playerHand.length === 0) {
            setTimeout(() => this.endRound(), 500);
        } else {
            this.playerTurn = winner === 'player';
            if (!this.playerTurn) {
                setTimeout(() => this.aiPlay(), 500);
            }
        }
    }
    
    endRound() {
        // Score the round
        if (this.playerTricks === this.playerBid) {
            this.playerScore += 10 + this.playerTricks;
        }
        if (this.aiTricks === this.aiBid) {
            this.aiScore += 10 + this.aiTricks;
        }
        
        document.getElementById('player-score').textContent = this.playerScore;
        document.getElementById('ai-score').textContent = this.aiScore;
        
        this.currentRound++;
        
        if (this.currentRound <= 7) {  // Play up to 7 cards
            setTimeout(() => this.startNewRound(), 1000);
        } else {
            alert(`Game Over!\nFinal Scores:\nPlayer: ${this.playerScore}\nAI: ${this.aiScore}`);
        }
    }
}