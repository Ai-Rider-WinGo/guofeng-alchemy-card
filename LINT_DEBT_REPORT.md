# LINT_DEBT_REPORT

生成时间：2026-06-22  
范围：`admin-light` lint warnings  
命令：

```bash
cd admin-light
npx eslint . --format json
npm run lint
```

## Summary

`admin-light` 当前 lint 可正常执行，结果为：

| 指标 | 数量 |
| --- | ---: |
| Error | 0 |
| Warning | 568 |
| 可自动修复 | 436 |
| 需人工处理 | 132 |

结论：当前 warnings 主要是 Vue 模板格式、属性排序、组件命名规范问题。没有发现明确的运行时错误类 lint warning，例如 `no-undef`、`no-unused-vars`、未定义变量或不可达代码。

## 1. 分类统计

### 按规则统计

| Rule | Count | Auto-fixable | Manual | 分类 |
| --- | ---: | ---: | ---: | --- |
| `vue/max-attributes-per-line` | 312 | 186 | 126 | 模板格式 |
| `vue/singleline-html-element-content-newline` | 236 | 236 | 0 | 模板格式 |
| `vue/attributes-order` | 11 | 11 | 0 | 模板属性顺序 |
| `vue/multi-word-component-names` | 6 | 0 | 6 | 组件命名 |
| `vue/attribute-hyphenation` | 2 | 2 | 0 | 模板属性命名 |
| `vue/html-self-closing` | 1 | 1 | 0 | 模板格式 |

### 按文件统计

| File | Warning | Auto-fixable |
| --- | ---: | ---: |
| `src/views/PromptRules.vue` | 173 | 157 |
| `src/views/Pools.vue` | 115 | 82 |
| `src/views/Cards.vue` | 97 | 66 |
| `src/views/MergeRules.vue` | 58 | 37 |
| `src/views/Configs.vue` | 43 | 34 |
| `src/views/Users.vue` | 32 | 25 |
| `src/views/Dashboard.vue` | 30 | 21 |
| `src/views/Login.vue` | 15 | 9 |
| `src/App.vue` | 5 | 5 |

## 2. 可以批量自动修复

可通过以下命令批量处理 436 条：

```bash
cd admin-light
npm run lint:fix
```

自动修复范围：

- `vue/singleline-html-element-content-newline`：236 条
- `vue/max-attributes-per-line`：186 条中的可安全修复部分
- `vue/attributes-order`：11 条
- `vue/attribute-hyphenation`：2 条
- `vue/html-self-closing`：1 条

注意：`lint:fix` 会改动大量 Vue 模板排版，建议单独提交，并在修复后执行：

```bash
cd admin-light
npm run lint
npm run build
```

## 3. 需要人工处理

### `vue/multi-word-component-names`

数量：6  
自动修复：否

涉及文件：

- `src/views/Cards.vue`
- `src/views/Configs.vue`
- `src/views/Dashboard.vue`
- `src/views/Login.vue`
- `src/views/Pools.vue`
- `src/views/Users.vue`

处理方式：

- 方案 A：将组件文件和路由引用改为多词命名，例如 `CardsView.vue`、`ConfigsView.vue`。
- 方案 B：在组件内显式声明多词 `name`，例如 `CardsView`。

建议：如果项目已有页面文件命名约定，优先统一为 `*View.vue`。这会影响 router import，需要作为独立变更处理。

### `vue/max-attributes-per-line` 非自动修复部分

数量：126  
自动修复：否

原因：部分模板标签属性较复杂，ESLint 未提供安全 autofix。

处理方式：

- 人工拆分长标签属性。
- 保持 Ant Design Vue 组件模板可读性。
- 优先处理 warning 数量最多的文件：`PromptRules.vue`、`Pools.vue`、`Cards.vue`。

## 4. 低优先级样式问题

以下属于低优先级样式/可读性债务，不影响当前运行：

- `vue/max-attributes-per-line`
- `vue/singleline-html-element-content-newline`
- `vue/attributes-order`
- `vue/html-self-closing`

这些问题主要影响：

- 模板可读性
- PR diff 噪音
- 团队格式一致性

建议优先级：

1. 先执行 `npm run lint:fix` 处理可自动修复的 436 条。
2. 再人工处理剩余 `max-attributes-per-line`。
3. 最后决定是否重命名单词组件。

## 5. 潜在运行风险

当前 568 条 warning 中，没有发现高置信运行风险。

低风险项：

- `vue/multi-word-component-names`：理论上可避免与原生 HTML 元素冲突；当前命名如 `Cards`、`Login` 不属于原生元素，运行风险低。
- `vue/attribute-hyphenation`：当前发生在 Vue SFC 模板中，通常不直接导致运行失败，但建议自动修复以保持 Vue 模板规范。

未发现：

- 未定义变量
- 未使用变量导致的逻辑死区
- Promise/异步错误
- import/export 错误
- 明确的 Vue reactivity 使用错误
- 明确的 Ant Design Vue API 使用错误

## Recommended Next Actions

1. 单独执行并提交 `admin-light` 的 `npm run lint:fix` 结果。
2. 复跑 `npm run lint`，确认剩余 warning 数量。
3. 手动处理剩余 `vue/max-attributes-per-line`。
4. 决策是否统一页面组件命名为 `*View.vue`。
5. 当 warning 降到可控范围后，将 CI 策略升级为 `--max-warnings=0`。
