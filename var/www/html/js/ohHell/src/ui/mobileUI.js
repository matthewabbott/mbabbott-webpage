// src/ui/mobileUI.js
import { CardRenderer } from './cardRenderer.js';
import { MobileBiddingUI } from './mobileBiddingUI.js';
import { theme } from '../styles/theme.js';

export class MobileGameUI {
    constructor(container, gameState, players, trickEvaluator) {
        this.container = container;
        this.gameState = gameState;
        this.players = players;
        this.trickEvaluator = trickEvaluator;
        this.onCardPlayed = null;  // Will be set by game controller
        
        // Initialize bidding UI
        this.biddingUI = new MobileBiddingUI(this, gameState);
        
        // Initialize UI components
        this.initializeUI();
        this.setupEventListeners();
    }

    initializeUI() {
        this.container.innerHTML = `
            <div class="mobile-game-layout">
                <!-- Collapsible Score Panel -->
                <div class="mobile-score-panel" id="score-panel">
                    <div class="score-handle" id="score-handle">
                        <span>Game Info</span>
                        <span class="handle-icon">▼</span>
                    </div>
                    <div class="score-content" id="score-content">
                        <table class="mobile-score-table">
                            <thead>
                                <tr>
                                    <th>Player</th>
                                    <th>Bid</th>
                                    <th>Tricks</th>
                                    <th>Score</th>
                                </tr>
                            </thead>
                            <tbody id="mobile-score-summary"></tbody>
                        </table>
                        
                        <div class="mobile-speed-control">
                            <label>Game Speed: <span id="speed-value">1x</span></label>
                            <input type="range" id="speed-slider" min="0.2" max="20" step="0.2" value="1">
                        </div>
                    </div>
                </div>

                <!-- Game Area -->
                <div class="mobile-game-area">
                    <!-- Top AI (minimized) -->
                    <div class="mobile-top-ai">
                        <div class="mobile-ai-info" id="top-ai-info"></div>
                        <div class="mobile-ai-cards" id="top-ai-cards"></div>
                    </div>

                    <!-- Side AIs (minimized) -->
                    <div class="mobile-side-ais">
                        <div class="mobile-left-ai">
                            <div class="mobile-ai-info" id="left-ai-info"></div>
                            <div class="mobile-ai-cards" id="left-ai-cards"></div>
                        </div>
                        
                        <!-- Trump Display -->
                        <div class="mobile-trump-display" id="trump-display"></div>
                        
                        <div class="mobile-right-ai">
                            <div class="mobile-ai-info" id="right-ai-info"></div>
                            <div class="mobile-ai-cards" id="right-ai-cards"></div>
                        </div>
                    </div>

                    <!-- Center Play Area -->
                    <div class="mobile-trick-area" id="trick-area">
                        <div id="trick-positions"></div>
                    </div>

                    <!-- Player Hand (Scrollable) -->
                    <div class="mobile-player-area">
                        <div id="player-info"></div>
                        <div class="mobile-hand-scroll">
                            <div id="player-hand" class="mobile-player-hand"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.addMobileStyles();
    }

    addMobileStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .mobile-game-layout {
                display: flex;
                flex-direction: column;
                height: 100vh;
                max-height: -webkit-fill-available;
                overflow: hidden;
            }

            .mobile-score-panel {
                background: ${theme.colors.background};
                border-bottom: 1px solid ${theme.colors.border};
                transition: height 0.3s ease;
            }

            .score-handle {
                padding: 10px;
                background: ${theme.colors.primary};
                color: ${theme.colors.lightText};
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            }

            .score-content {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }

            .score-content.expanded {
                max-height: 50vh;
                overflow-y: auto;
            }

            .mobile-score-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
            }

            .mobile-score-table th,
            .mobile-score-table td {
                padding: 6px;
                border: 1px solid ${theme.colors.border};
            }

            .mobile-game-area {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
                padding: 10px;
                position: relative;
            }

            .mobile-top-ai {
                height: 60px;
                text-align: center;
            }

            .mobile-side-ais {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
            }

            .mobile-left-ai,
            .mobile-right-ai {
                width: 40px;
                text-align: center;
            }

            .mobile-trump-display {
                transform: scale(0.7);
            }

            .mobile-trick-area {
                flex: 1;
                position: relative;
                border: 1px solid ${theme.colors.border};
                border-radius: 12px;
                margin: 10px 0;
                background-color: rgba(248, 243, 233, 0.5);
            }

            .mobile-player-area {
                height: 160px;
            }

            .mobile-hand-scroll {
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding: 10px 0;
            }

            .mobile-player-hand {
                display: inline-flex;
                padding: 0 10px;
            }

            .mobile-player-hand .card {
                margin: 0 -15px;
                transition: transform 0.2s;
            }

            .mobile-player-hand .card.selected {
                transform: translateY(-20px);
            }

            .mobile-speed-control {
                padding: 10px;
                border-top: 1px solid ${theme.colors.border};
            }

            /* Card size adjustments for mobile */
            .card {
                width: ${theme.card.mobile.width} !important;
                height: ${theme.card.mobile.height} !important;
                font-size: ${theme.card.mobile.fontSize} !important;
            }

            .mobile-ai-cards .card {
                transform: scale(0.7);
                margin: -10px;
            }

            .player-turn-indicator {
                color: ${theme.colors.highlight};
                font-weight: bold;
                animation: pulse 1.5s infinite;
            }

            @media (max-height: 600px) {
                .mobile-top-ai {
                    height: 40px;
                }
                
                .mobile-trick-area {
                    margin: 5px 0;
                }

                .mobile-player-area {
                    height: 140px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Score panel toggle
        const handle = document.getElementById('score-handle');
        const content = document.getElementById('score-content');
        const icon = handle.querySelector('.handle-icon');

        handle.addEventListener('click', () => {
            content.classList.toggle('expanded');
            icon.textContent = content.classList.contains('expanded') ? '▲' : '▼';
        });

        // Card selection (tap to select, tap again to play)
        const playerHand = document.getElementById('player-hand');
        if (playerHand) {
            playerHand.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                if (!card || this.gameState.currentPlayer !== 0 || this.gameState.biddingPhase) return;

                const index = parseInt(card.dataset.index);
                const selectedCard = this.players[0].hand[index];

                if (!this.trickEvaluator.isCardPlayable(selectedCard, this.players[0].hand, 
                    this.gameState.currentTrick[0]?.card)) {
                    alert('You must follow suit if possible!');
                    return;
                }

                if (card.classList.contains('selected')) {
                    // Play the card
                    this.onCardPlayed(index);
                    card.classList.remove('selected');
                } else {
                    // Deselect other cards
                    playerHand.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                    // Select this card
                    card.classList.add('selected');
                }
            });
        }

        // Speed control
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                const speed = parseFloat(e.target.value);
                this.gameState.gameSpeed = speed;
                speedValue.textContent = `${speed}x`;
            });
        }
    }
	
    renderPlayerHand() {
        const handContainer = document.getElementById('player-hand');
        if (!handContainer) return;
        
        handContainer.innerHTML = '';
        
        this.players[0].hand.forEach((card, index) => {
            const cardElement = CardRenderer.createCardElement(card, index);
            // Add mobile-specific classes
            cardElement.classList.add('mobile-card');
            
            if (!this.gameState.biddingPhase) {
                cardElement.style.cursor = 'pointer';
            }
            
            handContainer.appendChild(cardElement);
        });

        // Ensure hand is centered when fewer cards than screen width
        const totalWidth = this.players[0].hand.length * 55; // 70px card - 15px overlap
        handContainer.style.minWidth = `${totalWidth}px`;
    }

    renderAIHands() {
        // Render minimized top AI hand
        const topContainer = document.getElementById('top-ai-cards');
        const topInfo = document.getElementById('top-ai-info');
        if (topContainer && topInfo) {
            topContainer.innerHTML = '';
            topInfo.innerHTML = `
                <div class="mobile-ai-stats">
                    <span>Tricks: ${this.players[2].tricks}</span>
                    <span>Bid: ${this.players[2].bid}</span>
                </div>
            `;

            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.justifyContent = 'center';
            wrapper.style.gap = '-10px';
            
            // Show minimized version of cards
            this.players[2].hand.forEach(() => {
                const miniCard = document.createElement('div');
                miniCard.className = 'mini-card';
                miniCard.style.width = '20px';
                miniCard.style.height = '30px';
                miniCard.style.backgroundColor = '#fff';
                miniCard.style.border = '1px solid #000';
                miniCard.style.borderRadius = '3px';
                miniCard.style.margin = '0 -5px';
                wrapper.appendChild(miniCard);
            });
            
            topContainer.appendChild(wrapper);
        }

        // Render side AI hands
        ['left', 'right'].forEach((position, index) => {
            const player = this.players[index === 0 ? 1 : 3];
            const container = document.getElementById(`${position}-ai-cards`);
            const info = document.getElementById(`${position}-ai-info`);
            
            if (container && info) {
                container.innerHTML = '';
                info.innerHTML = `
                    <div class="mobile-ai-stats">
                        <div>T: ${player.tricks}</div>
                        <div>B: ${player.bid}</div>
                    </div>
                `;

                // Show minimized vertical stack of cards
                const stack = document.createElement('div');
                stack.className = 'mobile-side-stack';
                stack.style.position = 'relative';
                stack.style.height = '60px';

                player.hand.forEach((_, i) => {
                    const miniCard = document.createElement('div');
                    miniCard.className = 'mini-card';
                    miniCard.style.width = '15px';
                    miniCard.style.height = '20px';
                    miniCard.style.backgroundColor = '#fff';
                    miniCard.style.border = '1px solid #000';
                    miniCard.style.borderRadius = '2px';
                    miniCard.style.position = 'absolute';
                    miniCard.style.top = `${i * 3}px`;
                    stack.appendChild(miniCard);
                });

                container.appendChild(stack);
            }
        });
    }

    renderTrick() {
        const trickPositions = document.getElementById('trick-positions');
        if (!trickPositions) return;
        
        trickPositions.innerHTML = '';
        
        // Adjust positions for mobile layout
        const positions = [
            { left: '50%', bottom: '10%', transform: 'translate(-50%, 0)' },  // Bottom (player)
            { left: '10%', top: '50%', transform: 'translate(0, -50%)' },     // Left
            { left: '50%', top: '10%', transform: 'translate(-50%, 0)' },     // Top
            { right: '10%', top: '50%', transform: 'translate(0, -50%)' }     // Right
        ];
        
        this.gameState.currentTrick.forEach((play) => {
            if (!play || !play.card) return;

            const cardElement = CardRenderer.createCardElement(play.card);
            cardElement.classList.add('mobile-trick-card');
            cardElement.style.position = 'absolute';
            cardElement.style.zIndex = '2';
            
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
        trumpElement.classList.add('mobile-trump-card');
        trumpElement.style.transform = 'scale(0.6)';
        trumpDisplay.innerHTML = '';
        trumpDisplay.appendChild(trumpElement);
    }

    updateScoreDisplay() {
        const summaryTable = document.getElementById('mobile-score-summary');
        if (!summaryTable) return;

        summaryTable.innerHTML = this.players.map((player, i) => `
            <tr>
                <td>${player.name}${i === this.gameState.dealer ? ' (D)' : ''}</td>
                <td>${player.bid}</td>
                <td>${player.tricks}</td>
                <td>${player.score}</td>
            </tr>
        `).join('');
    }

    updatePlayerInfo() {
        const playerInfo = document.getElementById('player-info');
        if (!playerInfo) return;

        const isPlayerTurn = this.gameState.currentPlayer === 0 && !this.gameState.biddingPhase;
        
        playerInfo.innerHTML = `
            <div class="mobile-player-stats">
                <span>Tricks: ${this.players[0].tricks}</span>
                <span>Bid: ${this.players[0].bid}</span>
                ${isPlayerTurn ? '<span class="player-turn-indicator">Your Turn!</span>' : ''}
            </div>
        `;

        // Add turn indicator styles if not already present
        if (!document.querySelector('#mobile-turn-styles')) {
            const style = document.createElement('style');
            style.id = 'mobile-turn-styles';
            style.textContent = `
                .player-turn-indicator {
                    color: #0073b1;
                    font-weight: bold;
                    animation: pulse 1.5s infinite;
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.6; }
                    100% { opacity: 1; }
                }

                .mobile-player-stats {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-bottom: 10px;
                }
            `;
            document.head.appendChild(style);
        }
    }

    showEndGameScreen(winner) {
        const overlay = document.createElement('div');
        overlay.className = 'mobile-end-game-overlay';
        overlay.innerHTML = `
            <div class="mobile-end-game-content">
                <h2>Game Over!</h2>
                <p>${winner.name} wins with ${winner.score} points!</p>
                <div class="final-scores">
                    ${this.players.map(player => 
                        `<div>${player.name}: ${player.score}</div>`
                    ).join('')}
                </div>
                <button onclick="location.reload()">Play Again</button>
            </div>
        `;

        // Add mobile-specific styles for end game screen
        const style = document.createElement('style');
        style.textContent = `
            .mobile-end-game-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }

            .mobile-end-game-content {
                background: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                margin: 20px;
                max-width: 300px;
            }

            .final-scores {
                margin: 15px 0;
                font-size: 1.1em;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);
    }

    renderGameState() {
        this.renderPlayerHand();
        this.renderAIHands();
        this.renderTrick();
        this.updatePlayerInfo();
        this.updateScoreDisplay();
        this.updateTrumpDisplay();
    }
}