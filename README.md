# 星芽跃界 · Starsprout Rift Run

原创纸雕风横版动作闯关游戏。同一套 HTML5 Canvas 玩法代码同时用于在线版与 Windows 桌面版。

## 游戏内容

- 12 个完整关卡，每 3 个普通关卡后进入一场 Boss 挑战，共 3 场机关解谜 Boss 战。
- 风场、音晶显桥、传送齿轮、潮汐浮力、自动卷轴、上升熔潮、弹簧台、灯相 / 墨相平台和限时继电器等不同机制。
- 第 4 关需开启双冷却阀并诱导蒸汽甲虫冲过霜风口；第 8 关需校准双星镜击破暗核护盾；第 12 关需按阶段同时点亮 1 / 2 / 3 枚织界继电器，在短暂暴露期攻击裂界织母核心。
- 老版本已经完成第 8 关的存档会保留全部进度，并自动解锁第 9 关。
- 键盘、竖屏/横屏自适应触控、检查点、自动存档、关卡选择、音效与全屏。

## 本地运行

```powershell
& 'D:\nodejs\npm.cmd' install
& 'D:\nodejs\npm.cmd' run dev
```

打开 `http://localhost:3000/`。纯游戏页面位于 `public/play/index.html`，也可直接离线加载。

## 操作

- `A / D` 或方向键：移动
- `Space / W / ↑`：跳跃
- `Shift / K`：冲刺
- `J / X`：星脉冲，触发机关或攻击暴露的核心
- `S / ↓`：空中下砸
- `Esc`：暂停

## 构建与验证

```powershell
& 'D:\nodejs\npm.cmd' test
& 'D:\nodejs\npm.cmd' run dist:desktop
& 'D:\nodejs\npm.cmd' run dist:installer
```

`dist:desktop` 输出免安装便携 EXE，`dist:installer` 输出可选择安装目录的 NSIS 安装包。两者都不要求玩家预装 Node.js。

## 主要目录

- `public/play/`：游戏本体、关卡数据、画布引擎和界面样式
- `electron/`：Windows 桌面包装
- `app/`：在线版全屏宿主页
- `tests/`：关卡结构与游戏 UI 自动检查
- `DESIGN.md`：视觉系统与设计原则
