// src/ui/biddingUI.js
export class BiddingUI {
    constructor(gameUI, gameState) {
        this.gameUI = gameUI;
        this.gameState = gameState;
        this.onBidSubmitted = null;  // Callback to be set by parent
        this.setupBiddingInterface();
        this.attachEventListeners();
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

    attachEventListeners() {
        const submitButton = document.getElementById('submit-bid');
        const bidInput = document.getElementById('bid-input');
        
        if (submitButton && bidInput) {
            submitButton.addEventListener('click', () => {
                const bid = parseInt(bidInput.value);
                if (!isNaN(bid) && this.onBidSubmitted) {
                    this.onBidSubmitted(bid);
                }
            });

            // Add keyboard support
            bidInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    submitButton.click();
                }
            });
        }
    }

    show() {
        const biddingInterface = document.getElementById('bidding-interface');
        if (!biddingInterface) return;

        biddingInterface.style.display = 'block';
        const bidInput = document.getElementById('bid-input');
        const cardsInHand = document.getElementById('cards-in-hand');
        const trumpReminder = document.getElementById('trump-reminder');
        
        if (bidInput) {
            bidInput.max = this.gameState.currentRound;
            bidInput.value = '0';
            bidInput.focus();  // Focus the input when shown
        }
        if (cardsInHand) {
            cardsInHand.textContent = this.gameState.currentRound;
        }
        if (trumpReminder && this.gameState.trumpCard) {
            trumpReminder.textContent = this.gameState.trumpCard.suit;
        }
    }

    hide() {
        const biddingInterface = document.getElementById('bidding-interface');
        if (biddingInterface) {
            biddingInterface.style.display = 'none';
        }
    }
}