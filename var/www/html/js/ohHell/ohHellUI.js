export class OhHellUI {
    constructor(container, gameState, cardManager) {
        this.container = container;
        this.gameState = gameState;
        this.cardManager = cardManager;
        this.BASE_DELAY = 1000;
        this.gameSpeed = 1;
        this.setupUI();
    }

    setupUI() {
        this.container.innerHTML = `
            <style>
                .game-layout {
                    display: flex;
                    height: 90vh;
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
                    max-height: 100vh;
                    overflow: hidden;
                }

                .center-area {
                    position: relative;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    min-height: 0;
                    padding: 10px 0;
                    z-index: 1;
                    overflow: visible;
                    width: 100%;
                }

                .top-ai {
                    position: relative;
                    width: 100%;
                    text-align: center;
                    margin-bottom: 10px;
                    z-index: 2;
                }
                
                .top-ai .card {
                    margin: 0 -25px;
                    transition: transform 0.2s;
                    position: relative;
                }
                
                .top-ai .card:hover {
                    transform: translateY(-20px);
                    z-index: 3;
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
                    aspect-ratio: 16/9;
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
                    margin-top: 10px;
                    text-align: center;
                    width: 100%;
                }

                #player-hand {
                    display: flex;
                    justify-content: center;
                    gap: 5px;
                    margin-top: 10px;
                }

                #player-hand .card {
                    margin: 0 -15px;
                    transition: transform 0.2s;
                }

                #player-hand .card:hover {
                    transform: translateY(-20px);
                    z-index: 3;
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

                #card-confirmation {
                    display: none;
                    position: absolute;
                    background: #fff;
                    border: 1px solid #d4c5b9;
                    border-radius: 8px;
                    padding: 10px;
                    z-index: 1000;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .confirm-buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin-top: 10px;
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

                    #player-hand .card {
                        margin: 0 -10px;
                    }

                    .side-ai-container {
                        width: 12%;
                    }

                    .top-ai .card {
                        margin: 0 -15px;
                    }
                }

                @media (max-height: 800px) {
                    .side-ai-cards {
                        margin-top: 40px;
                    }
                    .hidden-card.overlapped {
                        margin: -60px 0 0 0;
                    }
                }
            </style>

            <div class="game-layout">
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

                <div class="main-area">
                    <div class="top-ai">
                        <div id="top-ai-info"></div>
                        <div id="top-ai-cards"></div>
                    </div>

                    <div class="side-ai-container" style="left: 5%;">
                        <div id="left-ai-info" class="side-ai-info"></div>
                        <div id="left-ai-cards" class="side-ai-cards"></div>
                    </div>

                    <div class="side-ai-container" style="right: 5%;">
                        <div id="right-ai-info" class="side-ai-info"></div>
                        <div id="right-ai-cards" class="side-ai-cards"></div>
                    </div>

                    <div style="position: absolute; top: 20px; right: 20px; text-align: center; z-index: 2;">
                        <div style="margin-bottom: 10px; font-weight: bold;">Trump Suit:</div>
                        <div id="trump-display"></div>
                    </div>

                    <div class="center-area">
                        <div id="trick-area">
                            <div id="trick-positions"></div>
                            <div id="card-slot"></div>
                        </div>
                    </div>

                    <div class="player-area">
                        <div id="player-info"></div>
                        <div id="player-hand"></div>
                    </div>
                </div>
            </div>`;
            
        this.setupGlobalUI();
        this.setupBiddingInterface();
        this.setupEventListeners();
        
        // Add touch event listeners
        this.container.addEventListener('touchmove', (e) => this.cardManager.handleMove(e), { passive: false });
        this.container.addEventListener('touchend', () => this.handleTouchEnd());
    }

    setupGlobalUI() {
        const cardConfirmation = document.createElement('div');
        cardConfirmation.id = 'card-confirmation';
        cardConfirmation.innerHTML = `
            <div class="confirm-buttons">
                <button id="confirm-card" class="confirm-btn">Play</button>
                <button id="cancel-card" class="cancel-btn">Cancel</button>
            </div>
        `;
        this.container.appendChild(cardConfirmation);
    }

    setupBiddingInterface() {
        const biddingEl = document.createElement('div');
        biddingEl.id = 'bidding-interface';
        biddingEl.style.cssText = `
            position: absolute;
            z-index: 1000;
            display: none;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            padding: 20px;
            border: 1px solid #d4c5b9;
            left: 50%;
            top: 30%;
            transform: translate(-50%, -50%);
            font-family: 'Crimson Text', Georgia, serif;
        `;

        biddingEl.innerHTML = `
            <h3 style="color: #2c1810; margin-top: 0;">Place Your Bid</h3>
            <p>Cards in hand: <span id="cards-in-hand">0</span></p>
            <p>Trump suit: <span id="trump-reminder"></span></p>
            <input type="number" id="bid-input" min="0" max="13" value="0" 
                   style="border: 1px solid #d4c5b9; border-radius: 8px;">
            <button id="submit-bid">Submit Bid</button>
        `;

        this.container.appendChild(biddingEl);
    }

    setupEventListeners() {
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

    updateScoreDisplay() {
        const summaryTable = document.getElementById('score-summary');
        const historyTable = document.getElementById('history-table');
        
        if (summaryTable) {
            summaryTable.innerHTML = this.gameState.playerNames.map((name, i) => `
                <tr>
                    <td>${name}${i === this.gameState.dealer ? ' (Dealer)' : ''}</td>
                    <td>${this.gameState.bids[i]}</td>
                    <td>${this.gameState.tricks[i]}</td>
                    <td>${this.gameState.scores[i]}</td>
                </tr>
            `).join('');
        }
        
        if (historyTable) {
            historyTable.innerHTML = this.gameState.roundHistory.flatMap(round => 
                this.gameState.playerNames.map((name, i) => `
                    <tr>
                        <td>${round.round}</td>
                        <td>${name}</td>
                        <td>${round.bids[i]}</td>
                        <td>${round.tricks[i]}</td>
                        <td>${round.roundScores[i]}</td>
                    </tr>
                `)
            ).join('');
        }
    }

    updatePlayerInfo() {
        const playerInfo = document.getElementById('player-info');
        
        if (playerInfo) {
            playerInfo.innerHTML = `
                <div>Your Tricks: ${this.gameState.tricks[0]}</div>
                <div>Your Bid: ${this.gameState.bids[0]}</div>
                ${this.gameState.currentPlayer === 0 && !this.gameState.biddingPhase ? 
                  '<div style="color: #0073b1; font-weight: bold;">Your Turn!</div>' : ''}
            `;
        }

        if (this.gameState.currentPlayer === 0 && !this.gameState.biddingPhase) {
            this.showCardSlot();
        } else {
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
        if (cardSlot) {
            cardSlot.style.display = 'none';
        }
    }

    renderPlayerHand(playerHand, isCurrentPlayer = false) {
        const handContainer = document.getElementById('player-hand');
        if (!handContainer) return;

        handContainer.innerHTML = '';
        
        playerHand.forEach((card, index) => {
            const cardElement = this.cardManager.createCardElement(card, index);
            
            if (isCurrentPlayer && !this.gameState.biddingPhase) {
                cardElement.style.cursor = 'grab';
                cardElement.addEventListener('mousedown', (e) => {
                    this.cardManager.handleStart(e, card, index, false);
                });
                cardElement.addEventListener('touchstart', (e) => {
                    this.cardManager.handleStart(e, card, index, true);
                });
            }
            
            handContainer.appendChild(cardElement);
        });
    }

    renderAiHands(aiHands) {
        const aiAreas = ['left', 'top', 'right'];
        aiAreas.forEach((position, index) => {
            const aiContainer = document.getElementById(`${position}-ai-cards`);
            const aiInfo = document.getElementById(`${position}-ai-info`);
            
            if (!aiContainer || !aiInfo) return;

            aiContainer.innerHTML = '';
            aiInfo.innerHTML = `
                <div>Tricks: ${this.gameState.tricks[index + 1]}</div>
                <div>Bid: ${this.gameState.bids[index + 1]}</div>
            `;
            
            if (position === 'left' || position === 'right') {
                this.renderSideAiHand(aiContainer, aiHands[index], position);
            } else {
                this.renderTopAiHand(aiContainer, aiHands[index]);
            }
        });
    }

    renderSideAiHand(container, hand, position) {
        const wrapper = document.createElement('div');
        wrapper.className = 'side-cards-wrapper';
        
        hand.forEach((_, cardIndex) => {
            const hiddenCard = document.createElement('div');
            hiddenCard.className = 'card hidden-card overlapped';
            hiddenCard.style.cssText = `
                width: 100px;
                height: 140px;
                border: 1px solid #000;
                border-radius: 5px;
                position: absolute;
                background-image: linear-gradient(45deg, #fff 45%, #ddd 50%, #fff 55%);
                transform: rotate(90deg);
                top: ${cardIndex * 20}px;
            `;
            
            wrapper.appendChild(hiddenCard);
        });
        
        container.appendChild(wrapper);
    }

    renderTopAiHand(container, hand) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            display: inline-flex;
            justify-content: center;
            position: relative;
            height: 140px;
            min-width: 200px;
        `;

        hand.forEach((_, cardIndex) => {
            const hiddenCard = document.createElement('div');
            hiddenCard.className = 'card hidden-card';
            hiddenCard.style.cssText = `
                width: 100px;
                height: 140px;
                border: 1px solid #000;
                border-radius: 5px;
                position: absolute;
                left: ${cardIndex * 30}px;
                background-image: linear-gradient(45deg, #fff 45%, #ddd 50%, #fff 55%);
                transition: transform 0.2s;
            `;
            
            hiddenCard.addEventListener('mouseover', () => {
                hiddenCard.style.transform = 'translateY(-20px)';
            });
            hiddenCard.addEventListener('mouseout', () => {
                hiddenCard.style.transform = 'translateY(0)';
            });
            
            wrapper.appendChild(hiddenCard);
        });
        
        container.appendChild(wrapper);
    }

    renderTrick(currentTrick) {
        if (this.cardManager.isDragging) return;
        
        const trickPositions = document.getElementById('trick-positions');
        if (!trickPositions) return;
        
        trickPositions.innerHTML = '';
        
        const positions = [
            { left: '50%', top: '80%', transform: 'translate(-50%, -50%)' },
            { left: '20%', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' },
            { left: '50%', top: '20%', transform: 'translate(-50%, -50%)' },
            { left: '80%', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' }
        ];
        
        currentTrick.forEach((play) => {
            if (!play || !play.card) return;

            const cardElement = this.cardManager.createCardElement(play.card);
            cardElement.style.position = 'absolute';
            
            const position = positions[play.player];
            if (position) {
                Object.assign(cardElement.style, position);
                trickPositions.appendChild(cardElement);
            }
        });
    }

    updateTrumpDisplay(trumpCard) {
        const trumpDisplay = document.getElementById('trump-display');
        const trumpReminder = document.getElementById('trump-reminder');
        
        if (trumpDisplay && trumpCard) {
            const trumpElement = this.cardManager.createCardElement(trumpCard);
            trumpElement.style.transform = 'scale(0.8)';
            trumpDisplay.innerHTML = '';
            trumpDisplay.appendChild(trumpElement);
            
            if (trumpReminder) {
                trumpReminder.textContent = trumpCard.suit;
            }
        }
    }

    showBiddingInterface(currentRound) {
        const biddingInterface = document.getElementById('bidding-interface');
        if (!biddingInterface) return;

        biddingInterface.style.display = 'block';
        
        const bidInput = document.getElementById('bid-input');
        const cardsInHand = document.getElementById('cards-in-hand');
        
        if (bidInput) {
            bidInput.max = currentRound;
            bidInput.value = '0';
        }
        if (cardsInHand) {
            cardsInHand.textContent = currentRound;
        }
    }

    hideBiddingInterface() {
        const biddingInterface = document.getElementById('bidding-interface');
        if (biddingInterface) {
            biddingInterface.style.display = 'none';
        }
    }

    handleTouchEnd() {
        const cardSlot = document.getElementById('card-slot');
        if (this.cardManager.handleEnd(cardSlot)) {
            this.showConfirmation();
        }
    }

    showConfirmation() {
        const cardConfirmation = document.getElementById('card-confirmation');
        const playerHand = document.getElementById('player-hand');
        const cardSlot = document.getElementById('card-slot');
        
        if (cardConfirmation && cardSlot) {
            const slotRect = cardSlot.getBoundingClientRect();
            cardConfirmation.style.display = 'block';
            cardConfirmation.style.top = (slotRect.top - 50) + 'px';
            cardConfirmation.style.left = slotRect.left + 'px';
            
            if (playerHand) {
                playerHand.style.opacity = '0.5';
            }
        }
    }

    hideConfirmation() {
        const cardConfirmation = document.getElementById('card-confirmation');
        const playerHand = document.getElementById('player-hand');
        
        if (cardConfirmation) {
            cardConfirmation.style.display = 'none';
        }
        if (playerHand) {
            playerHand.style.opacity = '1';
        }
    }
}