import fs from "fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// export interface RouterType {
//   // 路由名称: foo -> foo, [foo] -> foo
//   path: string;
//   // 是否为动态路由: [foo], [...foo], [[...foo]]
//   isDynamic: boolean;
//   // 路由组件文件的系统路径
//   dirname: string;
//   // 子路由信息
//   childRoutes: RouterType[];
// }

async function scanDir(dirname, isFile) {
  // 提取 dirname 文件路径中的最后一个层级，作为 route.path 和 url 进行匹配
  // path.sep 为文件路径的分隔符，Windows：'\\'; Linux: '/'; 兼容各平台
  const filename = dirname.split(path.sep).at(-1);
  const nameEndPos =
    filename[0] === "[" ? filename.lastIndexOf(".") : filename.indexOf(".");
  const name = nameEndPos > -1 ? filename.substring(0, nameEndPos) : filename;

  const route = {
    path: name,
    isDynamic: name[0] === "[" && name.at(-1) === "]",
    dirname,
    childRoutes: [],
  };

  // 是文件，直接返回生成的路由
  if (isFile) return route;

  // 是文件夹，则开始扫描，递归生成路由，放到 childRoutes 数组中
  const dirents = await fs.opendir(dirname);
  for await (const dirent of dirents) {
    const childRoute = await scanDir(
      path.join(dirname, dirent.name),
      dirent.isFile()
    );
    route.childRoutes.push(childRoute);
  }

  route.childRoutes.sort((a, b) => {
    // 每种匹配模式有不同的优先级，需要对其进行排序
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
  // 例：
  // url: '/blog/nextJS/' 其对应组件为 /blog/[bid]
  // paths: ['blog', 'nextJS']
  const paths = url.slice(1).split("/");
  if (paths.at(-1) === "") paths.pop();
  // 存储动态路由的 query 信息
  // query: { bid: 'nextJS' }
  const query = {};
  // match 初始化为根路由, 调用 dfsMatchRoutes 后，值为匹配的路由组件
  let match = router;

  // 根据 paths 在路由表中进行 dfs 搜索，匹配路由组件
  // 匹配成功返回 true，不成功返回 false
  const dfsMatchRoutes = (routes, i) => {
    if (i === paths.length) return true;

    for (let j = 0; j < routes.length; j++) {
      const r = routes[j];
      if (r.path !== paths[i] && !r.isDynamic) continue;
      // 记录当前路由组件 r
      match = r;
      let dynamicParam =
        r.path[1] === "[" ? r.path.slice(2, -2) : r.path.slice(1, -1);
      // 如果匹配到了 [...] or [[...]] 组件，则解析剩下的 url，并直接返回 true
      if (dynamicParam[0] === ".") {
        query[dynamicParam.slice(3)] = paths.filter((_, k) => k >= i);
        return true;
      }
      if (dfsMatchRoutes(r.childRoutes, i + 1)) {
        // 如果是动态路由，更新 query
        r.isDynamic && (query[dynamicParam] = paths[i]);
        return true;
      }
    }
    return false;
  };

  const isMatch = dfsMatchRoutes(router.childRoutes, 0);

  // 如果匹配到的 路由 为文件夹，则选取文件夹下的 'index' 文件 or [[...]] 组件
  if (match.childRoutes.length > 0) {
    match = match.childRoutes.find(
      (r) => r.path === "index" || r.path[1] === "["
    );
  }

  // 生成匹配组件的 url 路径
  const filePaths = path.resolve(match.dirname).split(path.sep);
  const APP_URL = filePaths.slice(filePaths.indexOf("pages") + 1).join("/");

  return { match: isMatch ? match : null, query, APP_URL };
};
