export class PhysicsEngine {
    constructor() {
        // Physics parameters
        this.friction = 0.98;
        this.restitution = 0.5;
        this.minSpeed = 0.1;
        this.maxSpeed = 30;
        this.rotationFriction = 0.95;
        this.maxRotationSpeed = 10;
        this.rotationSpeed = 0.3;
        this.maxHeldRotation = 15;
        
        // Dynamic parameters
        this.maxSystemEnergy = 1000;
        this.maxFriction = 0.8;
        this.frictionRecoveryRate = 0.001;
        this.energyScale = 0.1;
        this.maxFrictionIncreaseRate = 0.002;
        
        // Speed limits
        this.baseMaxSpeed = 40;
        this.minMaxSpeed = 15;
        this.currentMaxSpeed = this.baseMaxSpeed;
        this.maxAngularSpeed = 15;
    }

    updatePosition(card, currentCard) {
        if (card === currentCard) return;

        const props = card.physicsProps;
        
        // Apply movement
        props.x += props.vx;
        props.y += props.vy;
        props.angle += props.angularVelocity;
        
        // Apply friction
        props.vx *= this.friction;
        props.vy *= this.friction;
        props.angularVelocity *= this.rotationFriction;
        
        // Stop if very slow
        if (Math.abs(props.vx) < this.minSpeed) props.vx = 0;
        if (Math.abs(props.vy) < this.minSpeed) props.vy = 0;
        if (Math.abs(props.angularVelocity) < this.minSpeed) props.angularVelocity = 0;
        
        // Handle wall collisions
        this.handleWallCollisions(props);
    }

    handleWallCollisions(props) {
        const windowPadding = 20;
        const cardWidth = 128;
        const cardHeight = 192;

        if (props.x < windowPadding) {
            props.x = windowPadding;
            props.vx = Math.abs(props.vx) * this.restitution;
            props.angularVelocity *= -0.5;
        } else if (props.x > window.innerWidth - cardWidth - windowPadding) {
            props.x = window.innerWidth - cardWidth - windowPadding;
            props.vx = -Math.abs(props.vx) * this.restitution;
            props.angularVelocity *= -0.5;
        }
        
        if (props.y < windowPadding) {
            props.y = windowPadding;
            props.vy = Math.abs(props.vy) * this.restitution;
        } else if (props.y > window.innerHeight - cardHeight - windowPadding) {
            props.y = window.innerHeight - cardHeight - windowPadding;
            props.vy = -Math.abs(props.vy) * this.restitution;
        }
    }

    resolveCollision(card1, card2, currentCard) {
        const dx = card2.physicsProps.x - card1.physicsProps.x;
        const dy = card2.physicsProps.y - card1.physicsProps.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        const nx = dx / distance;
        const ny = dy / distance;
        
        const dvx = card2.physicsProps.vx - card1.physicsProps.vx;
        const dvy = card2.physicsProps.vy - card1.physicsProps.vy;
        const normalVelocity = dvx * nx + dvy * ny;
        
        if (normalVelocity > 0) return;
        
        if (card1 === currentCard || card2 === currentCard) {
            this.resolveHeldCardCollision(card1, card2, currentCard, nx, ny, normalVelocity);
        } else {
            this.resolveFreeCardCollision(card1, card2, nx, ny, normalVelocity);
        }
    }

    resolveHeldCardCollision(card1, card2, currentCard, nx, ny, normalVelocity) {
        const heldCard = card1 === currentCard ? card1 : card2;
        const freeCard = card1 === currentCard ? card2 : card1;
        
        const heldSpeed = Math.sqrt(
            heldCard.physicsProps.vx * heldCard.physicsProps.vx + 
            heldCard.physicsProps.vy * heldCard.physicsProps.vy
        );
        
        const speedThreshold = 3;
        const speedScale = Math.max(0, (heldSpeed - speedThreshold) / speedThreshold);
        const impulse = -(1 + this.restitution) * normalVelocity * 0.5 * (1 + speedScale);
        
        if (card1 === currentCard) {
            this.applyImpulse(card2, impulse, nx, ny, 1);
        } else {
            this.applyImpulse(card1, impulse, nx, ny, -1);
        }
        
        freeCard.physicsProps.angularVelocity += (heldSpeed * speedScale) * 0.2 * (Math.random() * 2 - 1);
    }

    resolveFreeCardCollision(card1, card2, nx, ny, normalVelocity) {
        const impulse = -(1 + this.restitution) * normalVelocity * 0.5;
        
        this.applyImpulse(card1, impulse, nx, ny, -1);
        this.applyImpulse(card2, impulse, nx, ny, 1);
        
        const rotationTransfer = (card1.physicsProps.angularVelocity + card2.physicsProps.angularVelocity) * 0.3;
        card1.physicsProps.angularVelocity = rotationTransfer;
        card2.physicsProps.angularVelocity = -rotationTransfer;
    }

    applyImpulse(card, impulse, nx, ny, direction) {
        card.physicsProps.vx = Math.min(
            Math.abs(card.physicsProps.vx + impulse * nx * direction),
            this.maxSpeed
        ) * Math.sign(card.physicsProps.vx + impulse * nx * direction);
        
        card.physicsProps.vy = Math.min(
            Math.abs(card.physicsProps.vy + impulse * ny * direction),
            this.maxSpeed
        ) * Math.sign(card.physicsProps.vy + impulse * ny * direction);
    }

    checkCollision(card1, card2) {
        const margin = 20;
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
}