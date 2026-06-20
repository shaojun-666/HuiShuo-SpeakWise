# 会说 - SpeakWise

> AI 全场景沟通助手 · 输入场景，AI 给你最合适的说法和策略

会说是一款微信小程序，帮助你应对各种沟通场景——**职场汇报、人情世故、日常社交、消费维权、社交文案**。只需描述你遇到的场景，AI 即可生成局势分析、策略建议和具体话术。

---

## 功能特性

### Phase 1（已实现）
- **首页场景浏览** — 5 大分类、40+ 预置场景模板，快速选择
- **场景模板对话** — 选中场景 → 填写变量 → AI 生成完整方案
- **自由对话模式** — 无模板自由输入，AI 即时回复
- **结构化输出** — 每轮回复包含「局势分析 + 策略建议 + 具体话术」
- **话术收藏** — 收藏精彩回复，方便日后查看
- **历史记录** — 对话历史与收藏统一管理
- **一键复制** — 话术内容一键复制到剪贴板

### Phase 2（规划中）
- 聊天记录截图分析
- 图片配文生成
- 沟通风格评估
- 场景模板扩充至 500+

---

## 截图预览

| 首页 | 场景对话 | 自由对话 | 历史记录 |
|------|----------|----------|----------|
| 场景分类与模板 | AI 结构化回复 | 自由聊天 | 收藏与管理 |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序原生框架（WXML + WXSS + JS） |
| 后端 | 微信云开发（云函数 + 云数据库） |
| AI | 通义千问 Qwen-Plus（DashScope OpenAI 兼容接口） |
| 缓存 | 云数据库 MD5 缓存（7 天 TTL） |
| 构建 | 微信开发者工具 |

---

## 快速开始

### 前置准备

1. 注册 [微信小程序](https://mp.weixin.qq.com/) 并获取 AppID
2. 下载安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
3. 开通 [微信云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html) 并创建云环境
4. 获取 [DashScope API Key](https://help.aliyun.com/zh/model-studio/)（阿里云通义千问）

### 初始化步骤

```bash
# 1. 克隆项目
git clone https://github.com/shaojun-666/HuiShuo-SpeakWise.git
cd HuiShuo-SpeakWise

# 2. 安装云函数依赖
cd cloudfunctions/chat && npm install
cd ../scenarios && npm install
cd ../user && npm install
cd ../..
```

### 3. 在微信开发者工具中
- 导入项目根目录，填入你的小程序 AppID
- 在 `project.config.json` 中将 `appid` 改为你的 AppID

### 4. 配置云函数环境变量
在微信开发者工具 → 云开发控制台 → 云函数 → `chat` → 环境变量中设置：

```
AI_API_KEY=你的DashScope API Key
```

> **注意**：环境变量名为 `AI_API_KEY`（兼容 DeepSeek 或其他 OpenAI 兼容 API 的 Key）

### 5. 创建数据库集合
在云开发控制台 → 数据库中创建以下集合：

| 集合名 | 说明 |
|--------|------|
| `scenarios` | 场景模板数据 |
| `conversations` | 对话记录 |
| `savedItems` | 收藏话术 |
| `feedback` | 用户反馈 |
| `response_cache` | AI 响应缓存 |

### 6. 导入场景数据

**方式一（推荐）**：
在 `cloudfunctions/seed` 目录创建云函数，复制 `data/seed.js` 的内容，上传并调用。

**方式二**：
在云开发控制台 → 数据库 → `scenarios` 集合 → 导入 `data/scenarios.json`。

### 7. 编译运行
在微信开发者工具中点击编译，即可预览。

---

## 项目结构

```
HuiShuo-SpeakWise/
├── miniprogram/              # 小程序前端
│   ├── app.js / app.json / app.wxss
│   ├── pages/
│   │   ├── index/            # 首页（场景分类 + 模板列表）
│   │   ├── scenario-detail/  # 场景详情（变量填写 + AI 对话）
│   │   ├── chat/             # 自由对话
│   │   ├── history/          # 历史记录 + 收藏
│   │   └── mine/             # 个人中心
│   ├── components/           # 公共组件
│   ├── utils/
│   │   └── api.js            # 云函数调用封装
│   ├── styles/
│   │   ├── variables.wxss    # 主题变量
│   │   └── utilities.wxss    # 工具类
│   └── images/               # Tab 图标
├── cloudfunctions/           # 云函数
│   ├── chat/                 # AI 对话核心
│   ├── scenarios/            # 场景模板 CRUD
│   ├── seed/                 # 数据库初始化
│   └── user/                 # 用户数据（历史/收藏/反馈）
├── data/
│   ├── scenarios.json        # 42 个预置场景数据
│   └── seed.js               # 数据库初始化脚本
└── project.config.json       # 项目配置
```

---

## 场景分类

| 分类 | 标识 | 示例场景 |
|------|------|----------|
| 💼 职场沟通 | `workplace` | 向老板汇报工作、拒绝加班、请求加薪 |
| 🤝 人情世故 | `guanxi` | 随礼金额、求人办事、拜访长辈 |
| 💕 日常社交 | `social` | 初次约会、和老朋友聊天、道歉 |
| 🛡️ 消费维权 | `consumer` | 退换货纠纷、外卖投诉、差评回复 |
| ✍️ 社交文案 | `copywriting` | 朋友圈文案、小红书种草、抖音脚本 |

---

## AI 响应结构

每次 AI 回复包含三个结构化部分：

1. **局势分析** — 分析场景中的关系、利益、风险
2. **策略建议** — 提供合适的应对方向和策略
3. **具体话术** — 可直接使用的说话模板

自由对话模式下，回复以段落形式展示；场景模板模式下，三部分分区块展示。

---

## 缓存机制

- AI 响应以 MD5（system prompt + 用户输入）为 Key 缓存 7 天
- 缓存存储在 `response_cache` 集合
- 超过 500 条时自动清理最早 50 条
- 相同输入的重复请求直接返回缓存结果，节省 API 费用

---

## 注意事项

1. **云函数超时**：chat 云函数建议设置超时时间为 60 秒（AI 响应可能较慢）
2. **API Key 安全**：`AI_API_KEY` 通过云函数环境变量配置，不会暴露到前端
3. **内容限制**：单次输入不超过 2000 字；AI 仅回答与沟通技巧相关的场景
4. **首次使用**：必须先创建数据库集合并导入场景数据
5. **小程序审核**：发布前需通过微信内容安全审核

---

## License

MIT
