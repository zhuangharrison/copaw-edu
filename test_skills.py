# -*- coding: utf-8 -*-
"""
CoPaw-Edu 技能测试脚本
用于验证技能包是否正确安装
"""
import os
import sys
from pathlib import Path

# 技能目录
SKILLS_DIR = Path(__file__).parent / "src" / "copaw" / "agents" / "skills"


def print_header(text):
    """打印标题"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def print_success(text):
    """打印成功"""
    print(f"  ✓ {text}")


def print_error(text):
    """打印错误"""
    print(f"  ✗ {text}")


def print_info(text):
    """打印信息"""
    print(f"  ℹ {text}")


def list_skills():
    """列出所有技能"""
    print_header("CoPaw-Edu 技能列表")

    total_skills = 0

    for role_dir in sorted(SKILLS_DIR.iterdir()):
        if role_dir.is_dir():
            role_name = {
                "student": "学生端",
                "parent": "家长端",
                "teacher": "教师端"
            }.get(role_dir.name, role_dir.name)

            print(f"\n  【{role_name}】")

            for skill_dir in sorted(role_dir.iterdir()):
                if skill_dir.is_dir():
                    skill_file = skill_dir / "SKILL.md"
                    if skill_file.exists():
                        # 读取技能信息
                        try:
                            with open(skill_file, 'r', encoding='utf-8') as f:
                                content = f.read()
                                # 提取name和description
                                name = ""
                                desc = ""
                                version = ""
                                for line in content.split('\n'):
                                    if line.startswith('name:'):
                                        name = line.split(':', 1)[1].strip()
                                    elif line.startswith('description:'):
                                        desc = line.split(':', 1)[1].strip()
                                    elif line.startswith('version:'):
                                        version = line.split(':', 1)[1].strip()
                                if len(desc) > 60:
                                    desc = desc[:60] + "..."
                                print(f"    • {name} (v{version})")
                                print(f"      {desc}")
                                total_skills += 1
                        except Exception as e:
                            print_error(f"读取 {skill_dir.name} 失败: {e}")

    print(f"\n  共 {total_skills} 个技能")
    return total_skills


def test_config():
    """测试配置"""
    print_header("配置检查")

    config_dir = Path.home() / ".copaw-edu"
    config_file = config_dir / "config.toml"

    if config_file.exists():
        print_success(f"配置文件存在")
        print_info(f"位置: {config_file}")

        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # 检查关键配置
            if "api_key" in content:
                if 'api_key = ""' in content or "api_key = \"\"" in content:
                    print_error("API Key 未配置")
                else:
                    print_success("API Key 已配置")
            else:
                print_error("未找到 API Key 配置")

            if "role" in content:
                for role in ["student", "parent", "teacher"]:
                    if f'role = "{role}"' in content:
                        role_name = {"student": "学生", "parent": "家长", "teacher": "教师"}
                        print_success(f"角色: {role_name[role]}")
                        break
        except Exception as e:
            print_error(f"读取配置失败: {e}")
    else:
        print_error("配置文件不存在")
        print_info(f"请运行: python src/copaw/cli/setup_wizard.py")
        print_info(f"配置将保存到: {config_file}")


def test_dependencies():
    """测试依赖"""
    print_header("依赖检查")

    dependencies = [
        ("Python", lambda: sys.version.split()[0], "3.10+"),
    ]

    for name, get_version, required in dependencies:
        try:
            version = get_version()
            print_success(f"{name}: {version} (需要 {required})")
        except Exception as e:
            print_error(f"{name}: 检查失败")


def show_quick_start():
    """显示快速开始指南"""
    print_header("快速开始")

    print("""
  1. 配置API（首次使用）
     python src/copaw/cli/setup_wizard.py

  2. 选择角色
     - 学生: 选择 [1]
     - 家长: 选择 [2]
     - 教师: 选择 [3]

  3. 配置API Key
     - 推荐使用通义千问: https://dashscope.console.aliyun.com/
     - 或 DeepSeek: https://platform.deepseek.com/

  4. 开始使用
     与AI对话时，技能会自动激活

  技能使用示例:
     - "帮我记住: 光合作用的原料、条件、产物"
     - "老师讲的惯性我没听懂"
     - "记录错题: 2x+5=13，我算的x=9，正确答案是x=4"
     - "还有2周期中考，帮我规划"
     - "分析一下我的学习情况"
    """)


def main():
    print("""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║       _____            _____      _     _                 ║
║      / ____|          / ____|    | |   | |                ║
║     | |     ___  _ __| |     __ _| | __| | ___ _ __       ║
║     | |    / _ \\| '__| |    / _` | |/ _` |/ _ \\ '__|      ║
║     | |___| (_) | |  | |___| (_| | | (_| |  __/ |         ║
║      \_____\___/|_|   \_____\__,_|_|\__,_|\___|_|         ║
║                                                           ║
║              教育版 - 让AI助力每一个学习者                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)

    # 检查依赖
    test_dependencies()

    # 列出技能
    skill_count = list_skills()

    # 测试配置
    test_config()

    # 显示快速开始
    show_quick_start()

    print_header("测试完成")
    print(f"""
  技能总数: {skill_count}
  项目位置: {Path(__file__).parent}

  需要帮助? 查看:
    - docs/student-guide.md (学生指南)
    - docs/local-test-guide.md (本地测试指南)
    - docs/faq.md (常见问题)
    """)


if __name__ == "__main__":
    main()
