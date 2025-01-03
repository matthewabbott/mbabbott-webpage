class CardDeck {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.cards = [];
        this.isDragging = false;
        this.currentCard = null;
        this.offset = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        this.init();
    }
    
    init() {
        // Create deck container
        const deckContainer = document.createElement('div');
        deckContainer.className = 'deck-container';
        deckContainer.style.position = 'absolute';
        deckContainer.style.right = '40px';
        deckContainer.style.top = '50%';
        deckContainer.style.transform = 'translateY(-50%)';
        deckContainer.style.textAlign = 'center';
        
        // Add label
        const label = document.createElement('div');
        label.textContent = 'Spawn a playing card!';
        label.style.marginBottom = '15px';
        label.style.color = '#333';
        label.style.fontFamily = 'Arial, sans-serif';
        label.style.fontSize = '14px';
        deckContainer.appendChild(label);
        
        // Create deck
        const deck = document.createElement('div');
        deck.className = 'deck';
        deck.style.cursor = 'pointer';
        deck.style.position = 'relative';
        deck.style.width = '128px';
        deck.style.height = '192px';
        deck.style.display = 'inline-block';
        
        // Create card stack visual
        for (let i = 0; i < 3; i++) {
            const card = document.createElement('div');
            card.className = 'deck-card';
            card.style.position = 'absolute';
            card.style.width = '100%';
            card.style.height = '100%';
            card.style.backgroundColor = 'white';
            card.style.borderRadius = '8px';
            card.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            card.style.border = '1px solid #ddd';
            card.style.transform = `translateY(${i * -1}px) translateX(${i * 1}px) rotateX(45deg)`;
            card.style.transition = 'transform 0.2s ease';
            deck.appendChild(card);
        }
        
        deck.addEventListener('click', () => this.drawCard());
        deck.addEventListener('mouseover', () => {
            deck.querySelectorAll('.deck-card').forEach((card, i) => {
                card.style.transform = `translateY(${i * -2}px) translateX(${i * 2}px) rotateX(45deg)`;
            });
        });
        deck.addEventListener('mouseout', () => {
            deck.querySelectorAll('.deck-card').forEach((card, i) => {
                card.style.transform = `translateY(${i * -1}px) translateX(${i * 1}px) rotateX(45deg)`;
            });
        });
        
        deckContainer.appendChild(deck);
        this.container.appendChild(deckContainer);
        
        // Setup drag handling
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
    }
    
    getRandomCard() {
        const suit = this.suits[Math.floor(Math.random() * this.suits.length)];
        const value = this.values[Math.floor(Math.random() * this.values.length)];
        return { suit, value, id: Date.now() };
    }
    
    drawCard() {
        const { suit, value, id } = this.getRandomCard();
        
        const card = document.createElement('div');
        card.className = 'card';
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
        
        // Add card content
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
        
        const x = e.clientX - this.offset.x;
        const y = e.clientY - this.offset.y;
        
        // Calculate movement direction for tilt
        const deltaX = e.clientX - this.lastMousePos.x;
        const tiltAmount = Math.max(Math.min(deltaX * 0.5, 15), -15); // Limit tilt to 15 degrees
        
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
}