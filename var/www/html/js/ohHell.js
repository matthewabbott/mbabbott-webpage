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
        this.dealer = Math.floor(Math.random() * 4);
        this.biddingPhase = true;
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.playerNames = ['You', 'West AI', 'North AI', 'East AI'];
        
        this.isDragging = false;
        this.draggedCard = null;
        this.dragOffset = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        this.selectedCard = null;
		
        this.gameSpeed = 1; // Default speed multiplier
        this.BASE_DELAY = 1000; // Base delay in milliseconds
		
        this.initializeGame();
        this.setupCardHandling();
    }

	initializeGame() {
		this.container.innerHTML = `
			<style>
				.game-layout {
                    display: flex;
                    min-height: 80vh;
                    width: 100%;
                    gap: 20px;
                }
                .sidebar {
                    width: 25%;
                    min-width: 250px;
                    max-width: 300px;
                    background-color: #f8f3e9;
                    border-right: 1px solid #d4c5b9;
                    padding: 20px;
                    box-sizing: border-box;
                    overflow-y: auto;
                }
				.main-area {
					flex: 1;
					position: relative;
					padding: 20px;
					box-sizing: border-box;
					display: flex;
					flex-direction: column;
					min-width: 0;
					width: 100%;
				}

				.center-area {
					position: relative;
					flex: 1;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					min-height: 0;
					padding: 20px 0;
					z-index: 1;
					overflow: visible;
					width: 100%;
				}

				.top-ai {
					position: relative;
					width: 100%;
					text-align: center;
					margin-bottom: 20px;
					z-index: 2;
				}

				.side-ai-container {
					width: 15%;
					min-width: 100px;
					max-width: 140px;
					position: absolute;
					top: 50%;
					transform: translateY(-50%);
					z-index: 2;
				}
				.side-ai-info {
					position: absolute;
					width: 100%;
					text-align: center;
					z-index: 2;
				}
				.side-ai-cards {
					margin-top: 60px;
					display: flex;
					flex-direction: column;
					align-items: center;
				}
				.side-cards-wrapper {
					display: flex;
					justify-content: center;
					max-width: 100px;
					position: relative;
				}
				.hidden-card.overlapped {
					margin: -80px 0 0 0;
				}
				#trick-area {
					width: 100%;
					max-width: 800px;
					aspect-ratio: 4/3;
					border: 1px solid #d4c5b9;
					border-radius: 12px;
					margin: 0 auto;
					position: relative;
					z-index: 2;
					background-color: rgba(248, 243, 233, 0.5);
				}
                #card-slot {
                    display: none;
                    position: absolute;
                    left: 50%;
                    bottom: 10px;
                    transform: translateX(-50%);
                    width: 100px;
                }

				.player-area {
					position: relative;
					margin-top: 20px;
					text-align: center;
					width: 100%;
				}

				.score-table {
					width: 100%;
					border-collapse: collapse;
				}
				.score-table th {
					position: sticky;
					top: 0;
					background-color: #f8f9fa;
					z-index: 1;
				}
				.score-table td, .score-table th {
					padding: 8px;
					border: 1px solid #ddd;
				}

                button {
                    background-color: #6b4d3c;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-family: 'Crimson Text', Georgia, serif;
                }
                button:hover {
                    background-color: #2c1810;
                }
				input[type="number"] {
					padding: 8px;
					border: 1px solid #ddd;
					border-radius: 4px;
					margin-right: 10px;
				}

				#floating-card {
					pointer-events: none;
					box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
				}
                .speed-control {
                    margin-top: 20px;
                    padding: 15px;
                    border-top: 1px solid #d4c5b9;
                }
                
                .speed-slider {
                    width: 100%;
                    margin: 10px 0;
                }
                
                .speed-label {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                }
				
				@media (max-width: 1024px) {
                    .game-layout {
                        flex-direction: column;
                    }
                    .sidebar {
                        width: 100%;
                        max-width: none;
                        border-right: none;
                        border-bottom: 1px solid #d4c5b9;
                    }
                    .main-area {
                        height: 70vh;
                    }
                }
            </style>

			<div class="game-layout">
				<!-- SIDEBAR: Score summary & Round history -->
				<div class="sidebar">
					<h2>Score Summary</h2>
					<div class="score-table-container">
						<table class="score-table">
							<thead>
								<tr>
									<th>Player</th>
									<th>Bid</th>
									<th>Tricks</th>
									<th>Score</th>
								</tr>
							</thead>
							<tbody id="score-summary"></tbody>
						</table>
					</div>

                    <!-- Speed Control -->
                    <div class="speed-control">
                        <h3>Game Speed</h3>
                        <div class="speed-label">
                            <span>Slower</span>
                            <span>Faster</span>
                        </div>
                        <input 
                            type="range" 
                            id="speed-slider" 
                            class="speed-slider"
                            min="0.2" 
                            max="20" 
                            step="0.2" 
                            value="1"
                        >
                        <div id="speed-value" style="text-align: center;">1x</div>
                    </div>

					<h3 style="margin-top: 20px;">Round History</h3>
					<div class="score-table-container">
						<table class="score-table">
							<thead>
								<tr>
									<th>Round</th>
									<th>Player</th>
									<th>Bid</th>
									<th>Tricks</th>
									<th>Score</th>
								</tr>
							</thead>
							<tbody id="history-table"></tbody>
						</table>
					</div>
				</div>

				<!-- MAIN AREA: AI, Trick Table, Player Hand -->
				<div class="main-area">
					<!-- Top AI (North) -->
					<div class="top-ai">
						<div id="top-ai-info"></div>
						<div id="top-ai-cards"></div>
					</div>

					<!-- Left AI -->
					<div class="side-ai-container" style="left: 5%;">
						<div id="left-ai-info" class="side-ai-info"></div>
						<div id="left-ai-cards" class="side-ai-cards"></div>
					</div>

					<!-- Right AI -->
					<div class="side-ai-container" style="right: 5%;">
						<div id="right-ai-info" class="side-ai-info"></div>
						<div id="right-ai-cards" class="side-ai-cards"></div>
					</div>

					<!-- Trump Display (top-right) -->
					<div style="position: absolute; top: 20px; right: 20px; text-align: center; z-index: 2;">
						<div style="margin-bottom: 10px; font-weight: bold;">Trump Suit:</div>
						<div id="trump-display"></div>
					</div>

					<!-- Center Area for Bidding + Trick Table -->
					<div class="center-area">

						<!-- Trick Area -->
						<div id="trick-area">
							<div id="trick-positions"></div>
							<div id="card-slot">
								<div style="position: relative;">
									<div style="
										height: 140px; border: 2px dashed #0073b1; border-radius: 8px; 
										background: rgba(0, 115, 177, 0.1);
										display: flex; align-items: center; justify-content: center; color: #0073b1;">
										Drop card here
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Player Area (bottom center) -->
					<div class="player-area">
						<div id="player-info"></div>
						<div id="player-hand"></div>
					</div>
				</div>
			</div>
		`;
		const handContainer = document.getElementById('player-hand');
		
		console.log("hand container real? " + (handContainer !== null));

        this.setupGlobalUI();
        this.setupBiddingInterface();
        this.setupEventListeners();
        this.startNewRound();
	}

	setupGlobalUI() {
		// Create the confirmation container
		const cardConfirmation = document.createElement('div');
		cardConfirmation.id = 'card-confirmation';
		cardConfirmation.style.display = 'none';
		cardConfirmation.style.position = 'absolute';
		cardConfirmation.style.zIndex = '999999'; 
		cardConfirmation.style.background = '#fff';
		cardConfirmation.style.border = '1px solid #ccc';
		cardConfirmation.style.borderRadius = '4px';
		cardConfirmation.style.padding = '8px';
		cardConfirmation.innerHTML = `
			<button id="confirm-card" style="margin-right: 8px;">Play</button>
			<button id="cancel-card" style="background-color: #666; color: #fff;">Cancel</button>
		`;

		// Append to body
		document.body.appendChild(cardConfirmation);
	}

    setupEventListeners() {
        const bidButton = document.getElementById('submit-bid');
        if (bidButton) {
            bidButton.addEventListener('click', () => this.submitBid());
        }
        
        // Setup drag events on container
        this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.container.addEventListener('mouseup', () => this.handleMouseUp());
        document.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Look man, this just helps okay. 
        this.setupCardHandling();
		
		// Add speed slider listener
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                this.gameSpeed = parseFloat(e.target.value);
                speedValue.textContent = `${this.gameSpeed}x`;
            });
        }
		
		window.addEventListener('resize', () => {
			this.renderTrick();
			this.renderPlayerHand();
			this.renderAiHands();
		});
    }
	
	getDelay(baseDelay = this.BASE_DELAY) {
        return baseDelay / this.gameSpeed;
    }

    setupCardHandling() {
        // Set up event listeners for card confirmation
        const confirmButton = document.getElementById('confirm-card');
        const cancelButton = document.getElementById('cancel-card');
        
        if (confirmButton) {
            confirmButton.addEventListener('click', () => {
                if (this.selectedCard !== null) {
                    this.playCard(this.selectedCard);
                    this.clearSelectedCard();
                }
            });
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                this.clearSelectedCard();
				this.showCardSlot();
            });
        }
    }

    setupBiddingInterface() {
        const biddingEl = document.createElement('div');
        biddingEl.id = 'bidding-interface';
        biddingEl.style.position = 'absolute';
        biddingEl.style.zIndex = '999999';
        biddingEl.style.display = 'none';
        biddingEl.style.background = '#fff';
        biddingEl.style.borderRadius = '12px';
        biddingEl.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        biddingEl.style.padding = '20px';
        biddingEl.style.border = '1px solid #d4c5b9';
        biddingEl.style.left = '50%';
        biddingEl.style.top = '30%';
        biddingEl.style.transform = 'translate(-50%, -50%)';
        biddingEl.style.fontFamily = "'Crimson Text', Georgia, serif";

        biddingEl.innerHTML = `
            <h3 style="color: #2c1810; margin-top: 0;">Place Your Bid</h3>
            <p>Cards in hand: <span id="cards-in-hand">0</span></p>
            <p>Trump suit: <span id="trump-reminder"></span></p>
            <input type="number" id="bid-input" min="0" max="13" value="0" style="border: 1px solid #d4c5b9; border-radius: 8px;">
            <button id="submit-bid">Submit Bid</button>
        `;

        document.body.appendChild(biddingEl);
    }
	
    updateScoreDisplay() {
        const summaryTable = document.getElementById('score-summary');
        summaryTable.innerHTML = this.playerNames.map((name, i) => `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${name}${i === this.dealer ? ' (Dealer)' : ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${this.bids[i]}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${this.tricks[i]}</td>
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

    updateTrumpDisplay() {
        const trumpDisplay = document.getElementById('trump-display');
        const trumpReminder = document.getElementById('trump-reminder');
        if (this.trumpCard) {
            const trumpElement = this.createCardElement(this.trumpCard);
            trumpElement.style.transform = 'scale(0.8)';
            trumpDisplay.innerHTML = '';
            trumpDisplay.appendChild(trumpElement);
            if (trumpReminder) {
                trumpReminder.textContent = `${this.trumpCard.suit}`;
            }
        }
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

        // Show card slot whenever it's player's turn and not in bidding phase
        if (this.currentPlayer === 0 && !this.biddingPhase) {
			this.showCardSlot();
        } else {
			// Hide slot during AI turns
			this.hideCardSlot();
		}
    }

    showCardSlot() {
        const cardSlot = document.getElementById('card-slot');
        if (cardSlot) {
            cardSlot.style.display = 'flex';
            cardSlot.innerHTML = `
                <div style="position: relative;">
                    <div style="
                        height: 140px;
                        border: 2px dashed #6b4d3c;
                        border-radius: 8px; 
                        background: rgba(107, 77, 60, 0.1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #6b4d3c;">
                        Drop card here
                    </div>
                </div>
            `;
        }
    }
	
	hideCardSlot() {
		const cardSlot = document.getElementById('card-slot');
		cardSlot.style.display = 'none';
		/*
		cardSlot.style.display = 'flex';
		cardSlot.innerHTML = `
			<div style="
				height: 140px; border: 2px dashed #0073b1; border-radius: 8px; 
				background: rgba(0, 115, 177, 0.1);
				display: flex; align-items: center; justify-content: center; color: #0073b1;">
				TESTESTSATASJKSHALGJKSGAKJG
			</div>
		`;
		*/
	}
	
    renderGameState() {
        this.renderPlayerHand();
        this.renderAiHands();
        this.renderTrick();
        this.updatePlayerInfo();
        this.updateScoreDisplay();
        this.updateTrumpDisplay();
        this.setupCardHandling();  // Re-setup handlers after rendering because.... you know
    }
    
	createCardElement(card, index = null) {
		// Add error checking
		if (!card || typeof card !== 'object') {
			console.error('Invalid card object passed to createCardElement:', card);
			return document.createElement('div'); // Return empty div instead of crashing
		}

		if (!card.suit || !card.value) {
			console.error('Card missing required properties:', card);
			return document.createElement('div');
		}

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
			<div style="position: absolute; top: 5px; left: 5px; font-size: 20px; font-weight: bold;">${card.value}${card.suit}</div>
			<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 36px;">${card.suit}</div>
			<div style="position: absolute; bottom: 5px; right: 5px; transform: rotate(180deg); font-size: 20px; font-weight: bold;">${card.value}${card.suit}</div>
		`;
		
		return cardElement;
	}
    
    renderPlayerHand() {
        const handContainer = document.getElementById('player-hand');
        handContainer.innerHTML = '';
        
        this.playerHand.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            
            if (!this.biddingPhase) {
                cardElement.style.cursor = 'grab';
                cardElement.addEventListener('mousedown', (e) => {
                    this.handleCardMouseDown(e, index);
                    e.preventDefault(); // Prevent text selection
                });
            }
            
            handContainer.appendChild(cardElement);
        });
    }
    
    renderAiHands() {
        const aiAreas = ['left', 'top', 'right'];
        aiAreas.forEach((position, index) => {
            const aiContainer = document.getElementById(`${position}-ai-cards`);
            const aiInfo = document.getElementById(`${position}-ai-info`);
            aiContainer.innerHTML = '';
            aiInfo.innerHTML = `
                <div>Tricks: ${this.tricks[index + 1]}</div>
                <div>Bid: ${this.bids[index + 1]}</div>
            `;
            
            if (position === 'left' || position === 'right') {
                // Create a wrapper for side AI cards
                const wrapper = document.createElement('div');
                wrapper.className = 'side-cards-wrapper';
                
                this.aiHands[index].forEach((_, cardIndex) => {
                    const hiddenCard = document.createElement('div');
                    hiddenCard.className = 'card hidden-card' + (cardIndex > 0 ? ' overlapped' : '');
                    hiddenCard.style.width = '100px';
                    hiddenCard.style.height = '140px';
                    hiddenCard.style.border = '1px solid #000';
                    hiddenCard.style.borderRadius = '5px';
                    hiddenCard.style.position = 'absolute';
                    hiddenCard.style.backgroundImage = 'linear-gradient(45deg, #fff 45%, #ddd 50%, #fff 55%)';
                    hiddenCard.style.transform = 'rotate(90deg)';
                    hiddenCard.style.top = `${cardIndex * 20}px`; // Slight overlap
                    
                    wrapper.appendChild(hiddenCard);
                });
                
                aiContainer.appendChild(wrapper);
            } else {
                // Top AI cards remain horizontal
                this.aiHands[index].forEach(() => {
                    const hiddenCard = document.createElement('div');
                    hiddenCard.className = 'card hidden-card';
                    hiddenCard.style.width = '100px';
                    hiddenCard.style.height = '140px';
                    hiddenCard.style.border = '1px solid #000';
                    hiddenCard.style.borderRadius = '5px';
                    hiddenCard.style.display = 'inline-block';
                    hiddenCard.style.margin = '5px';
                    hiddenCard.style.backgroundImage = 'linear-gradient(45deg, #fff 45%, #ddd 50%, #fff 55%)';
                    aiContainer.appendChild(hiddenCard);
                });
            }
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
        floatingCard.style.zIndex = '1000';
        floatingCard.style.pointerEvents = 'none';
        floatingCard.style.cursor = 'grabbing';
        document.body.appendChild(floatingCard);
        this.updateFloatingCardPosition(e);

        // Prevent text selection during drag
        e.preventDefault();
    }

    updateFloatingCardPosition(e) {
        const floatingCard = document.getElementById('floating-card');
        if (floatingCard) {
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            floatingCard.style.left = `${x}px`;
            floatingCard.style.top = `${y}px`;
        }
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

        // Prevent text selection during drag
        e.preventDefault();
    }

	handleMouseUp() {
		if (!this.isDragging) return;

		const floatingCard = document.getElementById('floating-card');
		const cardSlot = document.getElementById('card-slot');
		const cardConfirmation = document.getElementById('card-confirmation');

		if (floatingCard && cardSlot) {
			const slotRect = cardSlot.getBoundingClientRect();
			const cardRect = floatingCard.getBoundingClientRect();
			const tolerance = 50;
			const isNearSlot = (
				cardRect.left < slotRect.right + tolerance &&
				cardRect.right > slotRect.left - tolerance &&
				cardRect.top < slotRect.bottom + tolerance &&
				cardRect.bottom > slotRect.top - tolerance
			);
			
			if (isNearSlot) {
				// Card was dropped near the slot
				this.selectedCard = this.draggedCard.index;
				// Show the dropped card in the slot
				const slotContent = cardSlot.querySelector('div > div:last-child');
				if (slotContent) {
					slotContent.innerHTML = '';
					const slottedCard = this.createCardElement(this.draggedCard.card);
					slotContent.appendChild(slottedCard);
				}

				// Show the #card-confirmation absolutely positioned near the card slot
				if (cardConfirmation) {
					cardConfirmation.style.display = 'block';
					// For example, position it slightly above the slot
					cardConfirmation.style.top = (slotRect.top - 50) + 'px';
					cardConfirmation.style.left = (slotRect.left) + 'px';
				}

				// Hide other cards in hand temporarily
				const playerHand = document.getElementById('player-hand');
				if (playerHand) {
					playerHand.style.opacity = '0.5';
				}
			}
			
			floatingCard.remove();
		}

		this.isDragging = false;
		this.draggedCard = null;
	}

	clearSelectedCard() {
		this.selectedCard = null;
		const playerHand = document.getElementById('player-hand');
		const cardConfirmation = document.getElementById('card-confirmation');
		
		this.hideCardSlot();

		if (cardConfirmation) {
			cardConfirmation.style.display = 'none';
		}

		if (playerHand) {
			playerHand.style.opacity = '1';
		}
		this.renderPlayerHand();
	}

	renderTrick() {
		if (this.isDragging) return; // Don't update during drag operations
		
		// Safety check: ensure trick doesn't exceed 4 cards
		if (this.currentTrick.length > 4) {
			console.error('Invalid trick state:', this.currentTrick);
			this.currentTrick = this.currentTrick.slice(0, 4);
		}
		
		const trickArea = document.getElementById('trick-area');
		const trickPositions = document.getElementById('trick-positions');
		
		if (!trickArea || !trickPositions) {
			console.error('Required DOM elements not found');
			return;
		}
		
		// Clear only the trick positions
		trickPositions.innerHTML = '';
		
		// Position cards in diamond formation
		const positions = [
			{ left: '50%', top: '80%', transform: 'translate(-50%, -50%)' }, // Bottom (Player)
			{ left: '20%', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' }, // Left
			{ left: '50%', top: '20%', transform: 'translate(-50%, -50%)' }, // Top
			{ left: '80%', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' }  // Right
		];
		
		// Add played cards to trick positions
		this.currentTrick.forEach((play) => {
			// Error checking for play object
			if (!play || !play.card || typeof play.player === 'undefined') {
				console.error('Invalid play object in currentTrick:', play);
				return;
			}

			const cardElement = this.createCardElement(play.card);
			if (!cardElement) {
				console.error('Failed to create card element for play:', play);
				return;
			}

			cardElement.style.position = 'absolute';
			const position = positions[play.player];
			if (position) {
				Object.assign(cardElement.style, position);
				trickPositions.appendChild(cardElement);
			} else {
				console.error('Invalid player position:', play.player);
			}
		});
		
		// Ensure card slot is the last child for proper z-indexing
		const cardSlot = document.getElementById('card-slot');
		if (cardSlot && cardSlot.parentNode === trickArea) {
			trickArea.appendChild(cardSlot);
		}
	}
    
	showBiddingInterface() {
		const biddingInterface = document.getElementById('bidding-interface');
		if (!biddingInterface) {
			console.error('Bidding interface element not found');
			return;
		}

		// Show
		biddingInterface.style.display = 'block';

		// Update bid input, etc.
		const bidInput = document.getElementById('bid-input');
		const cardsInHand = document.getElementById('cards-in-hand');
		if (bidInput) {
			bidInput.max = this.currentRound;
			bidInput.value = '0';
		}
		if (cardsInHand) {
			cardsInHand.textContent = this.currentRound;
		}

		this.updateTrumpDisplay();
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
        let currentPlayer = (this.dealer + 1) % 4; //...this is load bearing and I forgot why
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
        
        this.currentPlayer = (this.dealer + 1) % 4;
        
		// Debug output
		console.log('Player hand after dealing:', this.playerHand);
		console.log('AI hands after dealing:', this.aiHands);
		console.log('Current player:', this.currentPlayer);
		console.log('Trump card:', this.trumpCard);
        
        // Render the game state (which now includes updating the trump display)
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
            setTimeout(() => this.makeAiBid(), this.getDelay());
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
        
        // Clear the card slot and confirmation buttons
        const cardConfirmation = document.getElementById('card-confirmation');
		
        if (cardConfirmation) {
            cardConfirmation.style.display = 'none';
        }
		
        this.renderGameState();
        
		if (this.currentTrick.length === 4) {
			// Trick is complete
			setTimeout(() => this.evaluateTrick(), this.getDelay());
		} else {
			this.currentPlayer = 1; // human is 0
			setTimeout(() => this.aiPlay(), this.getDelay());
		}
    }    

	aiPlay() {
		const aiIndex = this.currentPlayer - 1;
		const aiHand = this.aiHands[aiIndex];
		
		console.log(`AI ${aiIndex + 1} playing with hand:`, aiHand);
		console.log('Current trick:', this.currentTrick);
		
		if (!Array.isArray(aiHand) || aiHand.length === 0) {
			console.error('Invalid or empty AI hand:', aiHand);
			return;
		}
		
		// Don't play if trick is already complete
		if (this.currentTrick.length >= 4) {
			console.error('Trying to play to a complete trick');
			return;
		}
		
		// Select card to play
		let playableCards = [...aiHand];
		
		if (this.currentTrick.length > 0) {
			const leadSuit = this.currentTrick[0].card.suit;
			const suitCards = aiHand.filter(c => c && c.suit === leadSuit);
			console.log('Lead suit:', leadSuit);
			console.log('Cards matching lead suit:', suitCards);
			
			if (suitCards.length > 0) {
				playableCards = suitCards;  // Must follow suit if possible
			}
		}
		
		const playIndex = aiHand.indexOf(playableCards[0]);
		const card = aiHand[playIndex];
		
		if (!card) {
			console.error('No valid card found for AI play');
			return;
		}
		
		// Play the card
		this.currentTrick.push({ card, player: this.currentPlayer });
		aiHand.splice(playIndex, 1);
		this.renderGameState();
		
		if (this.currentTrick.length === 4) {
			// Trick is complete
			setTimeout(() => this.evaluateTrick(), this.getDelay());
		} else {
			// Move to next player
			this.currentPlayer = (this.currentPlayer + 1) % 4;
			if (this.currentPlayer !== 0) {
				setTimeout(() => this.aiPlay(), this.getDelay());
			} else {
				setTimeout(() => this.showCardSlot(), this.getDelay());
			}
		}
	}
    
	evaluateTrick() {
		console.log('Evaluating trick:', this.currentTrick);
		
		if (this.currentTrick.length !== 4) {
			console.error('Invalid trick length:', this.currentTrick.length);
			return;
		}
		
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
		
		const winningPlayer = this.currentTrick[winner].player;
		console.log('Trick winner:', winningPlayer, 'with card:', this.currentTrick[winner].card);
		
		// Update tricks won and clear trick
		this.tricks[winningPlayer]++;
		this.currentTrick = [];
		this.currentPlayer = winningPlayer;
		
		// Check if round is over
		const allHandsEmpty = this.playerHand.length === 0 && 
							 this.aiHands[0].length === 0 && 
							 this.aiHands[1].length === 0 && 
							 this.aiHands[2].length === 0;
		
		console.log('Round end check - All hands empty:', allHandsEmpty);
		
		// Important: Render state AFTER all updates
		this.renderGameState();
		
		if (allHandsEmpty) {
			console.log('Round is over, calling endRound');
			setTimeout(() => this.endRound(), this.getDelay());
		} else {
			// If the winner is the player, show their card slot
			if (winningPlayer === 0) {
				setTimeout(() => this.showCardSlot(), this.getDelay());
			} else {
				// If AI won, let them lead
				setTimeout(() => this.aiPlay(), this.getDelay());
			}
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
        this.rotateDealer();
        
        if (this.currentRound < 7) {
            this.currentRound++;
            setTimeout(() => this.startNewRound(), this.getDelay());
        } else {
            const winner = this.scores.indexOf(Math.max(...this.scores));
            alert(`Game Over! ${this.playerNames[winner]} wins with ${this.scores[winner]} points!`);
        }
    }
	
	rotateDealer() {
        this.dealer = (this.dealer + 1) % 4;
        console.log('Dealer moved to:', this.playerNames[this.dealer]);
    }
    
    isCardPlayable(card) {
        if (this.currentTrick.length === 0) return true;
        const leadSuit = this.currentTrick[0].card.suit;
        if (card.suit === leadSuit) return true;
        return !this.playerHand.some(c => c.suit === leadSuit);
    }
}