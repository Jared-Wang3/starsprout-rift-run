# 星芽跃界桌面版

桌面版直接载入 `public/play/index.html`，与在线版共用同一套关卡、存档与美术代码；运行时不需要网络。

## 本地运行

```powershell
D:\nodejs\npm.cmd run desktop
```

## Windows 打包

```powershell
# 单文件便携版 EXE
D:\nodejs\npm.cmd run dist:desktop

# 可选择安装目录的安装包
D:\nodejs\npm.cmd run dist:installer

# 同时生成两种版本
D:\nodejs\npm.cmd run dist:windows
```

产物默认写入项目根目录的 `release`。打包前请确认 `public/play/levels.js` 与 `public/play/game.js` 已存在，并已通过网页版试玩验证。

Electron 窗口关闭 Node.js 集成、启用上下文隔离和 Chromium 沙箱，并拒绝外部跳转、弹窗、下载与权限请求。
