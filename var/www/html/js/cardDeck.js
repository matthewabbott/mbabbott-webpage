class CardDeck {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        // Ensure the container doesn't block interactions with cards
        this.container.style.pointerEvents = 'none';
        
        this.cards = [];
        this.isDragging = false;
        this.currentCard = null;
        this.offset = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        // Bind methods
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        
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
        card.style.position = 'absolute';
        card.style.width = '128px';
        card.style.height = '192px';
        card.style.backgroundColor = 'white';
        card.style.borderRadius = '8px';
        card.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        card.style.cursor = 'move';
        card.style.userSelect = 'none';
        card.style.color = ['♥', '♦'].includes(suit) ? 'red' : 'black';
        card.style.transition = 'transform 0.1s ease';
        card.style.right = '40px';
        card.style.top = '50%';
        card.style.transform = 'translateY(-50%)';
        card.style.border = '1px solid #ddd';
        // Enable pointer events for the card
        card.style.pointerEvents = 'auto';
        
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
        
        card.addEventListener('mousedown', (e) => this.handleMouseDown(e, card));
        
        this.container.appendChild(card);
        this.cards.push(card);
    }
    
    handleMouseDown(e, card) {
        e.preventDefault();  // Prevent text selection
        e.stopPropagation(); // Stop event from bubbling
        
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
        
        // Bring card to front
        card.style.zIndex = Date.now();
    }
    
    handleMouseMove(e) {
        if (!this.isDragging || !this.currentCard) return;
        
        e.preventDefault();  // Prevent unwanted selections
        
        const x = e.clientX - this.offset.x;
        const y = e.clientY - this.offset.y;
        
        // Calculate movement direction for tilt
        const deltaX = e.clientX - this.lastMousePos.x;
        const tiltAmount = Math.max(Math.min(deltaX * 0.5, 15), -15);
        
        this.currentCard.style.left = `${x}px`;
        this.currentCard.style.top = `${y}px`;
        this.currentCard.style.transform = `rotate(${tiltAmount}deg)`;
        
        this.lastMousePos = {
            x: e.clientX,
            y: e.clientY
        };
    }
    
    handleMouseUp() {
        if (this.currentCard) {
            this.currentCard.style.transform = 'rotate(0deg)';
        }
        this.isDragging = false;
        this.currentCard = null;
    }

    // Add cleanup method
    destroy() {
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        this.cards.forEach(card => {
            card.removeEventListener('mousedown', this.handleMouseDown);
        });
    }
}