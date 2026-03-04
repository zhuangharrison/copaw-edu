# 本地测试指南

本指南帮助你在本地快速测试 CoPaw-Edu 教育版。

## 方式一：快速启动（推荐）

### 步骤1：安装依赖

```bash
cd CoPaw-Edu-Final
pip install openai gradio tomli
```

### 步骤2：运行配置向导

```bash
python -m copaw setup
```

或直接运行启动脚本（首次会自动进入配置向导）：

```bash
python run.py
```

### 步骤3：启动Web界面

```bash
python -m copaw app
```

访问 http://127.0.0.1:7860

---

## 方式二：pip安装

### 步骤1：安装

```bash
cd CoPaw-Edu-Final
pip install -e .
```

### 步骤2：配置

```bash
copaw setup
```

### 步骤3：启动

```bash
copaw app
```

---

## 方式三：手动配置

### 步骤1：创建配置文件

在用户目录下创建配置文件：

- Windows: `C:\Users\你的用户名\.copaw-edu\config.toml`
- Linux/Mac: `~/.copaw-edu/config.toml`

配置文件内容：

```toml
[app]
name = "CoPaw-Edu"
role = "student"

[user]
name = "测试用户"

[education]
grade_level = "初中"
grade = "初二"
subjects = ["语文", "数学", "英语"]

[llm]
provider = "通义千问"
api_key = "你的API Key"
api_base = "https://dashscope.aliyuncs.com/compatible-mode/v1"
model = "qwen-plus"

[multimodal]
enabled = false

[skills]
enabled = ["memory_system", "concept_master", "mistake_master", "exam_prep", "multimodal_gen", "ai_study_prompts"]
```

### 步骤2：启动

```bash
python run.py
```

---

## 命令行工具

```bash
# 查看帮助
python -m copaw --help

# 查看版本
python -m copaw --version

# 启动Web界面
python -m copaw app

# 指定端口
python -m copaw app --port 8080

# 创建公开链接
python -m copaw app --share

# 运行配置向导
python -m copaw setup

# 测试配置和API连接
python -m copaw test

# 测试特定技能
python -m copaw test --skill memory_system
```

---

## 获取API Key

### 推荐使用通义千问（国内稳定）

1. 访问：https://dashscope.console.aliyun.com/
2. 登录阿里云账号
3. 开通"灵积模型服务"
4. 创建 API Key

### 其他选择

| 提供商 | 获取地址 | 特点 |
|--------|----------|------|
| DeepSeek | https://platform.deepseek.com/ | 便宜 |
| 智谱AI | https://open.bigmodel.cn/ | 有免费额度 |
| OpenAI | https://platform.openai.com/ | 需要代理 |

---

## 技能测试

使用内置测试命令：

```bash
python -m copaw test
```

或运行测试脚本：

```bash
python test_skills.py
```

---

## 常见问题

### Q: 运行报错找不到模块？

安装依赖：
```bash
pip install openai gradio tomli
```

### Q: Python版本要求？

Python 3.8+，推荐 3.10+

### Q: 如何验证配置是否正确？

```bash
python -m copaw test
```

### Q: 如何查看已加载的技能？

```bash
python -m copaw test
```

---

## 项目结构

```
CoPaw-Edu-Final/
├── src/copaw/
│   ├── __main__.py        # 命令行入口
│   ├── app.py             # 主应用
│   ├── ui.py              # Web界面
│   ├── core/              # 核心模块
│   │   ├── config.py           # 配置管理
│   │   ├── llm_client.py       # LLM客户端
│   │   └── skill_loader.py     # 技能加载
│   ├── cli/               # 命令行工具
│   │   └── setup_wizard.py     # 配置向导
│   └── agents/skills/     # 技能库
├── run.py                 # 快速启动
├── web_ui.py              # Web入口
├── pyproject.toml         # 包配置
└── test_skills.py         # 测试脚本
```

---

## 下一步

1. 配置好API后，选择学生/家长/教师角色
2. 在Web界面中与AI对话
3. 技能会根据问题自动激活

需要帮助？查看 [README.md](../README.md) 或提交 Issue。
