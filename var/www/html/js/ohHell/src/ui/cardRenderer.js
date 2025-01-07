// src/ui/cardRenderer.js
export class CardRenderer {
    static createCardElement(card, index = null) {
        if (!card || !card.suit || !card.value) {
            console.error('Invalid card object:', card);
            return document.createElement('div');
        }

        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.style.width = '100px';
        cardElement.style.height = '140px';
        cardElement.style.border = '1px solid #000';
        cardElement.style.borderRadius = '5px';
        cardElement.style.backgroundColor = '#fff';
        cardElement.style.position = 'relative';
        cardElement.style.display = 'inline-block';
        cardElement.style.margin = '0 5px';
        cardElement.style.color = card.isRed() ? 'red' : 'black';
        cardElement.style.transition = 'transform 0.2s';
        
        if (index !== null) {
            cardElement.dataset.index = index;
        }
        
        cardElement.innerHTML = `
            <div style="position: absolute; top: 5px; left: 5px; font-size: 20px; font-weight: bold;">${card.toString()}</div>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 36px;">${card.suit}</div>
            <div style="position: absolute; bottom: 5px; right: 5px; transform: rotate(180deg); font-size: 20px; font-weight: bold;">${card.toString()}</div>
        `;
        
        return cardElement;
    }

    static createHiddenCard(position = 'vertical') {
        const hiddenCard = document.createElement('div');
        hiddenCard.className = 'card hidden-card' + (position === 'vertical' ? ' overlapped' : '');
        hiddenCard.style.width = '100px';
        hiddenCard.style.height = '140px';
        hiddenCard.style.border = '1px solid #000';
        hiddenCard.style.borderRadius = '5px';
        hiddenCard.style.position = 'absolute';
        hiddenCard.style.backgroundImage = 'linear-gradient(45deg, #fff 45%, #ddd 50%, #fff 55%)';
        
        if (position === 'vertical') {
            hiddenCard.style.transform = 'rotate(90deg)';
        }
        
        return hiddenCard;
    }
}