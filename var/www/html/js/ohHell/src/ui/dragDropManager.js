// src/ui/dragDropManager.js
import { CardRenderer } from './cardRenderer.js';
export class DragDropManager {
    constructor(gameUI, gameState) {
        this.gameUI = gameUI;
        this.gameState = gameState;
        this.dragOffset = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
    }

    handleCardMouseDown(e, index) {
        if (this.gameState.currentPlayer !== 0 || this.gameState.biddingPhase) return;
        
        const card = this.gameUI.players[0].hand[index];
        if (!this.gameUI.trickEvaluator.isCardPlayable(card, this.gameUI.players[0].hand, 
            this.gameState.currentTrick[0]?.card)) {
            alert('You must follow suit if possible!');
            return;
        }
        
        this.gameState.isDragging = true;
        this.gameState.draggedCard = { card, index };
        const rect = e.target.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        this.lastMousePos = {
            x: e.clientX,
            y: e.clientY
        };

        this.createFloatingCard();
        this.updateFloatingCardPosition(e);
        e.preventDefault();
    }

    createFloatingCard() {
        const floatingCard = CardRenderer.createCardElement(this.gameState.draggedCard.card);
        floatingCard.id = 'floating-card';
        floatingCard.style.position = 'fixed';
        floatingCard.style.zIndex = '1000';
        floatingCard.style.pointerEvents = 'none';
        floatingCard.style.cursor = 'grabbing';
        document.body.appendChild(floatingCard);
    }

    updateFloatingCardPosition(e) {
        const floatingCard = document.getElementById('floating-card');
        if (floatingCard) {
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            floatingCard.style.left = `${x}px`;
            floatingCard.style.top = `${y}px`;

            const deltaX = e.clientX - this.lastMousePos.x;
            const tiltAmount = Math.max(Math.min(deltaX * 0.5, 15), -15);
            floatingCard.style.transform = `rotate(${tiltAmount}deg)`;
        }
        
        this.lastMousePos = {
            x: e.clientX,
            y: e.clientY
        };
    }

    handleMouseMove(e) {
        if (!this.gameState.isDragging) return;
        this.updateFloatingCardPosition(e);
        e.preventDefault();
    }

    handleMouseUp() {
        if (!this.gameState.isDragging) return;

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
                this.handleCardDrop(cardSlot, cardConfirmation);
            }
            
            floatingCard.remove();
        }

        this.gameState.isDragging = false;
        this.gameState.draggedCard = null;
    }

    handleCardDrop(cardSlot, cardConfirmation) {
        this.gameState.selectedCard = this.gameState.draggedCard.index;
        
        const slotContent = cardSlot.querySelector('div > div:last-child');
        if (slotContent) {
            slotContent.innerHTML = '';
            const slottedCard = CardRenderer.createCardElement(this.gameState.draggedCard.card);
            slotContent.appendChild(slottedCard);
        }

        if (cardConfirmation) {
            cardConfirmation.style.display = 'block';
            const slotRect = cardSlot.getBoundingClientRect();
            cardConfirmation.style.top = (slotRect.top - 50) + 'px';
            cardConfirmation.style.left = slotRect.left + 'px';
        }

        const playerHand = document.getElementById('player-hand');
        if (playerHand) {
            playerHand.style.opacity = '0.5';
        }
    }
}