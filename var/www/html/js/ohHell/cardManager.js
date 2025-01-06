export class CardManager {
    constructor() {
        this.isDragging = false;
        this.draggedCard = null;
        this.dragOffset = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        this.selectedCard = null;
        
        // Touch-specific properties
        this.touchStartPos = null;
        this.touchScrolling = false;
    }

    createCardElement(card, index = null) {
        if (!card || typeof card !== 'object') {
            console.error('Invalid card object:', card);
            return document.createElement('div');
        }

        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.style.cssText = `
            width: 100px;
            height: 140px;
            border: 1px solid #000;
            border-radius: 5px;
            background-color: #fff;
            position: relative;
            display: inline-block;
            margin: 0 5px;
            color: ${['♥', '♦'].includes(card.suit) ? 'red' : 'black'};
            transition: transform 0.2s;
            touch-action: none;
        `;
        
        if (index !== null) {
            cardElement.dataset.index = index;
        }

        cardElement.innerHTML = `
            <div style="position: absolute; top: 5px; left: 5px; font-size: 20px; font-weight: bold;">
                ${card.value}${card.suit}
            </div>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 36px;">
                ${card.suit}
            </div>
            <div style="position: absolute; bottom: 5px; right: 5px; transform: rotate(180deg); font-size: 20px; font-weight: bold;">
                ${card.value}${card.suit}
            </div>
        `;

        return cardElement;
    }

    handleStart(e, card, index, isTouch = false) {
        if (isTouch) {
            // Store initial touch info but don't prevent default yet
            const coords = this.getEventCoords(e);
            this.touchStartPos = {
                x: coords.clientX,
                y: coords.clientY,
                time: Date.now()
            };
            
            // Add one-time move handler to detect scroll intent
            const detectScroll = (moveEvent) => {
                const currentY = moveEvent.touches[0].clientY;
                const deltaY = Math.abs(currentY - this.touchStartPos.y);
                const deltaX = Math.abs(moveEvent.touches[0].clientX - this.touchStartPos.x);
                const deltaTime = Date.now() - this.touchStartPos.time;
                
                // If moving more vertical than horizontal in first 100ms, likely a scroll
                if (deltaY > deltaX && deltaY > 10 && deltaTime < 100) {
                    this.touchScrolling = true;
                    return;
                }
                
                // Not scrolling, start the drag
                moveEvent.preventDefault();
                this.initiateDrag(moveEvent, card, index);
            };
            
            card.addEventListener('touchmove', detectScroll, { once: true });
            return;
        }
        
        // For mouse events, proceed normally
        e.preventDefault();
        this.initiateDrag(e, card, index);
    }

    initiateDrag(e, card, index) {
        this.isDragging = true;
        this.draggedCard = { card, index };
        const coords = this.getEventCoords(e);
        const rect = e.target.getBoundingClientRect();
        
        this.dragOffset = {
            x: coords.clientX - rect.left,
            y: coords.clientY - rect.top
        };
        
        this.lastMousePos = {
            x: coords.clientX,
            y: coords.clientY
        };

        this.createFloatingCard(card);
        this.updateFloatingCardPosition(coords);
    }

    getEventCoords(e) {
        if (e.touches) {
            return {
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            };
        }
        return {
            clientX: e.clientX,
            clientY: e.clientY
        };
    }

    createFloatingCard(card) {
        const floatingCard = this.createCardElement(card);
        floatingCard.id = 'floating-card';
        floatingCard.style.position = 'fixed';
        floatingCard.style.zIndex = '1000';
        floatingCard.style.pointerEvents = 'none';
        floatingCard.style.cursor = 'grabbing';
        document.body.appendChild(floatingCard);
    }

    updateFloatingCardPosition(coords) {
        const floatingCard = document.getElementById('floating-card');
        if (floatingCard) {
            const x = coords.clientX - this.dragOffset.x;
            const y = coords.clientY - this.dragOffset.y;
            
            // Calculate tilt based on movement
            const deltaX = coords.clientX - this.lastMousePos.x;
            const tiltAmount = Math.max(Math.min(deltaX * 0.5, 15), -15);
            
            floatingCard.style.left = `${x}px`;
            floatingCard.style.top = `${y}px`;
            floatingCard.style.transform = `rotate(${tiltAmount}deg)`;
            
            this.lastMousePos = { x: coords.clientX, y: coords.clientY };
        }
    }

    handleMove(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        const coords = this.getEventCoords(e);
        this.updateFloatingCardPosition(coords);
    }

    handleEnd(cardSlot) {
        if (!this.isDragging) return;

        const floatingCard = document.getElementById('floating-card');
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
                this.selectedCard = this.draggedCard.index;
                return true;
            }
        }

        if (floatingCard) {
            floatingCard.remove();
        }

        this.isDragging = false;
        this.draggedCard = null;
        return false;
    }

    clearSelectedCard() {
        this.selectedCard = null;
        const floatingCard = document.getElementById('floating-card');
        if (floatingCard) {
            floatingCard.remove();
        }
    }
}