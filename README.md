# file-based-routing

mocking [next.js routing system](https://nextjs.org/docs/routing/introduction)

给定 `url`，返回其对应组件，若没有对应组件，返回 `404`

思路如下：

1. 读取 `pages` 目录下的文件结构，生成路由表
2. 根据 `url` 在路由表里找到其对应页面组件
3. 将组件渲染成 HTML 返回给前端
