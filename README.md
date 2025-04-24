# 超星学习通题库爬取器 (Chaoxing Learning Platform Question Bank Scraper)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge-lightgrey.svg)

一个简单易用的浏览器扩展，帮助用户从超星学习通平台爬取题库并导出为多种格式。

A simple browser extension to help users scrape question banks from the Chaoxing Learning Platform and export them in various formats.

## 📑 目录 (Table of Contents)

- [功能特点](#功能特点)
- [安装方法](#安装方法)
- [使用说明](#使用说明)
- [爬取内容](#爬取内容)
- [项目结构](#项目结构)
- [常见问题](#常见问题)
- [故障排除指南](#故障排除指南)
- [贡献指南](#贡献指南)
- [声明](#声明)
- [许可证](#许可证)

## ✨ 功能特点

- 🔍 自动检测并在题库页面显示悬浮窗
- 📝 支持爬取单选题、多选题和判断题
- 📊 爬取过程中显示进度条
- 💾 支持导出为TXT、MD、DOC格式
- 🔄 完全兼容Chrome和Edge浏览器
- 🤖 支持使用言溪题库API自动答题

## 📥 安装方法

### 开发者模式安装

1. 下载本仓库代码（点击页面顶部的 `Code > Download ZIP`）
2. 解压到本地文件夹
3. 打开Chrome或Edge浏览器，进入扩展程序管理页面
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
4. 开启右上角的"开发者模式"
5. 点击"加载已解压的扩展程序"，选择项目文件夹
6. 安装成功后，会在浏览器工具栏看到插件图标

## 📖 使用说明

### 爬取题库
1. 访问超星学习通题库页面，系统会自动识别并显示悬浮窗
   - 题库页面URL通常包含 `work/view` 字符串
2. 点击悬浮窗中的"开始爬取"按钮
3. 等待爬取完成，插件会显示进度条
4. 爬取完成后，选择导出格式（TXT/MD/DOC）
5. 文件将自动下载到您的计算机上

### 自动答题
1. 点击悬浮窗中的"自动答题"标签
2. 在"设置"标签页中输入言溪题库的API Token
3. 回到"自动答题"标签页，点击"开始自动答题"按钮
4. 系统将自动查询答案并填写
5. 答题完成后会显示查询成功数量和API剩余次数

## 📝 爬取内容

插件可以爬取以下类型的题目:
- 单选题：题目、选项、正确答案
- 多选题：题目、选项、正确答案
- 判断题：题目、选项、正确答案

导出的内容格式严格遵循标准格式，便于学习和复习。

## 🔧 项目结构

```
chaoxing_scrapper/
├── manifest.json       # 插件配置文件
├── content/            # 内容脚本
│   ├── content.js      # 主要功能逻辑
│   └── content.css     # 悬浮窗样式
├── popup/              # 弹出窗口
│   └── popup.html      # 插件弹出页面
├── icons/              # 图标资源
│   ├── icon16.png      # 16x16 图标
│   ├── icon48.png      # 48x48 图标
│   └── icon128.png     # 128x128 图标
└── .gitignore          # Git忽略文件配置
```

## ❓ 常见问题

### 自动答题API查询失败

如果遇到API查询失败问题，可能有以下几个原因：

1. **跨域请求被阻止**：浏览器的安全策略可能会阻止跨域请求。解决方法：
   - 安装CORS插件如"Allow CORS"或"CORS Everywhere"
   - 使用代理服务器中转请求（参见项目中的proxy文件夹）

2. **API Token无效或过期**：确认您的言溪题库Token是否有效。

3. **网络连接问题**：检查您的网络连接，或者尝试使用其他网络环境。

4. **言溪服务器访问限制**：API可能限制了请求频率或来源，可以尝试减少查询频率。

### 如何使用代理服务器

如果您遇到CORS问题，可以设置代理服务器：

1. 确保已安装Node.js
2. 进入proxy目录并运行：
   ```
   npm install express cors http-proxy-middleware
   node proxy.js
   ```
3. 在设置中将API地址切换为本地代理地址

## 🔍 故障排除指南

### 自动答题功能无法使用

1. **确认Token有效**：在言溪题库官网登录，检查您的Token是否有效
2. **刷新页面重试**：有时候重新加载页面可以解决临时问题
3. **检查网络连接**：确保您能够访问 tk.enncy.cn
4. **更新扩展**：安装最新版本的插件
5. **重启浏览器**：关闭并重新打开浏览器后再试

### 调试模式

启用调试模式可以查看更详细的错误信息：

1. 在设置选项卡中勾选"调试模式"
2. 再次尝试自动答题功能
3. 检查日志中的详细错误信息

如果问题依然存在，请通过 [Issues](https://github.com/YourUsername/chaoxing_scrapper/issues) 联系开发者并提供日志截图。

## 👥 贡献指南

欢迎贡献代码、报告问题或提出功能建议！

1. Fork 本仓库
2. 创建你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## ⚠️ 声明

本插件仅供个人学习使用，请勿用于商业目的。使用本插件时请遵守相关法律法规和超星学习通的使用条款。

## 📄 许可证

[MIT License](LICENSE) © 2023
