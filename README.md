# 🌍 Gemini Web Translator (Chrome Extension)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Manifest](https://img.shields.io/badge/Manifest-V3-green.svg)
![AI Assisted](https://img.shields.io/badge/Co--developed%20with-Gemini-orange.svg)

一个基于 Google Gemini API 开发的轻量级 Chrome 浏览器网页翻译插件。

本项目是 **AI 辅助编程 (AI-Assisted Development)** 的产物。核心代码逻辑、Bug 修复及架构优化均在与 Google Gemini 的对话中完成。

## ✨ 主要功能

* **🚀 智能分包翻译 (Smart Batching)**：自动计算字符数，将网页段落合并打包发送，最大化利用 Token 并提升翻译速度。
* **🤖 多模型支持**：支持手动切换 Gemini 家族模型（如 `gemini-1.5-flash`, `gemini-2.0-flash-lite` 等），自动拉取账号下可用模型列表。
* **🛡️ 速率限制保护**：针对免费版 API 的配额限制（如 10 RPM），内置智能延迟（Sleep）机制，防止 `Quota Exceeded` 报错。
* **✨ 沉浸式阅读**：保留原文段落，在下方插入翻译结果，提供双语对照体验。
* **🔄 错误自动恢复**：遇到网络抖动或模型报错时，支持清除状态并重新尝试。

## 🛠️ 安装指南

由于本项目尚未发布到 Chrome 应用商店，你需要通过“开发者模式”安装。

1.  **下载代码**：
    * 点击右上角的 `Code` -> `Download ZIP` 并解压。
    * 或者使用 Git 克隆：`git clone https://github.com/Zuolong233/TranslateByAI.git`
2.  **打开扩展管理页**：
    * 在 Chrome 地址栏输入 `chrome://extensions/` 并回车。
3.  **开启开发者模式**：
    * 打开页面右上角的开关 **"Developer mode" (开发者模式)**。
4.  **加载插件**：
    * 点击左上角的 **"Load unpacked" (加载已解压的扩展程序)**。
    * 选择你刚才解压的文件夹（确保文件夹内包含 `manifest.json`）。

## 📖 使用方法

1.  **配置 API Key**：
    * 点击浏览器右上角的插件图标。
    * 在输入框中粘贴你的 Google Gemini API Key (可在 [Google AI Studio](https://aistudio.google.com/) 免费获取)。
    * 点击 **"保存 Key"**。
2.  **选择模型**：
    * 点击 **"🔄" (刷新)** 按钮，插件会自动拉取你账号权限下的所有可用模型。
    * 推荐选择带 `lite` 或 `flash` 后缀的模型（如 `gemini-2.5-flash-lite`），以获得更快的速度和更高的免费额度。
3.  **开始翻译**：
    * 打开任意英文网页（如新闻、博客）。
    * 点击 **"开始翻译"**。
    * 插件会自动处理网页内容，翻译结果将逐段显示。

## 📂 项目结构

```text
├── manifest.json    # 扩展配置文件 (Manifest V3)
├── background.js    # 后台服务：处理 API 请求、跨域、模型列表拉取
├── content.js       # 内容脚本：处理 DOM 解析、UI 插入、智能分包逻辑
├── popup.html       # 插件弹窗界面
├── popup.js         # 弹窗交互逻辑
└── icons/           # 图标文件夹
