import { gql } from '@apollo/client';

export const REGISTER_USERNAME_MUTATION = gql`
  mutation RegisterUsername($username: String!) {
    registerUsername(username: $username) {
      success
      username
      message
    }
  }
`;

export const ROLL_DICE_MUTATION = gql`
  mutation RollDice($expression: String!) {
    rollDice(expression: $expression) {
      expression
      results
      total
      canvasData {
        dice {
          canvasId
          diceType
          position {
            x
            y
            z
          }
          isVirtual
          virtualRolls
          result
        }
        events {
          id
          type
          diceId
          userId
          timestamp
          data {
            position {
              x
              y
              z
            }
            velocity {
              x
              y
              z
            }
      result
            diceType
            isVirtual
            virtualRolls
            highlightColor
          }
        }
      }
    }
  }
`;

export const SET_USER_COLOR_MUTATION = gql`
  mutation SetUserColor($color: String!) {
    setUserColor(color: $color) {
      success
      color
      message
    }
  }
`;

export const SEND_CHAT_MESSAGE_MUTATION = gql`
  mutation SendChatMessage($message: String!) {
    sendChatMessage(message: $message) {
      id
      type
      timestamp
      user
      message
    }
  }
`;

// Activity feed operations
export const GET_ACTIVITIES_QUERY = gql`
  query GetActivities {
    activities {
      id
      type
      timestamp
      user
      message
      roll {
        expression
        results
        total
        canvasData {
          dice {
            canvasId
            diceType
            position {
              x
              y
              z
            }
            isVirtual
            virtualRolls
        result
          }
          events {
            id
            type
            diceId
            userId
            timestamp
          }
        }
      }
    }
  }
`;

export const ACTIVITY_ADDED_SUBSCRIPTION = gql`
  subscription ActivityAdded {
    activityAdded {
      id
      type
      timestamp
      user
      message
      roll {
        expression
        results
        total
        canvasData {
          dice {
            canvasId
            diceType
            position {
              x
              y
              z
            }
            isVirtual
            virtualRolls
        result
          }
          events {
            id
            type
            diceId
            userId
            timestamp
          }
        }
      }
    }
  }
`;

export const GET_ACTIVE_USERS_QUERY = gql`
  query GetActiveUsers {
    activeUsers {
      sessionId
      username
      color
      isActive
    }
  }
`;

export const USER_LIST_CHANGED_SUBSCRIPTION = gql`
  subscription UserListChanged {
    userListChanged {
      sessionId
      username
      color
      isActive
    }
  }
`;

// Canvas synchronization operations for Phase 3
export const CANVAS_EVENTS_SUBSCRIPTION = gql`
  subscription CanvasEventsUpdated {
    canvasEventsUpdated {
      id
      type
      diceId
      userId
      timestamp
      data {
        position {
          x
          y
          z
        }
        velocity {
          x
          y
          z
        }
        result
        diceType
        isVirtual
        virtualRolls
        highlightColor
      }
    }
  }
`;
