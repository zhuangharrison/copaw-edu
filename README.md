# CoPaw-Edu 教育版

**让AI助力每一个学习者** 🎓

面向学生、家长、教师的个人教育AI助理工作站。自己部署，自己配API，数据安全可控。

## ✨ 特点

- 🎓 **三角色支持**：学生、家长、教师专属模式
- 🔒 **数据安全**：本地部署，数据不出本地
- 🛠️ **开箱即用**：15个预置教育技能
- 🎯 **简单配置**：交互式配置向导
- 📱 **多端访问**：Web界面，支持多平台
- 🎨 **多模态支持**：图像/视频生成辅助学习

## 🚀 快速开始

### 方式一：从源码运行（推荐）

```bash
# 克隆项目
git clone https://github.com/xxx/copaw-edu.git
cd copaw-edu

# 安装依赖
pip install -e .

# 运行配置向导
python -m copaw setup

# 启动Web界面
python -m copaw app

# 或直接运行
python run.py
```

### 方式二：快速体验（无需安装）

```bash
# 克隆项目
git clone https://github.com/xxx/copaw-edu.git
cd copaw-edu

# 安装依赖
pip install openai gradio tomli

# 启动（首次会自动进入配置向导）
python run.py
```

### 方式三：pip安装

```bash
# 安装
pip install copaw-edu

# 配置
copaw setup

# 启动
copaw app
```

访问 http://127.0.0.1:7860 开始使用！

### 命令行用法

```bash
# 查看帮助
python -m copaw --help

# 启动Web界面
python -m copaw app

# 指定端口启动
python -m copaw app --port 8080

# 创建公开链接（需要Gradio）
python -m copaw app --share

# 运行配置向导
python -m copaw setup

# 测试配置
python -m copaw test
```

## 👥 角色说明

### 🎓 学生版

**适合：** 小学、初中、高中、大学生

**核心技能（6个）：**

| 技能 | 说明 |
|------|------|
| **智能记忆系统** | 5大记忆法专家 + 艾宾浩斯复习周期 |
| **知识理解专家** | 费曼学习法 + 诊断式讲解，学完自动加入记忆系统 |
| **错题管家** | 6种错误分类 + 名师精讲 + 1-3年长期追踪 |
| **考前冲刺规划** | 整合错题本+记忆库 + 个性化复习计划 |
| **多模态生成器** | 图像/视频生成辅助记忆和理解（支持自定义API） |
| **AI赋能提示词库** | 15大核心提示词模板（源自《AI赋能学习详解》） |

**AI赋能提示词库包含：**
- SWOT学习分析
- 四重结构知识解析
- NLP六层次考前心态调适
- 高考状元答题策略
- 学霸级错题本制作
- 满分作文分析
- 作文批改评分
- 连锁记忆法训练
- ...等15个

**特点：** 引导式学习，培养独立思考能力

---

### 👨‍👩‍👧 家长版

**适合：** 关注孩子学习的家长

**核心技能：**
| 技能 | 说明 |
|------|------|
| 学习报告 | 周报/月报分析 |
| 每日简报 | 孩子每天学习情况 |
| 资源推荐 | 教育资源推荐 |
| 作息提醒 | 学习时间管理 |

**特点：** 客观专业，促进亲子沟通

---

### 👨‍🏫 教师版

**适合：** 中小学教师

**核心技能：**
| 技能 | 说明 |
|------|------|
| 教案生成 | 快速制作教学设计 |
| 试卷生成 | 智能出题组卷 |
| 学情分析 | 学生学习情况分析 |
| 批改辅助 | 提高批改效率 |
| 家校沟通 | 专业沟通文案 |

**特点：** 提升教学效率，专业可靠

## 🔑 API配置

### 支持的语言模型

| 提供商 | 说明 | 推荐度 |
|--------|------|--------|
| 通义千问 | 阿里云，国内稳定 | ⭐⭐⭐⭐⭐ |
| 文心一言 | 百度 | ⭐⭐⭐⭐ |
| 智谱AI | ChatGLM | ⭐⭐⭐⭐ |
| DeepSeek | 性价比高 | ⭐⭐⭐⭐ |
| OpenAI | 需要代理 | ⭐⭐⭐ |

