// @ts-nocheck
const fs = require("fs");
const path = require("path");
const express = require("express");
const ReactDOMServer = require("react-dom/server");
const scanDir = require("./server/genRouterConfig.js");

async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === "production"
) {
  const resolve = (p) => path.resolve(__dirname, p);

  const indexProd = isProd
    ? fs.readFileSync(resolve("dist/client/index.html"), "utf-8")
    : "";

  const router = await scanDir(path.join(__dirname, "src/pages"));
  console.log(router);

  const app = express();

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite;
  if (!isProd) {
    vite = await require("vite").createServer({
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
      const url = req.originalUrl;
      console.log("url:", url);

      let template, render;
      if (!isProd) {
        // always read fresh template in dev
        template = fs.readFileSync(resolve("index.html"), "utf-8");

        const paths = url.split("/");
        let route = router.childRoutes;
        let match;
        let APP_URL = "";
        const queries = {};

        for (let i = 1; i < paths.length; i++) {
          match = route.find((r) => r.path === paths[i] || r.isDynamic);
          APP_URL += "/" + match?.path;
          if (match?.isDynamic) {
            queries[
              match.path.substring(1).substring(0, match.path.length - 2)
            ] = paths[i];
          }
          route = match?.childRoutes;

          if (!route) break;
        }

        if (!match) {
          res.status(404).end("Not Found");
          return;
        } else {
          res.body = "Hello World";
        }

        template = template.replace(
          "<!--IMPORT_APP_STATEMENT-->",
          `
<script type="module">
  import ReactDOM from "react-dom";
  import App from "/src/pages${APP_URL}";

  ReactDOM.hydrate(App(${JSON.stringify(
    queries
  )}), document.getElementById("app"));
</script>
          `
        );
        template = await vite.transformIndexHtml(url, template);

        const module = await vite.ssrLoadModule(match.dirname);
        render = () => ReactDOMServer.renderToString(module.default(queries));
      } else {
        template = indexProd;
        render = require("./dist/server/entry-server.js").render;
      }

      const context = {};
      const appHtml = render(url, context);

      if (context.url) {
        // Somewhere a `<Redirect>` was rendered
        return res.redirect(301, context.url);
      }

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
