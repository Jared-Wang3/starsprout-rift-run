# 星芽跃界 · Starsprout Rift Run

原创纸雕风横版动作闯关游戏。同一套 HTML5 Canvas 玩法代码同时用于在线版、Windows 桌面版、Android 与 iPhone 原生壳。

## 版本 4.1.0

- 主页面升级为原创“裂界封面舞台”：主角沿纸雕航路奔向多重生态裂界，裂界和当前关卡门票共同组成唯一主入口；航线、档案与操作退为底部工具签，不再使用千篇一律的矩形卡片堆叠。
- 主视觉分别提供宽屏与手机竖屏构图，近方形手机、短横屏和桌面各自重排；两张 WebP 合计约 501 KiB，首页隐藏的 Canvas 不再持续绘制耗电。
- 当前关卡、旅程完成度和主角状态仍完整保留；关卡选择按四幕路线分组，并使用真实关卡环境缩略图。
- 新增“星芽档案”和一槽式芽芯系统：回声、风行、根守三种能力分别由第 4、8、12 关 Boss 解锁，沿用原有操作键即可使用。
- 第 5 关改为任意修复两处潮汐锚点后返回中央圣所；第 11 关改为给两座反应炉供能，普通脉冲、反射弹与暖光电池分别提供不同效率。
- 手机原生版启动后锁定左右横屏，保留键盘与 Windows 桌面版操作；手机方向盘支持按住左右滑动换向，动作键扩大间距，减少抬手重按造成的误触。

## 游戏内容

- 16 个正式主线关卡，每 3 个普通关卡后进入一场 Boss 挑战，共 4 场机关解谜 Boss 战；第 13–16 关不是隐藏关。
- 风场、音晶显桥、传送齿轮、潮汐浮力、自动卷轴、上升熔潮、弹簧台、灯相 / 墨相平台和限时继电器等不同机制。
- 除奔跑、战斗与 Boss 解谜外，现包含区域修复、返程提交、反射供能、低重力立体路线、局部时间冻结、延迟分身双生压板和移动星锚追击。
- 第 4 关需开启双冷却阀并诱导蒸汽甲虫冲过霜风口；第 8 关需校准双星镜击破暗核护盾；第 12 关需按阶段同时点亮 1 / 2 / 3 枚织界继电器，在短暂暴露期攻击裂界织母核心。
- 第 16 关需在引力潮中追上环绕星噬鲸移动的星锚；三个阶段分别同时维持 1 / 2 / 3 枚星锚，才能拉落巨鲸并攻击星核。
- 老版本已经完成第 8 关的存档会保留全部进度，并自动解锁第 9 关。
- 键盘、横屏触控、检查点、自动存档、关卡选择、音效与全屏；网页版本仍会根据可用视口自适应。

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

芽芯不增加额外按键：回声芽芯强化脉冲反射，风行芽芯把“冲刺后跳跃”变成升空折跃，根守芽芯通过地面下砸张开一次护盾。

## 构建与验证

```powershell
& 'D:\nodejs\npm.cmd' test
& 'D:\nodejs\npm.cmd' run dist:desktop
& 'D:\nodejs\npm.cmd' run dist:installer
```

`dist:desktop` 输出免安装便携 EXE，`dist:installer` 输出可选择安装目录的 NSIS 安装包。两者都不要求玩家预装 Node.js。

### Android 与 iPhone

项目已包含 Capacitor 原生工程，手机壳直接打包 `public/play/` 的离线游戏，不依赖线上地址：

```powershell
npm run mobile:sync
npm run android:debug
```

Android 调试包成功后位于 `android/app/build/outputs/apk/debug/app-debug.apk`。首次构建需要 Android SDK；可用 Android Studio 安装 SDK 后设置 `ANDROID_HOME`，再执行上述命令。

iPhone 工程位于 `ios/App/App.xcodeproj`。仓库的 `Build iOS IPA` GitHub Actions 工作流会借用云端 macOS 编译，并提供 `starsprout-ios-unsigned` 构建产物；下载后解压即可得到 `starsprout-ios-unsigned.ipa`。该文件包含完整 iPhone 程序，但仍需在 Windows 上使用自己的 Apple Account 签名并安装到已连接的 iPhone。免费 Personal Team 筿名通常需要每 7 天重新安装一次。

如果有 Mac，也可以执行 `npm run mobile:sync`、`npm run ios:open`，在 Xcode 中选择开发团队后直接安装。Android 与 iPhone 原生版均只允许左右横屏。

## 主要目录

- `public/play/`：游戏本体、关卡数据、画布引擎和界面样式
- `electron/`：Windows 桌面包装
- `android/`、`ios/`：Android 与 iPhone 原生包装
- `app/`：在线版全屏宿主页
- `tests/`：关卡结构与游戏 UI 自动检查
- `DESIGN.md`：视觉系统与设计原则
