class CardDeck {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.container.style.pointerEvents = 'none';
        
        this.cards = [];
        this.isDragging = false;
        this.currentCard = null;
        this.offset = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        // Base physics parameters
		this.friction = 0.98;        // Base friction (higher = more slippery)
		this.restitution = 0.5;      // Bounciness of collisions (lower = less bouncy)
		this.minSpeed = 0.1;         // Speed threshold for stopping
		this.maxSpeed = 30;          // Simple speed cap
		this.rotationFriction = 0.95; // Separate friction for rotation
		this.maxRotationSpeed = 10;   // Cap on rotation speed
		this.rotationSpeed = 0.3;      // How quickly cards rotate while dragging
		this.maxHeldRotation = 15;     // Maximum rotation while dragging
        
        // Dynamic friction parameters
        this.maxSystemEnergy = 1000;
        this.maxFriction = 0.8;
        this.frictionRecoveryRate = 0.001;
        this.energyScale = 0.1;
        this.maxFrictionIncreaseRate = 0.002;
        
        // Speed limit parameters
        this.baseMaxSpeed = 40; // Base maximum speed for any card
        this.minMaxSpeed = 15;  // Minimum speed limit during high energy
        this.currentMaxSpeed = this.baseMaxSpeed;
        this.maxAngularSpeed = 15; // Maximum rotation speed
        
        this.lastFrameTime = performance.now();
        
        // Bind methods
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.updatePhysics = this.updatePhysics.bind(this);
        this.clearCards = this.clearCards.bind(this);
        
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        
        requestAnimationFrame(this.updatePhysics);
        
