import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  NormalizedCacheObject,
} from "apollo-boost";

let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = require("isomorphic-unfetch");
}

function create(initialState?: NormalizedCacheObject, host?: string) {
  return new ApolloClient({
    connectToDevTools: process.browser,
    ssrMode: !process.browser, // Disables forceFetch on the server (so queries are only run once)
    link: new HttpLink({
      uri: `${host || ""}/api/graphql`,
      credentials: "include",
    }),
    cache: new InMemoryCache().restore(initialState || {}),
  });
}

export function getClient(initialState?: NormalizedCacheObject, host?: string) {
  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = create(initialState, host);
  }

  return apolloClient;
}
