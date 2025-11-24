export const typeDefs = `#graphql
  type Query {
    activities: [Activity!]!
    activeUsers: [User!]!
  }

  type Mutation {
    sendChatMessage(message: String!): Activity!
    rollDice(expression: String!): Roll!
    registerUsername(username: String!): UsernameRegistrationResult!
    setUserColor(color: String!): SetUserColorResult!
  }

  type Subscription {
    activityAdded: Activity!
    userListChanged: [User!]!
    canvasEventsUpdated: CanvasEvent!
  }

  type Activity {
    id: String!
    type: String!
    user: String
    message: String
    timestamp: String!
    roll: Roll
  }

  type Roll {
    expression: String!
    results: [Int!]!
    total: Int!
    canvasData: CanvasData
  }

  type CanvasData {
    dice: [DiceRoll!]!
    events: [CanvasEvent!]!
  }

  type DiceRoll {
    canvasId: String!
    diceType: String!
    position: Position
    isVirtual: Boolean!
    virtualRolls: [Int!]
    result: Int
  }

  type Position {
    x: Float!
    y: Float!
    z: Float!
  }

  type CanvasEvent {
    id: String!
    type: CanvasEventType!
    diceId: String!
    userId: String!
    timestamp: String!
    data: CanvasEventData
  }

  enum CanvasEventType {
    DICE_SPAWN
    DICE_THROW
    DICE_SETTLE
    DICE_HIGHLIGHT
    DICE_REMOVE
    CANVAS_CLEAR
  }

  type CanvasEventData {
    position: Position
    velocity: Velocity
    result: Int
    diceType: String
    isVirtual: Boolean
    virtualRolls: [Int!]
    highlightColor: String
  }

  type Velocity {
    x: Float!
    y: Float!
    z: Float!
  }

  type User {
    sessionId: String!
    username: String!
    color: String
    isActive: Boolean!
  }

  type UsernameRegistrationResult {
    success: Boolean!
    username: String!
    message: String!
  }

  type SetUserColorResult {
    success: Boolean!
    color: String
    message: String!
  }
`; 