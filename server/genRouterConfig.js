const fs = require("fs/promises");
const path = require("path");

// export interface RouterType {
//   path: string;
//   isDynamic: boolean;
//   dirname: string;
//   childRoutes: RouterType[];
// }

async function scanDir(dirname, isFile) {
  const paths = dirname.split("/");
  const name = paths[paths.length - 1].split(".")[0];
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

  return route;
}

module.exports = scanDir;
