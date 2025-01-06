export class InputHandler {
	
	constructor(physics) {
		this.physics = physics;
		this.isDragging = false;
		this.currentCard = null;
		this.offset = { x: 0, y: 0 };
		this.lastPos = { x: 0, y: 0 };
		
		// Touch state tracking
		this.touchScrolling = false;
		this.touchStartY = 0;
		this.lastTouchTime = 0;
		this.touchMoveCount = 0;
		
		// Store bound handlers as properties
		this.boundMouseMove = null;  // Will be set when CardDeck adds the listener
		this.boundMouseUp = () => this.handleEnd();
		this.boundTouchMove = null;  // Will be set when CardDeck adds the listener
		this.boundTouchEnd = () => this.handleEnd();
	}

    // Helper to get coordinates from either mouse or touch event
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

	handleStart(e, card, isTouch = false) {
		if (isTouch) {
			// Store initial touch info but don't prevent default yet
			const coords = this.getEventCoords(e);
			this.touchStartY = coords.clientY;
			this.touchStartX = coords.clientX;
			this.touchStartTime = Date.now();
			this.touchMoveCount = 0;
			
			// One-time move handler to detect scroll intent
			const detectScroll = (moveEvent) => {
				const currentY = moveEvent.touches[0].clientY;
				const deltaY = Math.abs(currentY - this.touchStartY);
				const deltaX = Math.abs(moveEvent.touches[0].clientX - this.touchStartX);
				const deltaTime = Date.now() - this.touchStartTime;
				
				// If moving more vertical than horizontal in first 100ms, likely a scroll
				if (deltaY > deltaX && deltaY > 10 && deltaTime < 100) {
					this.touchScrolling = true;
					return;
				}
				
				// Not scrolling, start the drag
				moveEvent.preventDefault();
				this.initiateDrag(moveEvent, card);
			};
			
			card.addEventListener('touchmove', detectScroll, { once: true });
			return;
		}
		
		// For mouse events, proceed normally
		e.preventDefault();
		this.initiateDrag(e, card);
	}

	initiateDrag(e, card) {
		this.isDragging = true;
		this.currentCard = card;
		
		const coords = this.getEventCoords(e);
		const rect = card.getBoundingClientRect();
		
		this.offset = {
			x: coords.clientX - rect.left,
			y: coords.clientY - rect.top
		};
		
		this.lastPos = {
			x: coords.clientX,
			y: coords.clientY
		};
		
		// Initialize physics values
		card.physicsProps.lastDeltaX = 0;
		card.physicsProps.lastDeltaY = 0;
		card.physicsProps.vx = 0;
		card.physicsProps.vy = 0;
		card.physicsProps.angularVelocity = 0;
		
		card.style.zIndex = Date.now();
	}

    handleMove(e, updateCardPosition) {
        if (!this.isDragging || !this.currentCard) return;
        
        e.preventDefault();
        if (e.touches) this.touchMoveCount++;
        
        const coords = this.getEventCoords(e);
        const newX = coords.clientX - this.offset.x;
        const newY = coords.clientY - this.offset.y;
        
        const deltaX = coords.clientX - this.lastPos.x;
        const deltaY = coords.clientY - this.lastPos.y;
        
        // Update physics properties
        this.currentCard.physicsProps.x = newX;
        this.currentCard.physicsProps.y = newY;
        this.currentCard.physicsProps.vx = deltaX;
        this.currentCard.physicsProps.vy = deltaY;
        
        // Handle rotation
        const currentAngle = this.currentCard.physicsProps.angle;
        const rotationDelta = deltaX * this.physics.rotationSpeed;
        const newAngle = currentAngle + rotationDelta;
        
        this.currentCard.physicsProps.angle = Math.max(
            -this.physics.maxHeldRotation,
            Math.min(this.physics.maxHeldRotation, newAngle)
        );
        
        // Store for release
        this.currentCard.physicsProps.lastDeltaX = deltaX;
        this.currentCard.physicsProps.lastDeltaY = deltaY;
        
        updateCardPosition(this.currentCard);
        
        this.lastPos = {
            x: coords.clientX,
            y: coords.clientY
        };
    }

    handleEnd() {
        if (!this.currentCard) return;
        
        const props = this.currentCard.physicsProps;
        
        // Apply release velocity
        props.vx = Math.min(Math.abs(props.lastDeltaX), this.physics.maxSpeed) 
            * Math.sign(props.lastDeltaX) * 1.2;
        props.vy = Math.min(Math.abs(props.lastDeltaY), this.physics.maxSpeed) 
            * Math.sign(props.lastDeltaY) * 1.2;
        
        // Apply release rotation
        props.angularVelocity = props.lastDeltaX * 0.3;
        
        this.isDragging = false;
        this.currentCard = null;
    }

    shouldDrawCard(e) {
        if (e.type === 'click') {
            return !this.isDragging;
        } else if (e.type === 'touchend') {
            const touchDuration = Date.now() - this.lastTouchTime;
            return touchDuration < 200 && this.touchMoveCount < 3;
        }
        return false;
    }
}