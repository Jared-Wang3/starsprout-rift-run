# 星芽跃界 · Starsprout Rift Run

原创纸雕风横版动作闯关游戏。同一套 HTML5 Canvas 玩法代码同时用于在线版与 Windows 桌面版。

## 游戏内容

- 8 个完整关卡，前 3 关后进入第 4 关 Boss，再经过 3 关进入最终 Boss。
- 风场、音晶显桥、传送齿轮、潮汐浮力、自动卷轴、上升熔潮六套不同机制。
- 第 4 关需开启双冷却阀并诱导蒸汽甲虫冲过霜风口；第 8 关需校准双星镜，让折射光束击破暗核护盾。
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
