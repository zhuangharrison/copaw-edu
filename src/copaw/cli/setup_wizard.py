# -*- coding: utf-8 -*-
"""
CoPaw-Edu 教育版配置向导
交互式引导用户完成初始配置
"""

import os
import sys
from pathlib import Path
from typing import Optional, List
from enum import Enum


class Color:
    """终端颜色"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'


def print_header(text: str):
    """打印标题"""
    print(f"\n{Color.CYAN}{Color.BOLD}{'='*50}{Color.END}")
    print(f"{Color.CYAN}{Color.BOLD}{text.center(50)}{Color.END}")
    print(f"{Color.CYAN}{Color.BOLD}{'='*50}{Color.END}\n")


def print_step(step: int, text: str):
    """打印步骤"""
    print(f"\n{Color.BLUE}[步骤 {step}]{Color.END} {text}")


def print_success(text: str):
    """打印成功信息"""
    print(f"{Color.GREEN}✓ {text}{Color.END}")


def print_warning(text: str):
    """打印警告信息"""
    print(f"{Color.YELLOW}⚠ {text}{Color.END}")


def print_error(text: str):
    """打印错误信息"""
    print(f"{Color.RED}✗ {text}{Color.END}")


def input_with_default(prompt: str, default: str = "") -> str:
    """带默认值的输入"""
    if default:
        result = input(f"{prompt} [{default}]: ").strip()
        return result if result else default
    return input(f"{prompt}: ").strip()


def select_option(prompt: str, options: List[str]) -> int:
    """单选"""
    print(f"\n{prompt}")
    for i, option in enumerate(options, 1):
        print(f"  {i}. {option}")

    while True:
        try:
            choice = int(input("\n请选择 (输入数字): ").strip())
            if 1 <= choice <= len(options):
                return choice - 1
            print_error(f"请输入 1-{len(options)} 之间的数字")
        except ValueError:
            print_error("请输入有效的数字")


def multi_select(prompt: str, options: List[str]) -> List[int]:
    """多选"""
    print(f"\n{prompt}")
    print("  (可多选，用逗号分隔，如: 1,2,3)")
    for i, option in enumerate(options, 1):
        print(f"  {i}. {option}")

    while True:
        try:
            choices = input("\n请选择: ").strip()
            indices = [int(x.strip()) - 1 for x in choices.split(",")]
            if all(0 <= i < len(options) for i in indices):
                return indices
            print_error(f"请输入 1-{len(options)} 之间的数字")
        except ValueError:
            print_error("请输入有效的数字，用逗号分隔")


def clear_screen():
    """清屏"""
    os.system('cls' if os.name == 'nt' else 'clear')


def show_welcome():
    """显示欢迎界面"""
    clear_screen()
    print(f"""
{Color.CYAN}{Color.BOLD}
   _____            _____      _     _
  / ____|          / ____|    | |   | |
 | |     ___  _ __| |     __ _| | __| | ___ _ __
 | |    / _ \| '__| |    / _` | |/ _` |/ _ \ '__|
 | |___| (_) | |  | |___| (_| | | (_| |  __/ |
  \_____\___/|_|   \_____\__,_|_|\__,_|\___|_|
{Color.END}

{Color.GREEN}      教育版 - 让AI助力每一个学习者{Color.END}

{Color.YELLOW}  学生 · 家长 · 教师{Color.END}
{Color.YELLOW}  自己部署 · 自己配置API · 数据安全{Color.END}

""")


def setup_role() -> str:
    """选择角色"""
    print_step(1, "请选择您的身份")

    options = [
        "🎓 学生 - 我是学习者，需要学习辅导",
        "👨‍👩‍👧 家长 - 我是家长，想了解孩子学习情况",
        "👨‍🏫 教师 - 我是老师，需要教学辅助工具",
    ]

    choice = select_option("", options)

    roles = ["student", "parent", "teacher"]
    selected_role = roles[choice]

    print_success(f"已选择: {options[choice].split(' - ')[0]}")
    return selected_role


def setup_api() -> dict:
    """配置API"""
    print_step(2, "配置AI模型API")

    print("""
请选择您要使用的AI模型提供商:

【订阅制 Coding Plan - 推荐，最省钱】
  💰 订阅制 = 固定月费，无限/大额调用，不用按token付费

  • Qwen Coding Plan (阿里云) - 首月7.9元，9万次/月，支持Qwen3.5/GLM-5/MiniMax/Kimi
  • GLM Coding Plan (智谱AI) - 高性价比，GLM-4.7/GLM-5模型
  • MiniMax Coding Plan - 29元起/月，M2.5系列模型
  • 豆包 Coding Plan (火山引擎) - 字节跳动，Doubao模型

【按量付费 - 传统模式】
  • 通义千问 (阿里云DashScope) - 按token计费
  • DeepSeek - 按token计费，便宜
  • 智谱AI (GLM) - 按token计费
  • Kimi (月之暗面) - 按token计费
  • OpenAI - 按token计费，需要代理
  • 其他兼容OpenAI接口的服务
""")

    # 提供商配置: (名称, base_url, 默认模型, 是否订阅制)
    providers = [
        # 订阅制 Coding Plan
        ("💰 Qwen Coding Plan (订阅制)", "https://coding.dashscope.aliyuncs.com/v1", "qwen3.5-plus", True),
        ("💰 GLM Coding Plan (订阅制)", "https://open.bigmodel.cn/api/coding/paas/v4", "GLM-4.7", True),
        ("💰 MiniMax Coding Plan (订阅制)", "https://api.minimaxi.com/v1", "MiniMax-M2.5", True),
        ("💰 豆包 Coding Plan (订阅制)", "https://ark.cn-beijing.volces.com/api/v3", "doubao-pro-32k", True),
        # 按量付费
        ("通义千问 DashScope (按量)", "https://dashscope.aliyuncs.com/compatible-mode/v1", "qwen-plus", False),
        ("DeepSeek (按量)", "https://api.deepseek.com/v1", "deepseek-chat", False),
        ("智谱AI GLM (按量)", "https://open.bigmodel.cn/api/paas/v4", "glm-4", False),
        ("Kimi 月之暗面 (按量)", "https://api.moonshot.cn/v1", "moonshot-v1-8k", False),
        ("OpenAI (按量，需代理)", "https://api.openai.com/v1", "gpt-4o-mini", False),
        ("自定义", "", "", False),
    ]

    options = [p[0] for p in providers]
    choice = select_option("请选择模型提供商:", options)

    provider_name, default_base, default_model, is_subscription = providers[choice]

    # 订阅制提示
    if is_subscription:
        print(f"\n{Color.GREEN}✓ 您选择了订阅制服务，固定月费，更省钱！{Color.END}")
        subscription_links = {
            0: "https://dashscope.console.aliyun.com/codingPlan",
            1: "https://open.bigmodel.cn/chargemanage/chargemanage",
            2: "https://platform.minimaxi.com/user-center/payment/coding-plan",
            3: "https://console.volcengine.com/ark",
        }
        if choice in subscription_links:
            print(f"  获取API Key: {subscription_links[choice]}")

    api_key = input_with_default("请输入API Key")
    while not api_key:
        print_error("API Key 不能为空")
        api_key = input_with_default("请输入API Key")

    if choice == len(providers) - 1:  # 自定义
        api_base = input_with_default("请输入API地址")
    else:
        api_base = input_with_default("API地址", default_base)

    # 根据提供商推荐模型
    model_suggestions = {
        0: ["qwen3.5-plus", "qwen3-max", "qwen3-coder-next", "glm-5", "minimax-m2.5", "kimi-k2.5"],  # Qwen Coding Plan
        1: ["GLM-4.7", "GLM-5", "GLM-4-Plus"],  # GLM Coding Plan
        2: ["MiniMax-M2.5", "MiniMax-M2.5-highspeed", "MiniMax-M2.1", "MiniMax-M2"],  # MiniMax Coding Plan
        3: ["doubao-pro-32k", "doubao-lite-4k", "doubao-pro-128k"],  # 豆包 Coding Plan
        4: ["qwen-plus", "qwen-turbo", "qwen-max"],  # 通义千问
        5: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"],  # DeepSeek
        6: ["glm-4", "glm-4-plus", "glm-4-flash"],  # 智谱AI
        7: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],  # Kimi
        8: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],  # OpenAI
    }

    print("\n常用模型:")
    suggested_models = model_suggestions.get(choice, ["qwen-plus"])
    for i, m in enumerate(suggested_models, 1):
        print(f"  {i}. {m}")

    model = input_with_default("模型名称", default_model or suggested_models[0])

    print_success("API配置完成")

    return {
        "provider": provider_name,
        "api_key": api_key,
        "api_base": api_base,
        "model": model,
    }


def setup_multimodal_api() -> dict:
    """配置多模态API（图像/视频生成）"""
    print_step(3, "配置多模态API（可选）")

    print("""
多模态API用于生成图像、视频等可视化内容，辅助学习和记忆。

支持的服务商:
  • Seedance 2.0 - 推荐，国产高质量图像/视频生成
  • DALL-E 3 - OpenAI图像生成
  • Midjourney - 艺术感图像
  • Stable Diffusion - 开源，可本地部署
  • Runway - 专业视频生成
  • 自定义API

提示: 如果暂时不需要多模态功能，可以跳过，稍后在配置文件中添加。
""")

    enable = input_with_default("是否配置多模态API? (y/N)", "N")
    if enable.lower() not in ['y', 'yes']:
        print_warning("已跳过多模态API配置，可稍后手动配置")
        return {"enabled": False}

    providers = [
        ("Seedance 2.0", "https://api.seedance.ai/v1", "seedance-2.0"),
        ("DALL-E 3 (OpenAI)", "https://api.openai.com/v1", "dall-e-3"),
        ("Midjourney", "https://api.midjourney.com/v1", "midjourney"),
        ("Stable Diffusion (本地)", "http://127.0.0.1:7860", "sd-xl"),
        ("Runway", "https://api.runwayml.com/v1", "gen-2"),
        ("自定义", "", ""),
    ]

    options = [p[0] for p in providers]
    choice = select_option("请选择多模态服务商:", options)

    provider_name, default_base, default_model = providers[choice]

    api_key = ""
    if choice != 3:  # 不是本地部署
        api_key = input_with_default("请输入API Key")

    if choice == len(providers) - 1:  # 自定义
        api_base = input_with_default("请输入API地址")
        model = input_with_default("模型名称")
    else:
        api_base = input_with_default("API地址", default_base)
        model = input_with_default("模型名称", default_model)

    # 默认配置
    default_size = select_option("默认图像尺寸:", ["1024x1024", "512x512", "1792x1024", "1024x1792"])
    sizes = ["1024x1024", "512x512", "1792x1024", "1024x1792"]

    print_success("多模态API配置完成")

    return {
        "enabled": True,
        "provider": provider_name,
        "api_key": api_key,
        "api_base": api_base,
        "model": model,
        "default_size": sizes[default_size],
    }


def setup_user_info(role: str) -> dict:
    """配置用户信息"""
    print_step(4, "基本信息")

    if role == "student":
        name = input_with_default("你的名字/昵称", "同学")
    elif role == "parent":
        name = input_with_default("您的称呼", "家长")
        child_name = input_with_default("孩子的名字/昵称", "孩子")
    else:  # teacher
        name = input_with_default("您的称呼", "老师")
        school = input_with_default("学校名称", "")
        class_name = input_with_default("班级", "")

    info = {"name": name}

    if role == "parent":
        info["child_name"] = child_name
    elif role == "teacher":
        info["school"] = school
        info["class_name"] = class_name

    return info


def generate_config(role: str, api_config: dict, grade_config: dict, user_info: dict, multimodal_config: dict = None) -> str:
    """生成配置文件内容"""
    config = f"""# CoPaw-Edu 教育版配置文件
# 自动生成于配置向导

[app]
name = "CoPaw-Edu"
role = "{role}"

[user]
name = "{user_info.get('name', '')}"
"""

    if role == "parent":
        config += f'child_name = "{user_info.get("child_name", "")}"\n'
    elif role == "teacher":
        config += f'school = "{user_info.get("school", "")}"\n'
        config += f'class_name = "{user_info.get("class_name", "")}"\n'

    config += f"""
[education]
grade_level = "{grade_config.get('grade_level', '')}"
grade = "{grade_config.get('grade', '')}"
subjects = {grade_config.get('subjects', [])}

[llm]
provider = "{api_config.get('provider', '')}"
api_key = "{api_config.get('api_key', '')}"
api_base = "{api_config.get('api_base', '')}"
model = "{api_config.get('model', '')}"
"""

    # 多模态API配置
    if multimodal_config and multimodal_config.get('enabled'):
        config += f"""
[multimodal]
enabled = true
provider = "{multimodal_config.get('provider', '')}"
api_key = "{multimodal_config.get('api_key', '')}"
api_base = "{multimodal_config.get('api_base', '')}"
model = "{multimodal_config.get('model', '')}"
default_size = "{multimodal_config.get('default_size', '1024x1024')}"
"""
    else:
        config += """
[multimodal]
enabled = false
# 如需启用多模态功能，请配置以下选项：
# provider = "seedance"
# api_key = "your-api-key"
# api_base = "https://api.seedance.ai/v1"
# model = "seedance-2.0"
# default_size = "1024x1024"
"""

    config += """
[skills]
# 根据角色自动启用的技能
"""

    skill_map = {
        "student": ["memory_system", "concept_master", "mistake_master", "exam_prep", "multimodal_gen", "ai_study_prompts"],
        "parent": ["progress_report", "daily_briefing", "resource_finder", "schedule_reminder"],
        "teacher": ["lesson_plan", "quiz_creator", "student_analyzer", "grading_helper", "parent_comm"],
    }

    enabled_skills = skill_map.get(role, [])
    config += f"enabled = {enabled_skills}\n"

    return config


def show_summary(role: str, api_config: dict, grade_config: dict, user_info: dict, multimodal_config: dict = None):
    """显示配置摘要"""
    print_header("配置摘要")

    role_names = {"student": "学生", "parent": "家长", "teacher": "教师"}
    print(f"  角色: {role_names.get(role, role)}")
    print(f"  称呼: {user_info.get('name', '')}")
    print(f"  学段: {grade_config.get('grade_level', '')} {grade_config.get('grade', '')}")
    print(f"  学科: {', '.join(grade_config.get('subjects', []))}")
    print(f"  模型: {api_config.get('model', '')} ({api_config.get('provider', '')})")

    if multimodal_config and multimodal_config.get('enabled'):
        print(f"  多模态: {multimodal_config.get('model', '')} ({multimodal_config.get('provider', '')})")
    else:
        print(f"  多模态: 未配置")


def show_complete():
    """显示完成界面"""
    print_header("配置完成!")
    print(f"""
{Color.GREEN}🎉 恭喜！CoPaw-Edu 已配置完成！{Color.END}

启动方式:
  {Color.CYAN}copaw app{Color.END}          启动Web界面
  {Color.CYAN}copaw app --port 8080{Color.END}  指定端口启动

访问地址:
  {Color.CYAN}http://127.0.0.1:8088{Color.END}

其他命令:
  {Color.CYAN}copaw --help{Color.END}       查看帮助
  {Color.CYAN}copaw config{Color.END}       修改配置

{Color.YELLOW}提示: 首次使用请确保API配置正确{Color.END}
""")


def run_setup_wizard():
    """运行配置向导"""
    try:
        show_welcome()

        print(f"{Color.CYAN}欢迎使用 CoPaw-Edu 教育版配置向导！{Color.END}")
        print("让我们花几分钟完成初始配置...\n")

        input("按 Enter 键继续...")

        # 步骤1: 选择角色
        role = setup_role()

        # 步骤2: 配置API
        api_config = setup_api()

        # 步骤3: 配置多模态API（可选）
        multimodal_config = setup_multimodal_api()

        # 步骤4: 配置学段和学科
        print_step(4, "配置学段和学科")

        # 学段选择
        if role == "student":
            grade_levels = ["小学", "初中", "高中", "大学"]
        elif role == "parent":
            grade_levels = ["幼儿园", "小学", "初中", "高中"]
        else:  # teacher
            grade_levels = ["小学", "初中", "高中"]

        grade_choice = select_option("请选择学段:", grade_levels)
        grade_level = grade_levels[grade_choice]

        # 年级选择
        grade_map = {
            "小学": ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
            "初中": ["初一", "初二", "初三"],
            "高中": ["高一", "高二", "高三"],
            "大学": ["大一", "大二", "大三", "大四"],
            "幼儿园": ["小班", "中班", "大班"],
        }

        if grade_level in grade_map:
            grade_choice = select_option("请选择年级:", grade_map[grade_level])
            grade = grade_map[grade_level][grade_choice]
        else:
            grade = grade_level

        # 学科选择
        subjects = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治"]
        selected = multi_select("请选择关注的学科:", subjects)
        selected_subjects = [subjects[i] for i in selected]

        grade_config = {
            "grade_level": grade_level,
            "grade": grade,
            "subjects": selected_subjects,
        }

        print_success(f"学段: {grade_level} {grade}")
        print_success(f"关注学科: {', '.join(selected_subjects)}")

        # 步骤5: 用户信息
        user_info = setup_user_info(role)

        # 显示摘要
        show_summary(role, api_config, grade_config, user_info, multimodal_config)

        # 确认
        confirm = input_with_default("\n确认配置? (Y/n)", "Y")
        if confirm.lower() not in ['y', 'yes', '']:
            print_warning("配置已取消")
            return False

        # 生成配置文件
        config_content = generate_config(role, api_config, grade_config, user_info, multimodal_config)

        # 保存配置
        config_dir = Path.home() / ".copaw-edu"
        config_dir.mkdir(parents=True, exist_ok=True)
        config_file = config_dir / "config.toml"

        with open(config_file, 'w', encoding='utf-8') as f:
            f.write(config_content)

        print_success(f"配置已保存到: {config_file}")

        # 显示完成界面
        show_complete()

        return True

    except KeyboardInterrupt:
        print(f"\n{Color.YELLOW}配置已取消{Color.END}")
        return False
    except Exception as e:
        print_error(f"配置过程出错: {e}")
        return False


def main():
    """主入口"""
    success = run_setup_wizard()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
