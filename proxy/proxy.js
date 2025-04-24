// 简单代理服务器 - 用于解决CORS问题

// 如果服务器可用，可以使用以下Node.js代码创建简单代理服务器
// 注意：此文件仅供参考，不会被插件直接使用，需要单独部署

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = process.env.PORT || 3000;

// 启用CORS
app.use(cors());

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 言溪题库API代理
app.use('/api/yanxi', createProxyMiddleware({
  target: 'https://tk.enncy.cn',
  changeOrigin: true,
  pathRewrite: {
    '^/api/yanxi': '/'
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Origin', 'https://tk.enncy.cn');
  }
}));

// 健康检查端点
app.get('/', (req, res) => {
  res.send('代理服务器运行正常');
});

app.listen(port, () => {
  console.log(`代理服务器运行在 http://localhost:${port}`);
});
