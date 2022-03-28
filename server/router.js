import fs from "fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// export interface RouterType {
//   path: string;
//   isDynamic: boolean;
//   dirname: string;
//   childRoutes: RouterType[];
// }

async function scanDir(dirname, isFile) {
  const filename = dirname.split(path.sep).at(-1);
  const nameEndPos =
    filename[0] === "[" ? filename.lastIndexOf(".") : filename.indexOf(".");
  const name = nameEndPos > -1 ? filename.substring(0, nameEndPos) : filename;
  const route = {
    path: name,
    isDynamic: name[0] === "[" && name[name.length - 1] === "]",
    dirname,
    childRoutes: [],
  };
  if (isFile) return route;

  const dirents = await fs.opendir(dirname);
  for await (const dirent of dirents) {
    const childRoute = await scanDir(
      path.join(dirname, dirent.name),
      dirent.isFile()
    );
    route.childRoutes.push(childRoute);
  }

  route.childRoutes.sort((a, b) => {
    if (a.isDynamic && b.isDynamic) {
      const pa = a.path,
        pb = b.path;
      if (pa[1] === "[") return 1;
      if (pb[1] === "[") return -1;
      if (pa[1] === ".") return 1;
      if (pb[1] === ".") return -1;
    }
    if (a.isDynamic) return 1;
    if (b.isDynamic) return -1;
  });

  return route;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = await scanDir(path.join(__dirname, "../src/pages"));

/**
 * match the NEXT.JS routing system: dynamic-routes
 * https://nextjs.org/docs/routing/dynamic-routes
 */
export const matchRoutes = (url) => {
  const paths = url.slice(1).split("/");
  if (paths.at(-1) === "") paths.pop();
  const query = {};
  let match = router;

  const dfsMatchRoutes = (routes, i) => {
    if (i === paths.length) return true;
    for (let j = 0; j < routes.length; j++) {
      const r = routes[j];
      if (r.path !== paths[i] && !r.isDynamic) continue;
      match = r;
      let dynamicParam =
        r.path[1] === "[" ? r.path.slice(2, -2) : r.path.slice(1, -1);
      if (r.isDynamic) {
        if (dynamicParam[0] === ".") {
          query[dynamicParam.slice(3)] = paths.filter((_, k) => k >= i);
          return true;
        }
        query[dynamicParam] = paths[i];
      }
      if (dfsMatchRoutes(r.childRoutes, i + 1)) return true;
      delete query[dynamicParam];
    }
    return false;
  };

  const isMatch = dfsMatchRoutes(router.childRoutes, 0);

  if (match.childRoutes.length > 0) {
    match = match.childRoutes.find(
      (r) => r.path === "index" || r.path[1] === "["
    );
  }

  const filePaths = path.resolve(match.dirname).split(path.sep);
  const APP_URL = filePaths.slice(filePaths.indexOf("pages") + 1).join("/");

  return { match: isMatch ? match : null, query, APP_URL };
};
