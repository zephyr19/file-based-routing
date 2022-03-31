import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import express from "express";
import { matchRoutes } from "./server/router.js";

async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === "production"
) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const resolve = (p) => path.resolve(__dirname, p);

  const indexProd = isProd
    ? fs.readFileSync(resolve("dist/client/index.html"), "utf-8")
    : "";

  const app = express();

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite;
  if (!isProd) {
    const { createServer } = await import("vite");
    vite = await createServer({
      root,
      logLevel: "info",
      server: {
        middlewareMode: "ssr",
        watch: {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          usePolling: true,
          interval: 100,
        },
      },
    });
    // use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    app.use(require("compression")());
    app.use(
      require("serve-static")(resolve("dist/client"), {
        index: false,
      })
    );
  }

  app.use("*", async (req, res) => {
    try {
      // const url = req.originalUrl === "/" ? "/index" : req.originalUrl;
      const url = req.originalUrl;
      console.log("url:", url);

      const { match, query, APP_URL } = matchRoutes(url);

      if (!match) {
        res.status(404).end("Not Found");
        return;
      }

      let template, render, appModule;

      if (!isProd) {
        // always read fresh template in dev
        template = fs.readFileSync(resolve("index.html"), "utf-8");

        template = template.replace(
          "<!--IMPORT_APP_STATEMENT-->",
          `
<script type="module">
	import React from "react";
  import ReactDOM from "react-dom";
  import { RouterContextProvider } from "/utils/router";
  import App from "/src/pages/${APP_URL}";

  ReactDOM.hydrate(
    /*#__PURE__*/ React.createElement(
      RouterContextProvider,
      {
        value: ${JSON.stringify({ query: query })}
      },
      /*#__PURE__*/ React.createElement(App, null)
    ),
    document.getElementById("app")
  );
</script>
          `
        );
        template = await vite.transformIndexHtml(url, template);
        appModule = await vite.ssrLoadModule(match.dirname);
        render = (await vite.ssrLoadModule("/src/entry-server.tsx")).render;
      } else {
        template = indexProd;
        render = require("./dist/server/entry-server.js").render;
      }

      const appHtml = render({ query }, appModule.default);

      const html = template.replace(`<!--app-html-->`, appHtml);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      !isProd && vite.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });

  return { app, vite };
}

createServer().then(({ app }) =>
  app.listen(3000, () => {
    console.log("http://localhost:3000");
  })
);
