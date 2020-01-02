// @flow
import React from "react";
import App, { Container } from "next/app";
import { ApolloProvider } from "@apollo/react-hooks";
import { BaseStyles } from "@nice-boys/components";
import { getClient } from "../components/WithApollo/client";

const client = getClient();

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;

    return (
      <Container>
        <ApolloProvider client={client}>
          <BaseStyles />
          <Component {...pageProps} />
        </ApolloProvider>
      </Container>
    );
  }
}

// @ts-ignore
export default MyApp;
