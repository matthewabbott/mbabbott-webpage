// src/ui/mobileBiddingUI.js
import { theme } from '../styles/theme.js';

export class MobileBiddingUI {
    constructor(gameUI, gameState) {
        this.gameUI = gameUI;
        this.gameState = gameState;
        this.onBidSubmitted = null;  // Callback to be set by parent
        this.setupBiddingInterface();
    }

    setupBiddingInterface() {
        const biddingEl = document.createElement('div');
        biddingEl.id = 'mobile-bidding-interface';
        biddingEl.style.display = 'none';
        biddingEl.innerHTML = `
            <div class="mobile-bid-content">
                <h3>Place Your Bid</h3>
                <div class="bid-info">
                    <p>Cards in hand: <span id="cards-in-hand">0</span></p>
                    <p>Trump suit: <span id="trump-reminder"></span></p>
                </div>
                <div class="bid-controls">
                    <button id="decrease-bid">-</button>
                    <input type="number" id="bid-input" min="0" max="13" value="0">
                    <button id="increase-bid">+</button>
                </div>
                <button id="submit-bid" class="submit-bid-button">Submit Bid</button>
            </div>
        `;
        document.body.appendChild(biddingEl);

        // Mobile-specific styles for bidding
        const style = document.createElement('style');
        style.textContent = `
            #mobile-bidding-interface {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }

            .mobile-bid-content {
                background: ${theme.colors.background};
                padding: 20px;
                border-radius: 12px;
                width: 90%;
                max-width: 300px;
                text-align: center;
            }

            .bid-controls {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin: 20px 0;
            }

            #bid-input {
                width: 60px;
                height: 40px;
                text-align: center;
                font-size: 20px;
                border: 1px solid ${theme.colors.border};
                border-radius: 4px;
            }

            #decrease-bid, #increase-bid {
                width: 40px;
                height: 40px;
                font-size: 24px;
                background: ${theme.colors.primary};
                color: ${theme.colors.lightText};
                border: none;
                border-radius: 20px;
                cursor: pointer;
            }

            .submit-bid-button {
                background: ${theme.colors.primary};
                color: ${theme.colors.lightText};
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 16px;
                width: 100%;
                margin-top: 10px;
            }
			#decrease-bid:active, #increase-bid:active, .submit-bid-button:active {
				background: ${theme.colors.primaryDark};
				transform: scale(0.95);
			}
        `;
        document.head.appendChild(style);

        this.attachEventListeners();
    }

    attachEventListeners() {
        const submitButton = document.getElementById('submit-bid');
        const bidInput = document.getElementById('bid-input');
        const decreaseButton = document.getElementById('decrease-bid');
        const increaseButton = document.getElementById('increase-bid');

        if (submitButton && bidInput) {
            submitButton.addEventListener('click', () => {
                const bid = parseInt(bidInput.value);
                if (!isNaN(bid) && this.onBidSubmitted) {
                    this.onBidSubmitted(bid);
                }
            });

            decreaseButton.addEventListener('click', () => {
                const currentBid = parseInt(bidInput.value);
                if (currentBid > 0) {
                    bidInput.value = currentBid - 1;
                }
            });

            increaseButton.addEventListener('click', () => {
                const currentBid = parseInt(bidInput.value);
                if (currentBid < parseInt(bidInput.max)) {
                    bidInput.value = currentBid + 1;
                }
            });
        }
    }

    show() {
        const biddingInterface = document.getElementById('mobile-bidding-interface');
        if (!biddingInterface) return;

        biddingInterface.style.display = 'flex';
        const bidInput = document.getElementById('bid-input');
        const cardsInHand = document.getElementById('cards-in-hand');
        const trumpReminder = document.getElementById('trump-reminder');
        
        if (bidInput) {
            bidInput.max = this.gameState.currentRound;
            bidInput.value = '0';
        }
        if (cardsInHand) {
            cardsInHand.textContent = this.gameState.currentRound;
        }
        if (trumpReminder && this.gameState.trumpCard) {
            trumpReminder.textContent = this.gameState.trumpCard.suit;
        }
    }

    hide() {
        const biddingInterface = document.getElementById('mobile-bidding-interface');
        if (biddingInterface) {
            biddingInterface.style.display = 'none';
        }
    }
}