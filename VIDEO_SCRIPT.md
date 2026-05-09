# Video Script (双语 / Bilingual)

**Duration**: ~2 min | **Language**: Simple English (spoken) + 中英文字幕

---

## Script

**[0:00-0:15] Intro**

EN: Hi, I built a private voting app using Zama fhEVM. Let me show you.

ZH: 大家好，我用 Zama fhEVM 做了一个隐私投票 dApp，给大家演示一下。

---

**[0:15-0:40] Problem**

EN: On normal blockchains, all votes are public. Anyone can see who voted for what. This is bad for DAOs and governance
— vote buying, peer pressure, no real privacy.

ZH: 普通区块链上，所有投票都是公开的。谁投了什么一目了然。这对 DAO 治理来说是个大问题 —— 贿选、跟风投票、毫无隐私。

EN: With FHE, we can count votes without seeing them. Everything stays encrypted, end to end.

ZH: 用全同态加密 (FHE)，我们可以在不看选票的情况下计票。数据全程加密。

---

**[0:40-1:20] Demo: Vote**

EN: Here is our app, live on Sepolia testnet.

ZH: 这是我们的 dApp，跑在 Sepolia 测试网上。

EN: I pick an option. The browser encrypts my vote using the Zama SDK. Then I submit it. One transaction, done.

ZH: 我选择一个选项。浏览器用 Zama SDK 加密我的选票。提交，一笔交易，完成。

EN: On chain, the tally updates — but my choice stays hidden. No one knows which option I picked.

ZH: 链上计票在加密数据上完成 —— 但我的选择永远不会暴露。

---

**[1:20-1:50] Demo: Publish & Decrypt**

EN: Now voting is over. Only the owner can publish results.

ZH: 投票窗口结束了。只有部署者才能发布结果。

EN: I click publish. Then I grant access to viewers. When they decrypt, the final counts appear. But individual votes?
Gone forever.

ZH: 点击发布，授权解密。查看者解密后看到最终票数。但每一张票投给了谁？永远没人知道。

---

**[1:50-2:05] Tech Stack & Close**

EN: The stack: Solidity with FHE.sol, Next.js frontend, Zama relayer SDK. Source code on GitHub, full docs in Chinese
and English.

ZH: 技术栈：Solidity + FHE.sol，Next.js 前端，Zama relayer SDK。GitHub 有完整代码和中英文文档。

EN: FHE makes private voting real. Thank you.

ZH: FHE 让隐私投票成为现实。谢谢。

---

## 录制提示

- 说话慢一点、清晰即可，不用追求复杂句型
- 屏幕上同时展示 dApp + 你的人脸（角落小窗）
- 准备好 Vercel 部署链接，录屏时用
- 提前准备两个 MetaMask 账号：一个投票、一个发布结果
