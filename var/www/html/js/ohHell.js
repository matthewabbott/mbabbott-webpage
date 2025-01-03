class OhHellGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.playerHand = [];
        this.aiHands = [[], [], []];
        this.currentTrick = [];
        this.trumpCard = null;
        this.currentRound = 1;
        this.bids = [0, 0, 0, 0];
        this.tricks = [0, 0, 0, 0];
        this.scores = [0, 0, 0, 0];
        this.roundHistory = [];
        this.currentPlayer = 0;
        this.dealer = 3;
        this.biddingPhase = true;
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.playerNames = ['You', 'West AI', 'North AI', 'East AI'];
        
        this.isDragging = false;
        this.draggedCard = null;
        this.dragOffset = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        
        this.initializeGame();
    }
    
    initializeGame() {
        // Clear the container and set up the main game layout
        this.container.innerHTML = `
            <div class="game-container" style="padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="text-align: center;">Round ${this.currentRound}</h2>
                
                <!-- Game board -->
                <div style="position: relative; min-height: 600px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0; padding: 20px;">
                    <!-- Top AI -->
                    <div style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); text-align: center;">
                        <div id="top-ai-info"></div>
                        <div id="top-ai-cards"></div>
                    </div>
                    
                    <!-- Left AI -->
                    <div style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%); text-align: center;">
                        <div id="left-ai-info"></div>
                        <div id="left-ai-cards"></div>
                    </div>
                    
                    <!-- Right AI -->
                    <div style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); text-align: center;">
                        <div id="right-ai-info"></div>
                        <div id="right-ai-cards"></div>
                    </div>
                    
                    <!-- Center area -->
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                        <!-- Trump card and deck -->
                        <div id="trump-deck" style="margin-bottom: 20px;"></div>
                        
                        <!-- Trick area -->
                        <div id="trick-area" style="width: 300px; height: 200px; border: 2px dashed #ccc; border-radius: 8px;"></div>
                    </div>
                    
                    <!-- Player area -->
                    <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); text-align: center;">
                        <div id="player-info"></div>
                        <div id="player-hand" style="min-height: 150px;"></div>
                    </div>
                </div>
                
                <!-- Bidding interface -->
                <div id="bidding-interface" style="text-align: center; margin-top: 20px;">
                    <h3>Place Your Bid</h3>
                    <input type="number" id="bid-input" min="0" max="13" value="0" style="width: 60px;">
                    <button id="submit-bid">Submit Bid</button>
                </div>
                
                <!-- Score summary -->
                <div class="score-table-container">
                    <table class="score-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="padding: 8px; border: 1px solid #ddd;">Player</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Bid</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Tricks</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Score</th>
                            </tr>
                        </thead>
                        <tbody id="score-summary"></tbody>
                    </table>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
        this.startNewRound();
    }
    
    
    setupEventListeners() {
        document.getElementById('submit-bid')?.addEventListener('click', () => this.submitBid());
        
        // Setup drag events on container
        this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.container.addEventListener('mouseup', () => this.handleMouseUp());
    }
    
    updateScoreDisplay() {
        const summaryTable = document.getElementById('score-summary');
        summaryTable.innerHTML = this.playerNames.map((name, i) => `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${name}${i === this.dealer ? ' (Dealer)' : ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${this.scores[i]}</td>
            </tr>
        `).join('');
        
        const historyTable = document.getElementById('history-table');
        historyTable.innerHTML = this.roundHistory.flatMap(round => 
            this.playerNames.map((name, i) => `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${round.round}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${round.bids[i]}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${round.tricks[i]}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${round.roundScores[i]}</td>
                </tr>
            `)
        ).join('');
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
	
    renderTrumpDeck(remainingCards) {
        const trumpDeck = document.getElementById('trump-deck');
        trumpDeck.innerHTML = '';
        
        // Create deck appearance
        for (let i = 0; i < Math.min(remainingCards, 5); i++) {
            const deckCard = document.createElement('div');
            deckCard.className = 'deck-card';
            deckCard.style.position = 'absolute';
            deckCard.style.width = '100px';
            deckCard.style.height = '140px';
            deckCard.style.border = '1px solid #000';
            deckCard.style.borderRadius = '5px';
            deckCard.style.backgroundColor = '#fff';
            deckCard.style.transform = `translateY(${i * -1}px)`;
            deckCard.style.backgroundImage = 'linear-gradient(45deg, #fff 45%, #ddd 50%, #fff 55%)';
            trumpDeck.appendChild(deckCard);
        }
        
        // Add trump card on top
        const trumpCardElement = this.createCardElement(this.trumpCard);
        trumpCardElement.style.position = 'absolute';
        trumpCardElement.style.transform = 'translateY(-6px)';
        trumpDeck.appendChild(trumpCardElement);
    }

	updatePlayerInfo() {
        const playerInfo = document.getElementById('player-info');
        if (playerInfo) {
            playerInfo.innerHTML = `
                <div>Your Tricks: ${this.tricks[0]}</div>
                <div>Your Bid: ${this.bids[0]}</div>
                ${this.currentPlayer === 0 && !this.biddingPhase ? '<div style="color: #0073b1; font-weight: bold;">Your Turn!</div>' : ''}
            `;
        }
    }

    renderGameState() {
        // Render all hands and trick area
        this.renderPlayerHand();
        this.renderAiHands();
        this.renderTrick();
        this.updatePlayerInfo();
        this.updateScoreDisplay();
    }
    
    createCardElement(card, index = null) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.style.width = '100px';
        cardElement.style.height = '140px';
        cardElement.style.border = '1px solid #000';
        cardElement.style.borderRadius = '5px';
        cardElement.style.backgroundColor = '#fff';
        cardElement.style.position = 'relative';
        cardElement.style.display = 'inline-block';
        cardElement.style.margin = '0 5px';
        cardElement.style.color = ['♥', '♦'].includes(card.suit) ? 'red' : 'black';
        cardElement.style.transition = 'transform 0.2s';
        
        if (index !== null) {
            cardElement.dataset.index = index;
        }
        
        cardElement.innerHTML = `
            <div style="position: absolute; top: 5px; left: 5px;">${card.value}${card.suit}</div>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px;">${card.suit}</div>
            <div style="position: absolute; bottom: 5px; right: 5px; transform: rotate(180deg);">${card.value}${card.suit}</div>
        `;
        
        return cardElement;
    }
    
	renderPlayerHand() {
        const handContainer = document.getElementById('player-hand');
        handContainer.innerHTML = '';
        
        this.playerHand.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            
            if (!this.biddingPhase) {
                cardElement.style.cursor = 'move';
                cardElement.addEventListener('mousedown', (e) => this.handleCardMouseDown(e, index));
            }
            
            handContainer.appendChild(cardElement);
        });
    }
    
    renderAiHands() {
        // Render hidden cards for AI players
        const aiAreas = ['left', 'top', 'right'];
        aiAreas.forEach((position, index) => {
            const aiContainer = document.getElementById(`${position}-ai-cards`);
            const aiInfo = document.getElementById(`${position}-ai-info`);
            aiContainer.innerHTML = '';
            aiInfo.innerHTML = `
                <div>Tricks: ${this.tricks[index + 1]}</div>
                <div>Bid: ${this.bids[index + 1]}</div>
            `;
            
            this.aiHands[index].forEach(() => {
                const hiddenCard = document.createElement('div');
                hiddenCard.className = 'card hidden-card';
                hiddenCard.style.width = position === 'left' || position === 'right' ? '140px' : '100px';
                hiddenCard.style.height = position === 'left' || position === 'right' ? '100px' : '140px';
                hiddenCard.style.border = '1px solid #000';
                hiddenCard.style.borderRadius = '5px';
                hiddenCard.style.display = 'inline-block';
                hiddenCard.style.margin = '5px';
                hiddenCard.style.backgroundImage = 'linear-gradient(45deg, #fff 45%, #ddd 50%, #fff 55%)';
                
                // Rotate cards for left and right AI
                if (position === 'left' || position === 'right') {
                    hiddenCard.style.transform = 'rotate(90deg)';
                }
                
                aiContainer.appendChild(hiddenCard);
            });
        });
    }
    
    handleCardMouseDown(e, index) {
        if (this.currentPlayer !== 0 || this.biddingPhase) return;
        
        const card = this.playerHand[index];
        if (!this.isCardPlayable(card)) {
            alert('You must follow suit if possible!');
            return;
        }
        
        this.isDragging = true;
        this.draggedCard = { card, index };
        const rect = e.target.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        this.lastMousePos = {
            x: e.clientX,
            y: e.clientY
        };
        
        // Create floating card
        const floatingCard = this.createCardElement(card);
        floatingCard.id = 'floating-card';
        floatingCard.style.position = 'fixed';
        floatingCard.style.zIndex = 1000;
        floatingCard.style.pointerEvents = 'none';
        document.body.appendChild(floatingCard);
        
        this.updateFloatingCardPosition(e);
    }
    
    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        this.updateFloatingCardPosition(e);
        
        // Calculate movement direction for tilt
        const deltaX = e.clientX - this.lastMousePos.x;
        const tiltAmount = Math.max(Math.min(deltaX * 0.5, 15), -15);
        
        const floatingCard = document.getElementById('floating-card');
        if (floatingCard) {
            floatingCard.style.transform = `rotate(${tiltAmount}deg)`;
        }
        
        this.lastMousePos = {
            x: e.clientX,
            y: e.clientY
        };
    }
    
    updateFloatingCardPosition(e) {
        const floatingCard = document.getElementById('floating-card');
        if (floatingCard) {
            floatingCard.style.left = `${e.clientX - this.dragOffset.x}px`;
            floatingCard.style.top = `${e.clientY - this.dragOffset.y}px`;
        }
    }
    
    handleMouseUp() {
        if (!this.isDragging) return;
        
        const floatingCard = document.getElementById('floating-card');
        if (floatingCard) {
            const trickArea = document.getElementById('trick-area');
            const trickRect = trickArea.getBoundingClientRect();
            const cardRect = floatingCard.getBoundingClientRect();
            
            // Check if card is dropped in trick area
            if (this.isOverlapping(cardRect, trickRect)) {
                this.playCard(this.draggedCard.index);
            }
            
            floatingCard.remove();
        }
        
        this.isDragging = false;
        this.draggedCard = null;
    }
    
    isOverlapping(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }
    
    renderTrick() {
        const trickArea = document.getElementById('trick-area');
        trickArea.innerHTML = '';
        
        // Position cards in diamond formation
        const positions = [
            { left: '50%', top: '75%', transform: 'translate(-50%, -50%)' }, // Bottom (Player)
            { left: '25%', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' }, // Left
            { left: '50%', top: '25%', transform: 'translate(-50%, -50%)' }, // Top
            { left: '75%', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' }  // Right
        ];
        
        this.currentTrick.forEach((play) => {
            const cardElement = this.createCardElement(play.card);
            cardElement.style.position = 'absolute';
            Object.assign(cardElement.style, positions[play.player]);
            trickArea.appendChild(cardElement);
        });
    }
    
	showBiddingInterface() {
        const biddingInterface = document.getElementById('bidding-interface');
        if (biddingInterface) {
            biddingInterface.style.display = 'block';
            const bidInput = document.getElementById('bid-input');
            if (bidInput) {
                bidInput.max = this.currentRound;
                bidInput.value = '0';
            }
            // Add debug output
            console.log('Showing bidding interface');
            console.log('Current round:', this.currentRound);
            console.log('Player hand:', this.playerHand);
        } else {
            console.error('Bidding interface not found');
        }
    }

    startNewRound() {
        console.log('Starting new round:', this.currentRound);
        this.playerHand = [];
        this.aiHands = [[], [], []];
        this.currentTrick = [];
        this.tricks = [0, 0, 0, 0];
        this.bids = [0, 0, 0, 0];
        this.biddingPhase = true;
        
        // Deal cards
        const deck = this.createDeck();
        const handSize = this.currentRound;
        console.log('Dealing', handSize, 'cards per player');
        
        // Deal to each player starting with the player after the dealer
        let currentPlayer = (this.dealer + 1) % 4;
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
        
        // Set trump card and show deck
        this.trumpCard = deck.pop();
        this.renderTrumpDeck(deck.length);
        
        this.currentPlayer = (this.dealer + 1) % 4;
        
        // Debug output
        console.log('Player hand after dealing:', this.playerHand);
        console.log('Current player:', this.currentPlayer);
        
        // Render the game state
        this.renderGameState();
        
        // Show bidding interface or start AI bidding
        if (this.currentPlayer === 0) {
            this.showBiddingInterface();
        } else {
            this.makeAiBid();
        }
    }
    
    makeAiBid() {
        // Simple AI bidding strategy
        const aiIndex = this.currentPlayer - 1;
        const trumpSuit = this.trumpCard.suit;
        const hand = this.aiHands[aiIndex];
        
        let bid = 0;
        hand.forEach(card => {
            if (card.suit === trumpSuit || card.value === 'A' || card.value === 'K') {
                bid++;
            }
        });
        
        bid = Math.min(bid, this.currentRound);
        this.bids[this.currentPlayer] = bid;
        
        this.updateScoreDisplay();
        this.currentPlayer = (this.currentPlayer + 1) % 4;
        
        if (this.currentPlayer === 0) {
            this.showBiddingInterface();
        } else {
            setTimeout(() => this.makeAiBid(), 1000);
        }
    }
    
    submitBid() {
        const bidInput = document.getElementById('bid-input');
        const bid = parseInt(bidInput.value);
        
        if (bid < 0 || bid > this.currentRound) {
            alert('Invalid bid!');
            return;
        }
        
        this.bids[0] = bid;
        document.getElementById('bidding-interface').style.display = 'none';
        this.biddingPhase = false;
        this.renderGameState();
        
        if (this.currentPlayer !== 0) {
            this.makeAiBid();
        }
    }
    
    playCard(index) {
        if (this.currentPlayer !== 0 || this.biddingPhase) return;
        
        const card = this.playerHand[index];
        this.currentTrick.push({ card, player: 0 });
        this.playerHand.splice(index, 1);
        this.renderGameState();
        
        this.currentPlayer = 1;
        setTimeout(() => this.aiPlay(), 1000);
    }
    
    aiPlay() {
        const aiIndex = this.currentPlayer - 1;
        const aiHand = this.aiHands[aiIndex];
        
        // Play first legal card
        let playIndex = 0;
        if (this.currentTrick.length > 0) {
            const leadSuit = this.currentTrick[0].card.suit;
            const suitCards = aiHand.filter(c => c.suit === leadSuit);
            if (suitCards.length > 0) {
                playIndex = aiHand.indexOf(suitCards[0]);
            }
        }
        
        const card = aiHand[playIndex];
        this.currentTrick.push({ card, player: this.currentPlayer });
        aiHand.splice(playIndex, 1);
        this.renderGameState();
        
        if (this.currentTrick.length === 4) {
            setTimeout(() => this.evaluateTrick(), 1000);
        } else {
            this.currentPlayer = (this.currentPlayer + 1) % 4;
            if (this.currentPlayer !== 0) {
                setTimeout(() => this.aiPlay(), 1000);
            }
        }
    }
    
    evaluateTrick() {
        const leadSuit = this.currentTrick[0].card.suit;
        let winner = 0;
        let highestValue = this.values.indexOf(this.currentTrick[0].card.value);
        let trumpInTrick = false;
        
        this.currentTrick.forEach((play, index) => {
            const isTrump = play.card.suit === this.trumpCard.suit;
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
        
        this.tricks[this.currentTrick[winner].player]++;
        this.currentPlayer = this.currentTrick[winner].player;
        this.currentTrick = [];
        this.renderGameState();
        
        if (this.playerHand.length === 0) {
            setTimeout(() => this.endRound(), 1000);
        } else if (this.currentPlayer !== 0) {
            setTimeout(() => this.aiPlay(), 1000);
        }
    }
    
    endRound() {
        // Calculate scores
        const roundScores = this.bids.map((bid, index) => {
            if (bid === this.tricks[index]) {
                return 10 + bid;
            }
            return 0;
        });
        
        // Update total scores
        this.scores = this.scores.map((score, index) => score + roundScores[index]);
        
        // Add to round history
        this.roundHistory.push({
            round: this.currentRound,
            bids: [...this.bids],
            tricks: [...this.tricks],
            roundScores
        });
        
        this.updateScoreDisplay();
        
        // Move dealer button
        this.dealer = (this.dealer + 1) % 4;
        
        if (this.currentRound < 7) {
            this.currentRound++;
            setTimeout(() => this.startNewRound(), 1000);
        } else {
            const winner = this.scores.indexOf(Math.max(...this.scores));
            alert(`Game Over! ${this.playerNames[winner]} wins with ${this.scores[winner]} points!`);
        }
    }
    
    isCardPlayable(card) {
        if (this.currentTrick.length === 0) return true;
        const leadSuit = this.currentTrick[0].card.suit;
        if (card.suit === leadSuit) return true;
        return !this.playerHand.some(c => c.suit === leadSuit);
    }
}