import React from "react";
import ReactDOMServer from "react-dom/server";
import { RouterContextProvider, RouterContextInterface } from "@utils/router";

export function render(value: RouterContextInterface, App) {
  return ReactDOMServer.renderToString(
    <RouterContextProvider value={value}>
      <App />
    </RouterContextProvider>
  );
}
