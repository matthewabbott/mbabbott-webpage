import { PhysicsEngine } from './cardPhysics.js';
import { InputHandler } from './inputHandler.js';

export class CardDeck {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.container.style.pointerEvents = 'none';
        
        this.cards = [];
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        this.physics = new PhysicsEngine();
        this.input = new InputHandler(this.physics);
        
        // Bind methods
        this.updatePhysics = this.updatePhysics.bind(this);
        this.clearCards = this.clearCards.bind(this);
        this.updateCardPosition = this.updateCardPosition.bind(this);
        
        // Document-level event listeners
		this.input.boundMouseMove = (e) => this.input.handleMove(e, this.updateCardPosition);
		this.input.boundTouchMove = (e) => this.input.handleMove(e, this.updateCardPosition);

		document.addEventListener('mousemove', this.input.boundMouseMove);
		document.addEventListener('mouseup', this.input.boundMouseUp);
		document.addEventListener('touchmove', this.input.boundTouchMove, { passive: false });
		document.addEventListener('touchend', this.input.boundTouchEnd);
		document.addEventListener('touchcancel', this.input.boundTouchEnd);
		
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
            touch-action: manipulation;
        `;
        clearButton.addEventListener('mouseover', () => clearButton.style.background = '#8a181b');
        clearButton.addEventListener('mouseout', () => clearButton.style.background = '#aa1f23');
        clearButton.addEventListener('click', this.clearCards);
        deckContainer.appendChild(clearButton);
        
        // Add label
        const label = document.createElement('div');
        label.textContent = 'Tap or click to draw a card!';
        label.style.cssText = `
            margin-bottom: 15px;
            color: #6b4d3c;
            font-family: 'Crimson Text', Georgia, serif;
            font-size: 14px;
            font-style: italic;
        `;
        deckContainer.appendChild(label);
        
        // Create deck
        const deck = this.createDeckVisual();
        deckContainer.appendChild(deck);
        
        this.container.appendChild(deckContainer);
    }
    
    createDeckVisual() {
        const deck = document.createElement('div');
        deck.className = 'deck';
        deck.style.cssText = `
            cursor: pointer;
            position: relative;
            width: 128px;
            height: 192px;
            display: inline-block;
            touch-action: manipulation;
        `;

        // Create bottom cards (plain red)
        for (let i = 0; i < 2; i++) {
            const stackCard = document.createElement('div');
            stackCard.className = 'deck-card';
            stackCard.style.cssText = `
                position: absolute;
                width: 100%;
                height: 100%;
                background: #aa1f23;
                border-radius: 8px;
                border: 8px solid #fff;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                transform: translateY(${i * -1}px) translateX(${i * 1}px);
                transition: transform 0.2s ease;
                touch-action: manipulation;
            `;
            deck.appendChild(stackCard);
        }

        // Create top card with pattern
        const topCard = document.createElement('div');
        topCard.className = 'deck-card';
        topCard.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            background: #aa1f23;
            border-radius: 8px;
            border: 8px solid #fff;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transform: translateY(-2px) translateX(2px);
            transition: transform 0.2s ease;
            touch-action: manipulation;
        `;

        const pattern = document.createElement('div');
        pattern.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 120px;
            background: linear-gradient(45deg, #d4af37 25%, transparent 25%),
                        linear-gradient(-45deg, #d4af37 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #d4af37 75%),
                        linear-gradient(-45deg, transparent 75%, #d4af37 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            border: 4px solid #d4af37;
        `;

        topCard.appendChild(pattern);
        deck.appendChild(topCard);

        // Add event listeners for deck interactions
        deck.addEventListener('click', (e) => {
            if (this.input.shouldDrawCard(e)) {
                this.drawCard();
            }
        });
        
        deck.addEventListener('touchstart', (e) => {
            this.input.lastTouchTime = Date.now();
            this.input.touchMoveCount = 0;
        });
        
        deck.addEventListener('touchend', (e) => {
            if (this.input.shouldDrawCard(e)) {
                this.drawCard();
            }
        });

        // Add hover effects
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
            pointerEvents: 'auto',
            touchAction: 'none'
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
        
        // Add both mouse and touch event listeners
        card.addEventListener('mousedown', (e) => this.input.handleStart(e, card, false));
        card.addEventListener('touchstart', (e) => this.input.handleStart(e, card, true));
        
        this.container.appendChild(card);
        this.cards.push(card);
    }
    
    updateCardPosition(card) {
        const { x, y, angle } = card.physicsProps;
        card.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    }
    
    updatePhysics() {
        // Update positions and apply physics
        for (const card of this.cards) {
            this.physics.updatePosition(card, this.input.currentCard);
            this.updateCardPosition(card);
        }
        
        // Check for collisions
        for (let i = 0; i < this.cards.length; i++) {
            for (let j = i + 1; j < this.cards.length; j++) {
                const card1 = this.cards[i];
                const card2 = this.cards[j];
                
                if (this.physics.checkCollision(card1, card2)) {
                    this.physics.resolveCollision(card1, card2, this.input.currentCard);
                }
            }
        }
        
        requestAnimationFrame(this.updatePhysics);
    }
    
    getRandomCard() {
        const suit = this.suits[Math.floor(Math.random() * this.suits.length)];
        const value = this.values[Math.floor(Math.random() * this.values.length)];
        return { suit, value, id: Date.now() };
    }
    
    clearCards() {
        this.cards.forEach(card => card.remove());
        this.cards = [];
    }
    
	destroy() {
		if (this.input.boundMouseMove) {
			document.removeEventListener('mousemove', this.input.boundMouseMove);
		}
		document.removeEventListener('mouseup', this.input.boundMouseUp);
		if (this.input.boundTouchMove) {
			document.removeEventListener('touchmove', this.input.boundTouchMove);
		}
		document.removeEventListener('touchend', this.input.boundTouchEnd);
		document.removeEventListener('touchcancel', this.input.boundTouchEnd);
		this.clearCards();
	}
}