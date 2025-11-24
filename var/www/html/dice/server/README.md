# TTRPG Dice Roller 🎲

Multiplayer dice rolling application for tabletop role-playing games.

**🌐 Live Demo: [mbabbott.com/dice](https://mbabbott.com/dice)**

## ✨ Features

### 🎲 **Dice Physics System**
- **Dice!**: d4, d6, d8, d10, d12, d20 modeled in three.js (credit to https://github.com/byWulf/threejs-dice for the math)
- **Physics!**: 3D physics simulation using cannon-es
- **Sandbox**: Pick up and throw the dice after they spawn in

### 🎮 **Interface**
- **3D Canvas**: Full-screen 3D environment with orbital camera controls
- **Hover-to-Peek Controls**: Bottom panels for dice and camera controls
- **Highlighting System**: Click dice to highlight their roll. Or click a roll to jump to the resulting dice

### 🌐 **Real-time Multiplayer**
- **Live Collaboration**: See other players' dice rolls in real-time
- **Chat!**: See other players' messages in the chat room.
- **User Management**: Join as Anonymous or select a username
- **Color Customization**: Personal color selection for user identification

### 🎨 **UI/UX design**
- **Translucent Panels**: Glass-morphism design
- **Responsive Layout**: Resizable sidebars and adaptive interface
- **Smooth Animations**: Polished transitions and hover effects

## 🚀 Quick Start

### **Play Online**
Visit **[mbabbott.com/dice](https://mbabbott.com/dice)** to start rolling immediately!

### **Local Development**

```bash
# Clone the repository
git clone https://github.com/your-username/dice-roller.git
cd dice-roller

# Install dependencies
npm install

# Start development servers
npm run dev     # Frontend (Vite dev server)
npm run server  # Backend (GraphQL + WebSocket server)
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

## 🏗️ Technical Architecture

### **Frontend Stack**
- **React 18** + **TypeScript** for type-safe component development
- **Three.js** + **React Three Fiber** for 3D graphics and physics
- **Apollo Client** for GraphQL state management and real-time subscriptions
- **Tailwind CSS** for utility-first styling
- **Vite** for fast development and optimized builds

### **Backend Stack**
- **GraphQL Yoga** for flexible API with subscriptions
- **WebSocket** for real-time multiplayer communication
- **Node.js** + **TypeScript** for server-side logic
- **Session Management** for user tracking and state persistence

### **Physics Engine**
- **cannon-es** for realistic 3D physics simulation
- **Custom Dice Classes** for each dice type with accurate geometry
- **ConvexPolyhedron** shapes for complex dice (D4, D8, D10, D12, D20)

## 🎲 Dice Implementation

Each dice type features accurate 3D geometry and physics:

```typescript
// Physical dice with realistic physics
const d20 = new DiceD20({ size: 1 });
d20.throwDice(1.0); // Natural physics throw
const result = d20.getUpperValue(); // 1-20

// Virtual dice for large quantities
const virtualRoll = rollProcessor.processRoll("1000d6");
// Rolls a single die because my VPS isn't powerful enough. You gotta bear with me, but its result shows the BIG number
```

### **Supported Dice Types**
- **d4 (Tetrahedron)**: Reads from bottom face (realistic behavior)
- **d6 (Cube)**: Standard six-sided dice
- **d8 (Octahedron)**: Eight-sided dice
- **d10 (Pentagonal Trapezohedron)**: Ten-sided dice
- **d12 (Dodecahedron)**: Twelve-sided dice
- **d20 (Icosahedron)**: Twenty-sided dice

## 🔧 Development

### **Project Structure**
```
src/
├── components/          # React components
│   ├── dice/           # 3D dice geometry components
│   ├── physics/        # Physics world components
│   └── controls/       # UI control panels
├── hooks/              # Custom React hooks
├── physics/            # Dice physics engine
│   ├── dice/          # Individual dice implementations
│   └── types/         # TypeScript type definitions
├── services/           # Business logic services
└── graphql/           # GraphQL schema and operations
```

### **Key Commands**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run server       # Start GraphQL server
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### **Environment Setup**
The application automatically detects development vs production:
- **Development**: Uses `localhost:4000` for GraphQL endpoint
- **Production**: Uses current domain with `/dice/graphql` endpoint

## 🚀 Deployment

The application is configured for deployment at `/dice` subpath:

### **Build for Production**
```bash
npm run build:prod
```

### **Server Requirements**
- **Node.js 16+** for the GraphQL server
- **Static hosting** for the built frontend files
- **WebSocket support** for real-time features

### **Nginx Configuration**
```nginx
# Frontend static files
location /dice/ {
    alias /path/to/dice-roller/dist/;
    try_files $uri $uri/ /dice/index.html;
}

# Backend GraphQL endpoint
location /dice/graphql {
    proxy_pass http://localhost:4000/dice/graphql;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## 🙏 Acknowledgments

- **cannon-es** - Modern physics engine for realistic dice simulation
- **Three.js** - Powerful 3D graphics library
- **React Three Fiber** - Elegant React integration for Three.js
- **GraphQL Yoga** - Flexible GraphQL server with subscription support
- **Apollo Client** - Comprehensive GraphQL client with real-time capabilities
- **Threejs Dice**(https://github.com/byWulf/threejs-dice) - Dice implementation for an older version of Three.js, which I adapted for Three.js v0.176.0
