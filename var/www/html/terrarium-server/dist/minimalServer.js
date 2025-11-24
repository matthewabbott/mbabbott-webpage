import { createServer } from 'node:http';
import { createSchema, createYoga } from 'graphql-yoga';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
const typeDefs = /* GraphQL */ `
  type Query {
    ping: String!
  }

  type Mutation {
    echo(message: String!): String!
  }

  type Subscription {
    tick: Int!
  }
`;
const resolvers = {
    Query: {
        ping: () => 'pong'
    },
    Mutation: {
        echo: (_, args) => args.message
    },
    Subscription: {
        tick: {
            subscribe: async function* () {
                let counter = 0;
                while (true) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    counter += 1;
                    yield { tick: counter };
                }
            }
        }
    }
};
const schema = createSchema({ typeDefs, resolvers });
const yoga = createYoga({
    schema,
    graphqlEndpoint: '/mini/graphql'
});
const server = createServer(yoga);
const wsServer = new WebSocketServer({
    server,
    path: '/mini/graphql'
});
useServer({ schema }, wsServer);
const PORT = Number(process.env.MINI_PORT ?? 4200);
const HOST = process.env.MINI_HOST ?? '127.0.0.1';
server.listen(PORT, HOST, () => {
    console.log(`Minimal GraphQL server ready on http://${HOST}:${PORT}/mini/graphql`);
});
export default {};