        this.createDeckAndControls();
    }
    
    createDeckAndControls() {
        const deckContainer = document.createElement('div');
        deckContainer.className = 'deck-container';
        deckContainer.style.position = 'absolute';
        deckContainer.style.right = '40px';
        deckContainer.style.top = '50%';
        deckContainer.style.transform = 'translateY(-50%)';
        deckContainer.style.textAlign = 'center';
        deckContainer.style.pointerEvents = 'auto';
        
        // Add clear button
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear Cards';
        clearButton.style.cssText = `
            background: #aa1f23;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            margin-bottom: 15px;
            cursor: pointer;
            font-family: 'Crimson Text', Georgia, serif;
            transition: background-color 0.2s;
        `;
        clearButton.addEventListener('mouseover', () => {
            clearButton.style.background = '#8a181b';
        });
        clearButton.addEventListener('mouseout', () => {
            clearButton.style.background = '#aa1f23';
        });
        clearButton.addEventListener('click', this.clearCards);
        deckContainer.appendChild(clearButton);
        
        // Add label
        const label = document.createElement('div');
        label.textContent = 'Click to draw a card!';
        label.style.marginBottom = '15px';
        label.style.color = '#6b4d3c';
        label.style.fontFamily = 'Crimson Text, Georgia, serif';
        label.style.fontSize = '14px';
        label.style.fontStyle = 'italic';
        deckContainer.appendChild(label);
        
        // Create deck with single pattern on top
        const deck = this.createDeckVisual();
        deckContainer.appendChild(deck);
        
        this.container.appendChild(deckContainer);
    }
    
    createDeckVisual() {
        const deck = document.createElement('div');
        deck.className = 'deck';
        deck.style.cursor = 'pointer';
        deck.style.position = 'relative';
        deck.style.width = '128px';
        deck.style.height = '192px';
        deck.style.display = 'inline-block';

        // Create bottom cards (plain red)
        for (let i = 0; i < 2; i++) {
            const stackCard = document.createElement('div');
            stackCard.className = 'deck-card';
            stackCard.style.position = 'absolute';
            stackCard.style.width = '100%';
            stackCard.style.height = '100%';
            stackCard.style.background = '#aa1f23';
            stackCard.style.borderRadius = '8px';
            stackCard.style.border = '8px solid #fff';
            stackCard.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            stackCard.style.transform = `translateY(${i * -1}px) translateX(${i * 1}px)`;
            stackCard.style.transition = 'transform 0.2s ease';
            deck.appendChild(stackCard);
        }

        // Create top card with pattern
        const topCard = document.createElement('div');
        topCard.className = 'deck-card';
        topCard.style.position = 'absolute';
        topCard.style.width = '100%';
        topCard.style.height = '100%';
        topCard.style.background = '#aa1f23';
        topCard.style.borderRadius = '8px';
        topCard.style.border = '8px solid #fff';
        topCard.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        topCard.style.transform = 'translateY(-2px) translateX(2px)';
        topCard.style.transition = 'transform 0.2s ease';

        const pattern = document.createElement('div');
        pattern.style.position = 'absolute';
        pattern.style.top = '50%';
        pattern.style.left = '50%';
        pattern.style.transform = 'translate(-50%, -50%)';
        pattern.style.width = '80px';
        pattern.style.height = '120px';
        pattern.style.background = `
            linear-gradient(45deg, #d4af37 25%, transparent 25%),
            linear-gradient(-45deg, #d4af37 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #d4af37 75%),
            linear-gradient(-45deg, transparent 75%, #d4af37 75%)
        `;
        pattern.style.backgroundSize = '20px 20px';
        pattern.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
        pattern.style.border = '4px solid #d4af37';

        topCard.appendChild(pattern);
        deck.appendChild(topCard);

        deck.addEventListener('click', () => this.drawCard());
        deck.addEventListener('mouseover', () => {
            deck.querySelectorAll('.deck-card').forEach((card, i) => {
                card.style.transform = `translateY(${i * -2}px) translateX(${i * 2}px)`;
            });
        });
        deck.addEventListener('mouseout', () => {
            deck.querySelectorAll('.deck-card').forEach((card, i) => {
                card.style.transform = `translateY(${i * -1}px) translateX(${i * 1}px)`;
            });
        });

        return deck;
    }
    
    clearCards() {
        this.cards.forEach(card => {
            card.remove();
        });
        this.cards = [];
    }
    
    drawCard() {
        const { suit, value, id } = this.getRandomCard();
        
        const card = document.createElement('div');
        card.className = 'draggable-card';
        card.id = `card-${id}`;
        
        Object.assign(card.style, {
            position: 'absolute',
            width: '128px',
            height: '192px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            cursor: 'move',
            userSelect: 'none',
            color: ['♥', '♦'].includes(suit) ? 'red' : 'black',
            border: '1px solid #ddd',
            pointerEvents: 'auto'
        });
        
        card.innerHTML = `
            <div style="position: absolute; top: 8px; left: 8px; font-size: 24px; font-weight: bold;">
                ${value}${suit}
            </div>
            <div style="position: absolute; bottom: 8px; right: 8px; font-size: 24px; font-weight: bold; transform: rotate(180deg);">
                ${value}${suit}
            </div>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 48px;">
                ${suit}
            </div>
        `;
        
        // Initialize physics properties
        card.physicsProps = {
            x: window.innerWidth - 168,
            y: window.innerHeight / 2 - 96,
            vx: 0,
            vy: 0,
            angle: 0,
            angularVelocity: 0
        };
        
        this.updateCardPosition(card);
        
        card.addEventListener('mousedown', (e) => this.handleMouseDown(e, card));
        
        this.container.appendChild(card);
        this.cards.push(card);
    }
    
    updateCardPosition(card) {
        const { x, y, angle } = card.physicsProps;
        card.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    }
    
	handleMouseDown(e, card) {
		e.preventDefault();
		e.stopPropagation();
		
		this.isDragging = true;
		this.currentCard = card;
		
		const rect = card.getBoundingClientRect();
		this.offset = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
		
		this.lastMousePos = {
			x: e.clientX,
			y: e.clientY
		};
		
		// Initialize lastDelta values to prevent undefined access on quick click
		card.physicsProps.lastDeltaX = 0;
		card.physicsProps.lastDeltaY = 0;
		
		// Reset velocities when grabbed
		card.physicsProps.vx = 0;
		card.physicsProps.vy = 0;
		card.physicsProps.angularVelocity = 0;
		
		card.style.zIndex = Date.now();
	}
    
	handleMouseMove(e) {
		if (!this.isDragging || !this.currentCard) return;
		
		e.preventDefault();
		
		const newX = e.clientX - this.offset.x;
		const newY = e.clientY - this.offset.y;
		
		// Calculate instantaneous velocity for collision response
		const deltaX = e.clientX - this.lastMousePos.x;
		const deltaY = e.clientY - this.lastMousePos.y;
		
		// Update position and velocities
		this.currentCard.physicsProps.x = newX;
		this.currentCard.physicsProps.y = newY;
		this.currentCard.physicsProps.vx = deltaX;  // Store actual velocity
		this.currentCard.physicsProps.vy = deltaY;
		
		// Limited rotation while held
		const currentAngle = this.currentCard.physicsProps.angle;
		const rotationDelta = deltaX * this.rotationSpeed;
		const newAngle = currentAngle + rotationDelta;
		
		this.currentCard.physicsProps.angle = Math.max(
			-this.maxHeldRotation,
			Math.min(this.maxHeldRotation, newAngle)
		);
		
		// Store values for release
		this.currentCard.physicsProps.lastDeltaX = deltaX;
		this.currentCard.physicsProps.lastDeltaY = deltaY;
		
		this.updateCardPosition(this.currentCard);
		
		this.lastMousePos = {
			x: e.clientX,
			y: e.clientY
		};
	}

	handleMouseUp() {
		if (!this.currentCard) return;
		
		const props = this.currentCard.physicsProps;
		
		// Safety check - make sure lastDelta values exist
		props.lastDeltaX = props.lastDeltaX || 0;
		props.lastDeltaY = props.lastDeltaY || 0;
		
		// Apply release velocity with simple speed cap
		props.vx = Math.min(Math.abs(props.lastDeltaX), this.maxSpeed) * Math.sign(props.lastDeltaX) * 0.8;
		props.vy = Math.min(Math.abs(props.lastDeltaY), this.maxSpeed) * Math.sign(props.lastDeltaY) * 0.8;
		
		// Apply release rotation, scaled down
		props.angularVelocity = props.lastDeltaX * 0.3;
		
		this.isDragging = false;
		this.currentCard = null;
	}

	resolveCollision(card1, card2) {
		const dx = card2.physicsProps.x - card1.physicsProps.x;
		const dy = card2.physicsProps.y - card1.physicsProps.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		
		if (distance === 0) return;
		
		// Normalize collision vector
		const nx = dx / distance;
		const ny = dy / distance;
		
		// Calculate relative velocity
		const dvx = card2.physicsProps.vx - card1.physicsProps.vx;
		const dvy = card2.physicsProps.vy - card1.physicsProps.vy;
		const normalVelocity = dvx * nx + dvy * ny;
		
		// Only resolve if objects are moving toward each other
		if (normalVelocity > 0) return;
		
		// Handle collision differently if either card is held
		if (card1 === this.currentCard || card2 === this.currentCard) {
			const heldCard = card1 === this.currentCard ? card1 : card2;
			const freeCard = card1 === this.currentCard ? card2 : card1;
			
			// Calculate the held card's speed
			const heldSpeed = Math.sqrt(
				heldCard.physicsProps.vx * heldCard.physicsProps.vx + 
				heldCard.physicsProps.vy * heldCard.physicsProps.vy
			);
			
			// Only apply significant impulse if the held card is moving fast enough
			const speedThreshold = 3;  // Minimum speed to transfer momentum
			const speedScale = Math.max(0, (heldSpeed - speedThreshold) / speedThreshold);
			
			// Calculate impulse based on held card's movement
			const impulse = -(1 + this.restitution) * normalVelocity * 0.5 * (1 + speedScale);
			
			// Only apply impulse to the free card
			if (card1 === this.currentCard) {
				card2.physicsProps.vx = Math.min(Math.abs(card2.physicsProps.vx + impulse * nx), this.maxSpeed)
					* Math.sign(card2.physicsProps.vx + impulse * nx);
				card2.physicsProps.vy = Math.min(Math.abs(card2.physicsProps.vy + impulse * ny), this.maxSpeed)
					* Math.sign(card2.physicsProps.vy + impulse * ny);
			} else {
				card1.physicsProps.vx = Math.min(Math.abs(card1.physicsProps.vx - impulse * nx), this.maxSpeed)
					* Math.sign(card1.physicsProps.vx - impulse * nx);
				card1.physicsProps.vy = Math.min(Math.abs(card1.physicsProps.vy - impulse * ny), this.maxSpeed)
					* Math.sign(card1.physicsProps.vy - impulse * ny);
			}
			
			// Add some rotation based on the collision
			freeCard.physicsProps.angularVelocity += (heldSpeed * speedScale) * 0.2 * (Math.random() * 2 - 1);
			
		} else {
			// Collision response for free cards
			const impulse = -(1 + this.restitution) * normalVelocity * 0.5;
			
			card1.physicsProps.vx = Math.min(Math.abs(card1.physicsProps.vx - impulse * nx), this.maxSpeed) 
				* Math.sign(card1.physicsProps.vx - impulse * nx);
			card1.physicsProps.vy = Math.min(Math.abs(card1.physicsProps.vy - impulse * ny), this.maxSpeed)
				* Math.sign(card1.physicsProps.vy - impulse * ny);
				
			card2.physicsProps.vx = Math.min(Math.abs(card2.physicsProps.vx + impulse * nx), this.maxSpeed)
				* Math.sign(card2.physicsProps.vx + impulse * nx);
			card2.physicsProps.vy = Math.min(Math.abs(card2.physicsProps.vy + impulse * ny), this.maxSpeed)
				* Math.sign(card2.physicsProps.vy + impulse * ny);
			
			const rotationTransfer = (card1.physicsProps.angularVelocity + card2.physicsProps.angularVelocity) * 0.3;
			card1.physicsProps.angularVelocity = rotationTransfer;
			card2.physicsProps.angularVelocity = -rotationTransfer;
		}
	}

	updatePhysics() {
		for (const card of this.cards) {
			// Only skip physics updates for held card, not collision checks
			if (card !== this.currentCard) {
				const props = card.physicsProps;
				
				// Apply movement
				props.x += props.vx;
				props.y += props.vy;
				props.angle += props.angularVelocity;
				
				// Apply constant friction
				props.vx *= this.friction;
				props.vy *= this.friction;
				props.angularVelocity *= this.rotationFriction;
				
				// Stop if moving very slowly
				if (Math.abs(props.vx) < this.minSpeed) props.vx = 0;
				if (Math.abs(props.vy) < this.minSpeed) props.vy = 0;
				if (Math.abs(props.angularVelocity) < this.minSpeed) props.angularVelocity = 0;
				
				// Handle wall collisions
				const windowPadding = 20;
				if (props.x < windowPadding) {
					props.x = windowPadding;
					props.vx = Math.abs(props.vx) * this.restitution;
					props.angularVelocity *= -0.5;
				} else if (props.x > window.innerWidth - 128 - windowPadding) {
					props.x = window.innerWidth - 128 - windowPadding;
					props.vx = -Math.abs(props.vx) * this.restitution;
					props.angularVelocity *= -0.5;
				}
				
				if (props.y < windowPadding) {
					props.y = windowPadding;
					props.vy = Math.abs(props.vy) * this.restitution;
				} else if (props.y > window.innerHeight - 192 - windowPadding) {
					props.y = window.innerHeight - 192 - windowPadding;
					props.vy = -Math.abs(props.vy) * this.restitution;
				}
				
				this.updateCardPosition(card);
			}
		}
		
		// Check for collisions (including with held card)
		for (let i = 0; i < this.cards.length; i++) {
			for (let j = i + 1; j < this.cards.length; j++) {
				const card1 = this.cards[i];
				const card2 = this.cards[j];
				
				if (this.checkCollision(card1, card2)) {
					this.resolveCollision(card1, card2);
				}
			}
		}
		
		requestAnimationFrame(this.updatePhysics);
	}
    
    checkCollision(card1, card2) {
        const margin = 20; // Reduced collision box for more natural-looking interactions
        const rect1 = {
            x: card1.physicsProps.x + margin,
            y: card1.physicsProps.y + margin,
            width: 128 - margin * 2,
            height: 192 - margin * 2
        };
        
        const rect2 = {
            x: card2.physicsProps.x + margin,
            y: card2.physicsProps.y + margin,
            width: 128 - margin * 2,
            height: 192 - margin * 2
        };
        
        return !(rect1.x + rect1.width < rect2.x ||
                rect1.x > rect2.x + rect2.width ||
                rect1.y + rect1.height < rect2.y ||
                rect1.y > rect2.y + rect2.height);
    }
    
    getRandomCard() {
        const suit = this.suits[Math.floor(Math.random() * this.suits.length)];
        const value = this.values[Math.floor(Math.random() * this.values.length)];
        return { suit, value, id: Date.now() };
    }
    
    destroy() {
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        this.clearCards();
    }
}