# art-supabase-hr

Art Supabase Pro 的 HR 人力资源业务应用。本仓只维护 HR 页面、业务 API、业务类型与适配代码；登录、租户、菜单、权限、布局、路由、公共组件、Store 和 Supabase 公共客户端统一由 `art-supabase-pro` 提供。

## 独立运行

```bash
pnpm install
pnpm dev
```

默认访问 `http://localhost:3013`。独立运行时，HR 自身菜单提升为一级菜单；接入主平台时仍保留主平台的 HR 应用目录。

## 检查与部署

```bash
pnpm check
pnpm build
pnpm preview
```

生产构建统一输出到 `docs/`，默认静态路径为 `/art-supabase-hr/`，并自动生成 `docs/.nojekyll`，可直接作为 Pages 发布目录。

## 与主仓协作

HR 业务修改在本仓提交并推送；随后在 `art-supabase-pro` 更新 `modules/art-supabase-hr` 子模块指针。公共能力只在主仓维护，禁止复制认证、菜单、权限、布局、Store 或公共组件实现到本仓。
