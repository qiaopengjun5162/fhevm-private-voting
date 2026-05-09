# FHE Private Voting — Frontend

基于 Next.js 16 + React 19 的 FHE 隐私投票前端。使用 Zama fhEVM 实现链上全同态加密投票。

## 技术栈

- **框架**: Next.js 16 + React 19 + TypeScript
- **样式**: Tailwind CSS 4 + shadcn/ui
- **Web3**: ethers.js v6 + viem
- **FHE**: @zama-fhe/relayer-sdk
- **包管理**: Bun

## 快速开始

```bash
bun install
bun run dev          # 开发服务器 (localhost:3000)
bun run build        # 生产构建 (webpack)
bunx tsc --noEmit    # 类型检查
```

## 项目结构

```
src/
  app/
    layout.tsx          # 根布局 (Geist 字体, Toaster)
    page.tsx            # 主页面
  hooks/
    useWallet.ts        # MetaMask 连接/断开/accountsChanged
    useNetwork.ts       # 链 ID 检测
    useContract.ts      # ethers.js 合约实例
    useVotingState.ts   # 投票元数据/阶段轮询
    useFHE.ts           # 懒加载 @zama-fhe/relayer-sdk, 加解密
  components/
    WalletConnector.tsx
    NetworkBanner.tsx
    ContractAddressInput.tsx
    VotingMetadata.tsx      # 标题, 选项, 时间戳, 阶段标记
    PhaseBadge.tsx
    VoteForm.tsx            # 选项选择 + 加密 + 提交交易
    OwnerPanel.tsx          # publishResults() + grantResultAccess()
    ResultsDisplay.tsx      # 解密票数 + 柱状图
  lib/
    abi.ts              # PrivateVoting ABI
    config.ts           # 链 ID, relayer URL, 存储键, 轮询间隔
    utils.ts            # cn(), truncateAddress(), formatTimestamp(), computePhase()
  types/
    index.ts            # VotingState, WalletState, NetworkInfo, EncryptResult
```

## FHE 流程 (Sepolia)

1. 用户选择选项 → `useFHE.encryptVote(index)` → 懒加载 `@zama-fhe/relayer-sdk/web`，调用
   `createEncryptedInput(contractAddr, userAddr).add8(index).encrypt()`
2. 返回 `{handles, inputProof}` → 传给 `contract.vote(handles[0], inputProof)`
3. 结果解密: `useFHE.decryptTally(handle)` → `generateKeypair()` → `createEIP712()` → `signer.signTypedData()` →
   `userDecrypt()`

## 网络支持

- **Localhost (Hardhat)**: 只读模式，FHE 加解密不可用
- **Sepolia**: 完整功能，通过 @zama-fhe/relayer-sdk + Zama KMS relayer

## Vercel 部署

生产构建使用 webpack (`next build --webpack`)，Turbopack 在生产构建时会无限挂起。`next.config.ts`
中配置了 COOP/COEP 头以支持 relayer SDK 的 Web Worker。
