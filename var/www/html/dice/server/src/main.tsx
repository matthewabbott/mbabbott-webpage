import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

import { ApolloClient, InMemoryCache, HttpLink, split, from, ApolloLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { ApolloProvider } from '@apollo/client';
import TimeoutLink from 'apollo-link-timeout';
import { getSessionId } from './utils/sessionId';

const sessionId = getSessionId();
console.log('Using session ID:', sessionId);

const isDevelopment = import.meta.env.DEV;
const baseUrl = isDevelopment ? 'localhost:4000' : window.location.host;
const protocol = isDevelopment ? 'http' : window.location.protocol === 'https:' ? 'https' : 'http';
const wsProtocol = isDevelopment ? 'ws' : window.location.protocol === 'https:' ? 'wss' : 'ws';

const httpLink = new HttpLink({
  uri: `${protocol}://${baseUrl}/dice/graphql`,
  headers: {
    'x-session-id': sessionId
  }
});

const timeoutLink = new TimeoutLink(5000);

// timeoutLink is cast because its type definitions (Observable<unknown>)
// are not directly compatible with Apollo Client 3's expected Link types (Observable<FetchResult>).
const httpLinkWithTimeout = from([timeoutLink as ApolloLink, httpLink]);

const wsClient = createClient({
  url: `${wsProtocol}://${baseUrl}/dice/graphql`,
  connectionParams: {
    sessionId: sessionId
  },
  keepAlive: 10000,
});

const wsLink = new GraphQLWsLink(wsClient);

window.addEventListener('beforeunload', (event) => {
  console.log('Tab is closing, cleaning up WebSocket connection...');

  if (wsClient) {
    wsClient.dispose();
    console.log('WebSocket connection disposed');
  }

  event.preventDefault();
  event.returnValue = '';
});

// Queries/mutations to HTTP endpoint (with timeout), subscriptions to WebSocket
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLinkWithTimeout
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});


function AppWrapper() {
  useEffect(() => {
    return () => {
      console.log('App component unmounting, cleaning up connections...');
      if (wsClient) {
        wsClient.dispose();
      }
    };
  }, []);

  return (
    <StrictMode>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<AppWrapper />);
