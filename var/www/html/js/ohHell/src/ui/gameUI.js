// src/ui/gameUI.js
import { DragDropManager } from './dragDropManager.js';
import { BiddingUI } from './biddingUI.js';
import { CardRenderer } from './cardRenderer.js';

export class GameUI {
    constructor(container, gameState, players, trickEvaluator) {
        this.container = container;
        this.gameState = gameState;
        this.players = players;
        this.trickEvaluator = trickEvaluator;
        this.dragDropManager = new DragDropManager(this, gameState);
        this.biddingUI = new BiddingUI(this, gameState);
        
        this.initializeUI();
        this.setupEventListeners();
    }

    initializeUI() {
        this.container.innerHTML = `
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
							<div id="card-slot">
								<div style="position: relative;">
									<div style="height: 140px; border: 2px dashed #6b4d3c; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
										Drop card here
									</div>
								</div>
							</div>
						</div>
					</div>

					<div class="player-area">
						<div id="player-info"></div>
						<div id="player-hand"></div>
					</div>
				</div>
            </div>`;

        this.setupGlobalUI();
    }

    setupGlobalUI() {
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

        document.body.appendChild(cardConfirmation);
    }

    setupEventListeners() {
        // Speed control
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                this.gameState.gameSpeed = parseFloat(e.target.value);
                speedValue.textContent = `${this.gameState.gameSpeed}x`;
            });
        }

        // Drag and drop
        this.container.addEventListener('mousemove', (e) => this.dragDropManager.handleMouseMove(e));
        this.container.addEventListener('mouseup', () => this.dragDropManager.handleMouseUp());
        document.addEventListener('mouseleave', () => this.dragDropManager.handleMouseUp());

        // Card confirmation
        const confirmButton = document.getElementById('confirm-card');
        const cancelButton = document.getElementById('cancel-card');
        
        if (confirmButton) {
            confirmButton.addEventListener('click', () => {
                if (this.gameState.selectedCard !== null) {
                    this.onCardPlayed(this.gameState.selectedCard);
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

        // Window resize
        window.addEventListener('resize', () => {
            this.renderTrick();
            this.renderPlayerHand();
            this.renderAIHands();
        });
    }

    renderPlayerHand() {
        const handContainer = document.getElementById('player-hand');
        if (!handContainer) return;
        
        handContainer.innerHTML = '';
        
        this.players[0].hand.forEach((card, index) => {
            const cardElement = CardRenderer.createCardElement(card, index);
            
            if (!this.gameState.biddingPhase) {
                cardElement.style.cursor = 'grab';
                cardElement.addEventListener('mousedown', (e) => {
                    this.dragDropManager.handleCardMouseDown(e, index);
                });
            }
            
            handContainer.appendChild(cardElement);
        });
    }
	
	    renderAIHands() {
        const aiAreas = ['left', 'top', 'right'];
        aiAreas.forEach((position, index) => {
            const aiContainer = document.getElementById(`${position}-ai-cards`);
            const aiInfo = document.getElementById(`${position}-ai-info`);
            if (!aiContainer || !aiInfo) return;

            aiContainer.innerHTML = '';
            aiInfo.innerHTML = `
                <div>Tricks: ${this.players[index + 1].tricks}</div>
                <div>Bid: ${this.players[index + 1].bid}</div>
            `;
            
            if (position === 'left' || position === 'right') {
                const wrapper = document.createElement('div');
                wrapper.className = 'side-cards-wrapper';
                
                this.players[index + 1].hand.forEach((_, cardIndex) => {
                    const hiddenCard = CardRenderer.createHiddenCard('vertical');
                    hiddenCard.style.top = `${cardIndex * 20}px`;
                    wrapper.appendChild(hiddenCard);
                });
                
                aiContainer.appendChild(wrapper);
            } else {
                const wrapper = document.createElement('div');
                wrapper.style.display = 'inline-flex';
                wrapper.style.justifyContent = 'center';
                wrapper.style.position = 'relative';
                wrapper.style.height = '140px';
                wrapper.style.minWidth = '200px';

                this.players[index + 1].hand.forEach((_, cardIndex) => {
                    const hiddenCard = CardRenderer.createHiddenCard('horizontal');
                    hiddenCard.style.left = `${cardIndex * 30}px`;
                    
                    hiddenCard.addEventListener('mouseover', () => {
                        hiddenCard.style.transform = 'translateY(-20px)';
                    });
                    hiddenCard.addEventListener('mouseout', () => {
                        hiddenCard.style.transform = 'translateY(0)';
                    });
                    
                    wrapper.appendChild(hiddenCard);
                });
                
                aiContainer.appendChild(wrapper);
            }
        });
    }

    renderTrick() {
        if (this.gameState.isDragging) return;
        
        const trickPositions = document.getElementById('trick-positions');
        if (!trickPositions) return;
        
        trickPositions.innerHTML = '';
        
        const positions = [
            { left: '50%', top: '80%', transform: 'translate(-50%, -50%)' },
            { left: '20%', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' },
            { left: '50%', top: '20%', transform: 'translate(-50%, -50%)' },
            { left: '80%', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' }
        ];
        
        this.gameState.currentTrick.forEach((play) => {
            if (!play || !play.card) return;

            const cardElement = CardRenderer.createCardElement(play.card);
            cardElement.style.position = 'absolute';
            const position = positions[play.player];
            if (position) {
                Object.assign(cardElement.style, position);
                trickPositions.appendChild(cardElement);
            }
        });
    }

    updateTrumpDisplay() {
        const trumpDisplay = document.getElementById('trump-display');
        if (!trumpDisplay || !this.gameState.trumpCard) return;

        const trumpElement = CardRenderer.createCardElement(this.gameState.trumpCard);
        trumpElement.style.transform = 'scale(0.8)';
        trumpDisplay.innerHTML = '';
        trumpDisplay.appendChild(trumpElement);
    }

    updateScoreDisplay() {
        const summaryTable = document.getElementById('score-summary');
        if (!summaryTable) return;

        summaryTable.innerHTML = this.players.map((player, i) => `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">
                    ${player.name}${i === this.gameState.dealer ? ' (Dealer)' : ''}
                </td>
                <td style="padding: 8px; border: 1px solid #ddd;">${player.bid}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${player.tricks}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${player.score}</td>
            </tr>
        `).join('');
        
        const historyTable = document.getElementById('history-table');
        if (historyTable) {
            historyTable.innerHTML = this.gameState.roundHistory.flatMap(round => 
                this.players.map((player, i) => `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">${round.round}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${player.name}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${round.bids[i]}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${round.tricks[i]}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${round.roundScores[i]}</td>
                    </tr>
                `)
            ).join('');
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

    updatePlayerInfo() {
        const playerInfo = document.getElementById('player-info');
        
        if (playerInfo) {
            playerInfo.innerHTML = `
                <div>Your Tricks: ${this.players[0].tricks}</div>
                <div>Your Bid: ${this.players[0].bid}</div>
                ${this.gameState.currentPlayer === 0 && !this.gameState.biddingPhase ? 
                    '<div style="color: #0073b1; font-weight: bold;">Your Turn!</div>' : ''}
            `;
        }

        // Show card slot whenever it's player's turn and not in bidding phase
        if (this.gameState.currentPlayer === 0 && !this.gameState.biddingPhase) {
            this.showCardSlot();
        } else {
            this.hideCardSlot();
        }
    }

    clearSelectedCard() {
        this.gameState.selectedCard = null;
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

	renderGameState() {
		this.renderPlayerHand();
		this.renderAIHands();
		this.renderTrick();
		this.updatePlayerInfo();
		this.updateScoreDisplay();
		this.updateTrumpDisplay();
	}

    onCardPlayed(index) {
        // This method should be overridden by the game controller
        console.warn('onCardPlayed not implemented');
    }

    showEndGameScreen(winner, finalScores) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        const content = document.createElement('div');
        content.style.backgroundColor = '#fff';
        content.style.padding = '2rem';
        content.style.borderRadius = '12px';
        content.style.maxWidth = '500px';
        content.style.textAlign = 'center';

        content.innerHTML = `
            <h2>Game Over!</h2>
            <p>${winner.name} win(s) with ${winner.score} points!</p>
            <h3>Final Scores:</h3>
            <ul style="list-style: none; padding: 0;">
                ${this.players.map(player => 
                    `<li>${player.name}: ${player.score} points</li>`
                ).join('')}
            </ul>
            <button onclick="location.reload()" style="margin-top: 1rem;">Play Again</button>
        `;

        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }

    showWaitingMessage(message) {
        const waitingDiv = document.createElement('div');
        waitingDiv.id = 'waiting-message';
        waitingDiv.style.position = 'fixed';
        waitingDiv.style.top = '50%';
        waitingDiv.style.left = '50%';
        waitingDiv.style.transform = 'translate(-50%, -50%)';
        waitingDiv.style.padding = '1rem';
        waitingDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        waitingDiv.style.color = 'white';
        waitingDiv.style.borderRadius = '8px';
        waitingDiv.style.zIndex = '9999';
        waitingDiv.textContent = message;

        document.body.appendChild(waitingDiv);
        setTimeout(() => waitingDiv.remove(), this.gameState.getDelay());
    }
}