### 支持的多模态模型（可选）

| 提供商 | 类型 | 特点 |
|--------|------|------|
| Seedance 2.0 | 图像/视频 | 推荐，国产、中文友好 |
| DALL-E 3 | 图像 | OpenAI出品 |
| Stable Diffusion | 图像 | 可本地部署，免费 |

### 获取API Key

**语言模型：**
1. **通义千问**：https://dashscope.console.aliyun.com/
2. **文心一言**：https://console.bce.baidu.com/qianfan/
3. **智谱AI**：https://open.bigmodel.cn/
4. **DeepSeek**：https://platform.deepseek.com/

**多模态模型：**
1. **Seedance**：https://seedance.ai
2. **Runway**：https://runwayml.com

### 配置示例

```toml
[llm]
provider = "通义千问"
api_key = "sk-xxxxxxxx"
api_base = "https://dashscope.aliyuncs.com/compatible-mode/v1"
model = "qwen-plus"

[multimodal]
enabled = true
provider = "seedance"
api_key = "your-seedance-api-key"
api_base = "https://api.seedance.ai/v1"
model = "seedance-2.0"
```

## 📖 使用指南

- [学生使用指南](docs/student-guide.md)
- [家长使用指南](docs/parent-guide.md)
- [教师使用指南](docs/teacher-guide.md)
- [API配置教程](docs/api-setup.md)
- [常见问题](docs/faq.md)

## 📁 项目结构

```
CoPaw-Edu/
├── src/copaw/
│   ├── __init__.py        # 包初始化
│   ├── __main__.py        # 命令行入口
│   ├── app.py             # 主应用类
│   ├── ui.py              # Web UI (Gradio)
│   ├── core/              # 核心模块
│   │   ├── config.py           # 配置管理
│   │   ├── llm_client.py       # LLM客户端
│   │   └── skill_loader.py     # 技能加载器
│   ├── cli/               # 命令行工具
│   │   └── setup_wizard.py     # 配置向导
│   └── agents/skills/     # 技能库
│       ├── student/            # 学生技能（6个核心技能）
│       │   ├── memory_system/       # 智能记忆系统
│       │   ├── concept_master/      # 知识理解专家
│       │   ├── mistake_master/      # 错题管家
│       │   ├── exam_prep/           # 考前冲刺规划
│       │   ├── multimodal_gen/      # 多模态生成器
│       │   └── ai_study_prompts/    # AI赋能提示词库
│       ├── parent/             # 家长技能（4个）
│       └── teacher/            # 教师技能（5个）
├── docs/                  # 使用文档
├── run.py                 # 快速启动脚本
├── web_ui.py              # Web UI入口
├── pyproject.toml         # 包配置
└── README.md              # 说明文档
```

## 💬 常见问题

### Q: 数据安全吗？
A: 完全本地部署，数据不会上传到任何服务器。API调用只发送必要的问题内容。

### Q: 需要什么配置？
A: 任何能运行Python的电脑即可，对配置要求很低。

### Q: 收费吗？
A: 软件完全免费开源（MIT协议）。但使用AI模型需要向模型提供商付费（按使用量计费，一般很便宜）。

### Q: 能离线使用吗？
A: 需要联网调用AI模型API。如需完全离线，可以配置本地模型（如Ollama + Stable Diffusion）。

### Q: 孩子会依赖AI吗？
A: 学生版设计为引导式学习，不会直接给答案，培养独立思考能力。

### Q: 多模态功能必须配置吗？
A: 不是必须的。多模态是可选功能，不配置也能使用其他学习功能。

## 🙏 致谢

- 技能系统基于 [CoPaw](https://github.com/xxx/copaw) 项目
- AI赋能提示词库源自《[AI赋能学习详解](https://www.pup.cn/)》（庄海湛 著，北京大学出版社）
- 记忆法系统参考世界记忆锦标赛训练方法

## 🤝 技术支持

- 问题反馈：[GitHub Issues](https://github.com/xxx/copaw-edu/issues)
- 交流群：待补充

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

---

**CoPaw-Edu** - 让每个学习者都有专属的AI学习伙伴 🚀
