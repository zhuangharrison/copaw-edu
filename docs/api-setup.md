# API配置教程

本文档介绍如何获取和配置各AI模型的API Key。

## 目录

1. [通义千问（推荐）](#通义千问)
2. [文心一言](#文心一言)
3. [智谱AI](#智谱ai)
4. [DeepSeek](#deepseek)
5. [OpenAI](#openai)
6. [本地模型](#本地模型)

---

## 通义千问

**推荐指数：** ⭐⭐⭐⭐⭐
**适合：** 国内用户，稳定可靠

### 获取API Key

1. 访问 https://dashscope.console.aliyun.com/
2. 登录阿里云账号（没有的话先注册）
3. 点击左侧菜单「API-KEY管理」
4. 点击「创建新的 API-KEY」

### 配置信息

```toml
[llm]
provider = "通义千问"
api_key = "sk-xxxxxxxxxxxxxxxx"
api_base = "https://dashscope.aliyuncs.com/compatible-mode/v1"
model = "qwen-plus"
```

### 可用模型

| 模型 | 说明 | 价格 |
|------|------|------|
| qwen-turbo | 快速，便宜 | 约0.002元/千token |
| qwen-plus | 平衡 | 约0.004元/千token |
| qwen-max | 最强 | 约0.04元/千token |

### 费用估算

- 学生日常使用：约5-10元/月
- 老师备课使用：约10-20元/月

---

## 文心一言

**推荐指数：** ⭐⭐⭐⭐
**适合：** 百度生态用户

### 获取API Key

1. 访问 https://console.bce.baidu.com/qianfan/
2. 登录百度账号
3. 创建应用，获取 API Key 和 Secret Key

### 配置信息

```toml
[llm]
provider = "文心一言"
api_key = "your-api-key"
secret_key = "your-secret-key"  # 文心需要额外的secret
api_base = "https://aip.baidubce.com/rpc/2.0/ai_custom/v1"
model = "ernie-bot"
```

---

## 智谱AI

**推荐指数：** ⭐⭐⭐⭐
**适合：** 对国产大模型有偏好的用户

### 获取API Key

1. 访问 https://open.bigmodel.cn/
2. 注册/登录
3. 进入控制台，创建 API Key

### 配置信息

```toml
[llm]
provider = "智谱AI"
api_key = "xxxxxxxxxxxxxxxx"
api_base = "https://open.bigmodel.cn/api/paas/v4"
model = "glm-4"
```

### 可用模型

| 模型 | 说明 |
|------|------|
| glm-4 | 最强版本 |
| glm-4-flash | 快速免费 |
| glm-3-turbo | 经济实惠 |

---

## DeepSeek

**推荐指数：** ⭐⭐⭐⭐
**适合：** 追求性价比的用户

### 获取API Key

1. 访问 https://platform.deepseek.com/
2. 注册/登录
3. 进入 API Keys 页面创建

### 配置信息

```toml
[llm]
provider = "DeepSeek"
api_key = "sk-xxxxxxxxxxxxxxxx"
api_base = "https://api.deepseek.com/v1"
model = "deepseek-chat"
```

### 特点

- 价格便宜（约1元/百万token）
- 支持超长上下文
- 适合大量使用

---

## OpenAI

**推荐指数：** ⭐⭐⭐
**适合：** 有代理的用户

### 获取API Key

1. 访问 https://platform.openai.com/
2. 注册/登录（可能需要代理）
3. 进入 API Keys 页面创建

### 配置信息

```toml
[llm]
provider = "OpenAI"
api_key = "sk-xxxxxxxxxxxxxxxx"
api_base = "https://api.openai.com/v1"
model = "gpt-4"
```

### 可用模型

| 模型 | 说明 | 价格 |
|------|------|------|
| gpt-3.5-turbo | 经济 | 约$0.002/千token |
| gpt-4 | 最强 | 约$0.03/千token |
| gpt-4-turbo | 平衡 | 约$0.01/千token |

### 注意事项

- 需要科学上网
- 需要国际信用卡
- 国内访问不稳定

---

## 本地模型

**推荐指数：** ⭐⭐⭐
**适合：** 完全离线、隐私要求高的用户

### 使用 Ollama

1. 安装 Ollama：https://ollama.ai/
2. 下载模型：`ollama pull qwen2:7b`
3. 启动服务：`ollama serve`

### 配置信息

```toml
[llm]
provider = "Ollama"
api_key = "not-needed"
api_base = "http://localhost:11434/v1"
model = "qwen2:7b"
```

### 推荐模型

| 模型 | 大小 | 配置要求 |
|------|------|----------|
| qwen2:1.5b | 1GB | 4GB内存 |
| qwen2:7b | 4GB | 8GB内存 |
| qwen2:14b | 8GB | 16GB内存 |
| llama3:8b | 5GB | 8GB内存 |

### 优缺点

✅ 优点：
- 完全免费
- 完全离线
- 隐私安全

❌ 缺点：
- 需要较好的硬件
- 效果不如云端大模型
- 首次下载模型较慢

---

## 配置示例

### 完整配置文件

```toml
# CoPaw-Edu 配置文件

[app]
name = "CoPaw-Edu"
role = "student"  # student / parent / teacher

[user]
name = "同学"

[education]
grade_level = "初中"
grade = "初二"
subjects = ["语文", "数学", "英语", "物理"]

[llm]
provider = "通义千问"
api_key = "sk-xxxxxxxxxxxxxxxx"
api_base = "https://dashscope.aliyuncs.com/compatible-mode/v1"
model = "qwen-plus"

[skills]
enabled = ["homework_help", "concept_explain", "quiz_me"]
```

### 多模型配置

```toml
[llm]
# 默认模型
default = "qwen"

[llm.qwen]
provider = "通义千问"
api_key = "sk-xxx"
model = "qwen-plus"

[llm.deepseek]
provider = "DeepSeek"
api_key = "sk-xxx"
model = "deepseek-chat"
```

---

## 费用对比

| 提供商 | 100万token费用 | 适合场景 |
|--------|----------------|----------|
| 通义千问 | 约20元 | 日常使用 |
| DeepSeek | 约1元 | 大量使用 |
| 智谱AI | 约10元 | 平衡选择 |
| OpenAI | 约20-60元 | 追求效果 |
| 本地模型 | 免费 | 隐私优先 |

### 月度费用估算

- **轻度使用**（每天10次对话）：5-10元/月
- **中度使用**（每天30次对话）：15-30元/月
- **重度使用**（每天100次对话）：50-100元/月

---

## 常见问题

### Q: API Key泄露了怎么办？
A: 立即到对应平台删除旧Key，创建新Key。

### Q: 余额不足会怎样？
A: API调用会失败，需要充值后继续使用。

### Q: 如何查看使用量？
A: 登录各平台控制台可以查看详细用量。

### Q: 为什么有时响应很慢？
A: 可能原因：
- 网络问题
- 模型负载高
- 请求内容太长

### Q: 本地模型效果怎么样？
A: 7B参数的模型基本够用，但效果不如云端大模型。建议硬件允许的话用14B以上。

---

**选择适合自己的模型，开始使用吧！** 🚀
