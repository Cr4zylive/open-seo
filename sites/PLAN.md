# 海外工具站开发计划

一站一个 Cloudflare Worker（Static Assets）+ 一个域名。不要合集站，不要绑进 OpenSEO Worker，不要跑 `alchemy deploy:selfhost`。英语美站先上。

## 选型

新项目用 **Workers Static Assets**。纯 HTML/JS，`wrangler.jsonc` 只配 `assets.directory`，不写 Worker 脚本。Pages 能跑，但新站不再开 Pages 项目。

```jsonc
{
  "name": "site-worker-name",
  "compatibility_date": "2026-09-16",
  "assets": { "directory": "." }
}
```

本地：`npx wrangler deploy --dry-run` 验配置。有域名后再解开 `wrangler.jsonc` 里的 `custom_domain` 注释并 `wrangler deploy`。AdSense 按域名单独申请。

## 站点清单

| 阶段 | 目录 | 域名 | Worker 名 | 先打的词 | 范围 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `dim-weight-calculator` | dimpounds.com | `dimpounds` | UPS dimensional weight calculator | Daily 139 / Retail 166。FedEx / DHL / 空运计费重以后分页 | 可上线静态站；域名未买 |
| 2 | `conduit-fill-calculator` | racewayfill.com | `racewayfill` | conduit fill calculator | 同站：`/` 管线填充，`/voltage-drop.html` 电压降，`/wire-size.html` 线径。NEC Ch.9 Tables 1/4/5 | 可上线静态站；域名未买 |
| 3 | `stair-calculator` | stairrise.com | `stairrise` | stair calculator | 只做 rise / run / 踏步数 | 可上线静态站；域名未买 |
| 4 | `cbm-calculator` | freightcbm.com | `freightcbm` | cbm calculator | 只做立方米（可带件数）。不是 UPS 英寸 | 可上线静态站；域名未买 |

域名避开 UPS/NEC/IRC 商标词。已占用、不要买：dimweight.com、conduitfill.com、wirefill.com、riseandrun.com、cbmship.com、cubicmeters.com、shipcbm.com。

不做（本轮）：石膏板（Home Depot/USG 占满）、税费（YMYL）、钢筋独立站（留给以后的混凝土站）、ES / PT-BR / ID。

## 每站必须有

- 英语 `index.html` + 公式出处 + 「不是法律/工程建议」
- 公式抽到 `*.mjs`，`node --test` 覆盖核心例子
- 自包含（CSS/JS 不跨站引用，才能单独 deploy）
- `wrangler.jsonc` + `package.json` 的 `test` / `start`
- canonical、Open Graph、JSON-LD `WebApplication`、robots.txt、sitemap.xml、favicon、404
- 打开页面就算默认例子，不必先点按钮

## 验收

1. 各站 `node --test` 全过
2. 浏览器：UPS `16×12×12 / 10 lb` → Daily 17、Retail 14（打开即算）
3. 浏览器：电工 `9 × 12 AWG THHN` 在 `1/2″ EMT` 刚过 40% 填充
4. 浏览器：楼梯、CBM 各走一遍默认例子
5. 各站 `wrangler deploy --dry-run`（有 wrangler 时）

## 以后（本 PR 不做）

- 买四个 `.com`、解开 custom_domain、绑 Worker、过 AdSense
- 体积重站加 FedEx / DHL 分页
- 混凝土站（钢筋做其中一页）
- 英语有点击后再做 ES / PT-BR / ID
