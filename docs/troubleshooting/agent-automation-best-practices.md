# Agent 自动化与邮件/富文本避坑最佳实践

本文档总结了在开发与调优 Boss 直聘求职/招聘自动化系统（特别是 LLM 对话、Tool Calling、邮件通知与富文本操作）过程中经过实测验证的关键避坑经验。

---

## 1. Puppeteer 富文本编辑器操作规范（防文字颠倒与光标乱跳）

### 问题现象
大模型生成了完整通顺的单次回话（如：`好的，理解您的考虑，感谢您花时间看简历。方便的话，后续有合适的实习机会也欢迎随时联系我，祝工作顺利！`），但在 Boss 直聘输入框中发出的消息却被“首尾翻转/倒置”（变成 `欢迎随时联系我，祝工作顺利！好的，理解您的考虑...`）。

### 根本原因
Boss 直聘聊天输入框为 `<div contenteditable="true" class="chat-input">` 富文本容器。如果使用 Puppeteer 的逐字模拟打字：
`await chatInputHandle.type(textToSend, { delay: 50 })`
在打字过程中，前端响应式框架（Vue）的输入事件重绘会导致输入法光标在打字中途**跳回行首（Position 0）**，导致后半段文字被打在最前面。

### 正确做法（原子化注入）
**严禁使用逐字 `page.type`**，必须使用浏览器原生原子化文本指令注入：
```typescript
await page.evaluate((selector, text) => {
  const el = document.querySelector<HTMLElement>(selector)
  if (!el) return
  el.focus()
  document.execCommand('selectAll', false, undefined)
  document.execCommand('delete', false, undefined)
  document.execCommand('insertText', false, text)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}, chatInputSelector, cleanText)
```

---

## 2. SMTP 协议与 MIME Base64 换行规范（RFC 5321 限制）

### 问题现象
直连 QQ 邮箱发送富文本 HTML 邮件时报错：
`500 Line too long, exceeds the 998-octet text line limit defined in RFC 5321`

### 根本原因
RFC 5321 协议规定单行文本不能超过 998 个字符。直接使用 `Buffer.from(html).toString('base64')` 发送时，长篇 HTML 会产生超过数千字符的单行 Base64 字符串，触发 SMTP 服务器拦截。

### 正确做法
所有 Base64 编码的邮件正文必须按 MIME 标准每 76 字符换行：
```typescript
const base64Body = Buffer.from(html, 'utf-8')
  .toString('base64')
  .replace(/(.{76})/g, '$1\r\n')
```

---

## 3. Email HTML 兼容性规范（严禁在邮件中使用 `<details>` 折叠）

### 问题现象
在邮件中采用 `<details><summary>` 折叠岗位长篇 JD，在 QQ 邮箱（手机 App 与网页端）点击展开后，正文被父容器强制截断（`overflow: hidden`）且无法向下滑动。

### 根本原因
主流邮件客户端（QQ 邮箱、Foxmail、Outlook 等）沙箱对 `<details>` 展开后的动态高度重算支持极差，且邮件中禁止执行 JavaScript。

### 正确做法
邮件模板一律采用**自适应高度的静态结构化卡片面板（Card Container）**，依赖邮件整体页面的平滑滚动：
```html
<div style="margin-top: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 6px; padding: 12px 16px;">
  <div style="font-weight: bold; font-size: 14px; color: #1e40af; margin-bottom: 8px;">📄 岗位职责与任职要求 (JD)</div>
  <div style="white-space: pre-wrap; font-size: 13px; color: #334155; line-height: 1.6; word-break: break-word;">
    ${jobInfoText}
  </div>
</div>
```

---

## 4. 生产级通知模块解耦（脱离 IDE 宿主环境依赖）

### 问题现象
使用开发环境专用 CLI（如 `agently-cli`）发送通知时，在用户自行打开的外部独立终端（Git Bash / CMD）中运行会因缺少 IDE 上下文 Token 报错 `Authorization required`。

### 正确做法
核心业务通知优先采用纯原生协议（如原生 Node.js TLS 直连 `smtp.qq.com:465`），敏感凭证统一保存在根目录 `.env`（加入 `.gitignore`），通过 `process.env` 动态读取，确保应用在任意独立 Bash 窗口或未来打包为桌面客户端时 100% 稳定有效。
