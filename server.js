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
        template = await vite.transformIndexHtml(url, template);

        const paths = url.split("/");
        let route = router.childRoutes;
        let match;

        for (let i = 1; i < paths.length; i++) {
          match = route.find((r) => r.path === paths[i] || r.isDynamic);
          route = match?.childRoutes;

          if (!route) break;
        }

        console.log("match:", match);

        if (!match) {
          res.status(404).end("Not Found");
          return;
        } else {
          res.body = "Hello World";
        }

        const module = await vite.ssrLoadModule(match.dirname);
        render = () => ReactDOMServer.renderToString(module.default());
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
      console.log("appHtml: ", appHtml);

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
