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
        
        // Physics properties
        this.friction = 0.95; // Slowdown factor
        this.restitution = 0.7; // Bounciness
        this.minSpeed = 0.1; // Minimum speed before coming to rest
        
        // Bind methods
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.updatePhysics = this.updatePhysics.bind(this);
        
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        
        // Start physics loop
        requestAnimationFrame(this.updatePhysics);
        
        this.init();
    }
    
    init() {
        const deckContainer = document.createElement('div');
        deckContainer.className = 'deck-container';
        deckContainer.style.position = 'absolute';
        deckContainer.style.right = '40px';
        deckContainer.style.top = '50%';
        deckContainer.style.transform = 'translateY(-50%)';
        deckContainer.style.textAlign = 'center';
        // Enable pointer events for the deck container
        deckContainer.style.pointerEvents = 'auto';
        
        const label = document.createElement('div');
        label.textContent = 'Click to draw a card!';
        label.style.marginBottom = '15px';
        label.style.color = '#6b4d3c';
        label.style.fontFamily = 'Crimson Text, Georgia, serif';
        label.style.fontSize = '14px';
        label.style.fontStyle = 'italic';
        deckContainer.appendChild(label);
        
        // Create deck with stacked effect
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

        // Add pattern only to top card
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
        
        deckContainer.appendChild(deck);
        this.container.appendChild(deckContainer);
    }
	  
    getRandomCard() {
        const suit = this.suits[Math.floor(Math.random() * this.suits.length)];
        const value = this.values[Math.floor(Math.random() * this.values.length)];
        return { suit, value, id: Date.now() };
    }
    
    drawCard() {
        const { suit, value, id } = this.getRandomCard();
        
        const card = document.createElement('div');
        card.className = 'draggable-card';
        card.id = `card-${id}`;
        
        // Style the card
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
            transition: 'none', // Remove transition for smooth physics
            border: '1px solid #ddd',
            pointerEvents: 'auto',
            right: '40px',
            top: '50%',
            transform: 'translateY(-50%) rotate(0deg)',
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
        
        // Add physics properties to the card
        card.physicsProps = {
            x: window.innerWidth - 168, // 40px from right + card width
            y: window.innerHeight / 2 - 96, // Centered - half height
            vx: 0, // Velocity X
            vy: 0, // Velocity Y
            rotation: 0,
            angularVelocity: 0
        };
        
        // Update card position
        this.updateCardPosition(card);
        
        card.addEventListener('mousedown', (e) => this.handleMouseDown(e, card));
        
        this.container.appendChild(card);
        this.cards.push(card);
    }

    updateCardPosition(card) {
        const { x, y, rotation } = card.physicsProps;
        card.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
        card.style.right = null;
        card.style.top = null;
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
        
        // Reset card's velocity when grabbed
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
        
        // Calculate velocity based on mouse movement
        const deltaX = e.clientX - this.lastMousePos.x;
        const deltaY = e.clientY - this.lastMousePos.y;
        
        this.currentCard.physicsProps.x = newX;
        this.currentCard.physicsProps.y = newY;
        this.currentCard.physicsProps.vx = deltaX;
        this.currentCard.physicsProps.vy = deltaY;
        
        // Update rotation based on horizontal movement
        const rotation = Math.max(Math.min(deltaX * 0.5, 15), -15);
        this.currentCard.physicsProps.rotation = rotation;
        this.currentCard.physicsProps.angularVelocity = deltaX * 0.5;
        
        this.updateCardPosition(this.currentCard);
        
        this.lastMousePos = {
            x: e.clientX,
            y: e.clientY
        };
    }

    handleMouseUp() {
        if (!this.currentCard) return;
        
        // Keep the current velocity for physics simulation
        const deltaX = this.lastMousePos.x - this.offset.x;
        const deltaY = this.lastMousePos.y - this.offset.y;
        
        this.currentCard.physicsProps.vx = deltaX * 0.1;
        this.currentCard.physicsProps.vy = deltaY * 0.1;
        
        this.isDragging = false;
        this.currentCard = null;
    }

    checkCollision(card1, card2) {
        const rect1 = {
            x: card1.physicsProps.x,
            y: card1.physicsProps.y,
            width: 128,
            height: 192
        };
        
        const rect2 = {
            x: card2.physicsProps.x,
            y: card2.physicsProps.y,
            width: 128,
            height: 192
        };
        
        return !(rect1.x + rect1.width < rect2.x ||
                rect1.x > rect2.x + rect2.width ||
                rect1.y + rect1.height < rect2.y ||
                rect1.y > rect2.y + rect2.height);
    }

    resolveCollision(card1, card2) {
        // Calculate center points
        const center1 = {
            x: card1.physicsProps.x + 64,
            y: card1.physicsProps.y + 96
        };
        const center2 = {
            x: card2.physicsProps.x + 64,
            y: card2.physicsProps.y + 96
        };
        
        // Calculate collision normal
        const dx = center2.x - center1.x;
        const dy = center2.y - center1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return; // Prevent division by zero
        
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calculate relative velocity
        const dvx = card2.physicsProps.vx - card1.physicsProps.vx;
        const dvy = card2.physicsProps.vy - card1.physicsProps.vy;
        
        // Calculate impulse
        const impulse = (dvx * nx + dvy * ny) * (1 + this.restitution) / 2;
        
        // Apply impulse
        card1.physicsProps.vx -= impulse * nx;
        card1.physicsProps.vy -= impulse * ny;
        card2.physicsProps.vx += impulse * nx;
        card2.physicsProps.vy += impulse * ny;
        
        // Transfer some angular velocity
        const avgAngularVelocity = (card1.physicsProps.angularVelocity + card2.physicsProps.angularVelocity) / 2;
        card1.physicsProps.angularVelocity = avgAngularVelocity * this.restitution;
        card2.physicsProps.angularVelocity = -avgAngularVelocity * this.restitution;
    }

    updatePhysics() {
        // Update each card's position based on velocity
        for (const card of this.cards) {
            if (this.currentCard === card) continue; // Skip card being dragged
            
            const props = card.physicsProps;
            
            // Apply velocity
            props.x += props.vx;
            props.y += props.vy;
            props.rotation += props.angularVelocity;
            
            // Apply friction
            props.vx *= this.friction;
            props.vy *= this.friction;
            props.angularVelocity *= this.friction;
            
            // Stop if moving very slowly
            if (Math.abs(props.vx) < this.minSpeed) props.vx = 0;
            if (Math.abs(props.vy) < this.minSpeed) props.vy = 0;
            if (Math.abs(props.angularVelocity) < this.minSpeed) props.angularVelocity = 0;
            
            // Bounce off window edges
            const windowPadding = 20;
            if (props.x < windowPadding) {
                props.x = windowPadding;
                props.vx = Math.abs(props.vx) * this.restitution;
            } else if (props.x > window.innerWidth - 128 - windowPadding) {
                props.x = window.innerWidth - 128 - windowPadding;
                props.vx = -Math.abs(props.vx) * this.restitution;
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
        
        // Check for collisions between cards
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

    destroy() {
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        this.cards.forEach(card => {
            card.removeEventListener('mousedown', this.handleMouseDown);
        });
    }
}