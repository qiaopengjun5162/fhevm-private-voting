# FHE 隐私投票 dApp

[English](./README.md)

基于 [Zama fhEVM](https://www.zama.ai/fhevm) 的链上机密投票 —— 全同态加密 (Fully Homomorphic Encryption)
运行在以太坊上。投票端到端加密，计票通过同态运算完成，结果仅在投票窗口关闭后才可解密查看。

## 架构

```
fhevm-private-voting/
├── contracts/                  # Solidity 合约
│   ├── PrivateVoting.sol       # 主投票合约 (FHE)
│   └── FHECounter.sol          # 模板计数器
├── deploy/                     # Hardhat 部署脚本
├── test/                       # 合约测试 (fhevm mock)
├── tasks/                      # Hardhat CLI 任务
└── frontend/                   # Next.js 16 + React 19
    └── src/
        ├── app/                # 页面与布局
        ├── components/         # UI 组件 (shadcn/ui)
        ├── hooks/              # useWallet, useFHE, useVotingState 等
        └── lib/                # ABI, 配置, 工具函数, 类型定义
```

## 工作原理

1. 部署者创建投票，设定标题、选项和时间窗口
2. 投票者提交**加密**选票 —— 链上永远不可见投票内容
3. 计票通过**同态加法**累加（在加密数据上直接计算）
4. 投票窗口关闭后，合约所有者发布结果
5. 被授权的查看者解密最终票数

## 快速开始

### 环境要求

- Node.js >= 20, [Bun](https://bun.sh) (前端)
- [MetaMask](https://metamask.io/) 浏览器扩展
- Sepolia ETH 用于支付 gas (测试网)

### 安装

```bash
# 根目录 (合约)
npm install

# 前端
cd frontend && bun install
```

### 环境变量

```bash
cp .env.example .env
# 编辑 .env:
#   PRIVATE_KEY="0x..."          你的钱包私钥
#   SEPOLIA_RPC_URL="https://..."  Alchemy/Infura RPC 端点
#   ETHERSCAN_API_KEY="..."       可选，用于合约验证
```

### 本地开发

```bash
# 终端 1: 启动 Hardhat 节点
npm run chain

# 终端 2: 部署合约
npm run deploy:localhost

# 终端 3: 启动前端
cd frontend && bun dev
```

本地环境为**只读模式** —— FHE 加解密不可用。完整测试请使用 Sepolia。

### Sepolia 部署

```bash
# 部署合约
npm run deploy:sepolia

# Etherscan 验证
npm run verify:sepolia
```

然后在浏览器打开 `http://localhost:3000`，连接 MetaMask (Sepolia)，粘贴已部署的合约地址即可使用。

### 测试流程

1. **部署** → 创建带投票窗口的合约
2. **投票** → 通过 MetaMask 提交加密选票（每个地址限投一票）
3. **等待** → 投票窗口结束
4. **发布** → 所有者在 Owner Controls 中点击 "Publish Results"
5. **授权** → 所有者授予查看者解密权限
6. **解密** → 被授权查看者解密并查看最终票数

## Vercel 部署

前端已部署在 [Vercel](https://vercel.com)。生产构建使用 webpack（Turbopack 存在兼容性问题）。

```bash
cd frontend && bun run build   # 生产构建 (webpack)
```

`next.config.ts` 关键配置：
- `transpilePackages: ["@zama-fhe/relayer-sdk"]` — FHE SDK 需要转译
- `ignoreBuildErrors: true` — Vercel tsc 无法解析 `@/*` 路径别名，webpack 构建不受影响
- COOP/COEP 头 — `@zama-fhe/relayer-sdk` Web Worker 所必需

## 命令参考

| 命令                                | 说明                       |
| ----------------------------------- | -------------------------- |
| `npm run compile`                   | 编译合约 + 生成 TypeChain 类型 |
| `npm test`                          | 运行合约测试 (fhevm mock)    |
| `npm run chain`                     | 启动本地 Hardhat 节点       |
| `npm run deploy:localhost`          | 部署到 localhost            |
| `npm run deploy:sepolia`            | 部署到 Sepolia              |
| `npm run prettier:write`            | 格式化代码                  |
| `cd frontend && bun dev`            | 前端开发服务器              |
| `cd frontend && bun run build`      | 前端生产构建                |
| `cd frontend && bunx tsc --noEmit`  | 前端类型检查                |

## 技术栈

| 层级       | 技术                                  |
| ---------- | ------------------------------------- |
| 智能合约   | Solidity 0.8.27 + @fhevm/solidity     |
| FHE SDK    | @zama-fhe/relayer-sdk                 |
| 前端       | Next.js 16 + React 19 + TypeScript    |
| 样式       | Tailwind CSS 4 + shadcn/ui            |
| Web3       | ethers.js v6                          |
| 开发工具   | Hardhat + hardhat-deploy + Bun        |

## 许可证

BSD-3-Clause-Clear — 详见 [LICENSE](./LICENSE)
