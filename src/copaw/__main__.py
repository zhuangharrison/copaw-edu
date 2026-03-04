# -*- coding: utf-8 -*-
"""
CoPaw-Edu 命令行入口
支持: python -m copaw [command]
"""
import sys
import argparse


def main():
    """主入口"""
    parser = argparse.ArgumentParser(
        description="CoPaw-Edu 教育版 - 让AI助力每一个学习者",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python -m copaw app              启动Web界面
  python -m copaw app --port 8080  指定端口启动
  python -m copaw setup            运行配置向导
  python -m copaw --version        显示版本

更多信息请访问: https://github.com/xxx/copaw-edu
        """
    )

    parser.add_argument(
        "--version", "-v",
        action="store_true",
        help="显示版本信息"
    )

    subparsers = parser.add_subparsers(dest="command", help="可用命令")

    # app 命令
    app_parser = subparsers.add_parser("app", help="启动Web应用")
    app_parser.add_argument(
        "--port", "-p",
        type=int,
        default=7860,
        help="Web服务端口 (默认: 7860)"
    )
    app_parser.add_argument(
        "--host",
        type=str,
        default="127.0.0.1",
        help="Web服务地址 (默认: 127.0.0.1)"
    )
    app_parser.add_argument(
        "--share",
        action="store_true",
        help="创建公开链接 (需要Gradio share功能)"
    )

    # setup 命令
    subparsers.add_parser("setup", help="运行配置向导")

    # test 命令
    test_parser = subparsers.add_parser("test", help="测试API连接")
    test_parser.add_argument(
        "--skill",
        type=str,
        help="测试特定技能"
    )

    args = parser.parse_args()

    # 显示版本
    if args.version:
        from copaw import __version__
        print(f"CoPaw-Edu v{__version__}")
        return

    # 处理命令
    if args.command == "app":
        start_web_app(args.port, args.host, args.share)
    elif args.command == "setup":
        run_setup()
    elif args.command == "test":
        run_test(args.skill)
    else:
        parser.print_help()


def start_web_app(port: int, host: str, share: bool):
    """启动Web应用"""
    from copaw.ui import create_web_ui

    print(f"""
╔═══════════════════════════════════════════════════════════╗
║                    CoPaw-Edu Web UI                       ║
║                                                           ║
║              教育版 - 让AI助力每一个学习者                 ║
╚═══════════════════════════════════════════════════════════╝
    """)

    print(f"正在启动Web界面...")
    print(f"访问地址: http://{host}:{port}")

    if share:
        print("注意: 公开链接将在启动后显示")

    app = create_web_ui()
    app.launch(
        server_name=host,
        server_port=port,
        share=share,
        show_error=True,
        quiet=True
    )


def run_setup():
    """运行配置向导"""
    from copaw.cli.setup_wizard import run_setup_wizard
    run_setup_wizard()


def run_test(skill_name: str = None):
    """运行测试"""
    from copaw.core.config import Config
    from copaw.core.skill_loader import SkillLoader
    from copaw.core.llm_client import LLMClient

    print("=" * 50)
    print("CoPaw-Edu 测试")
    print("=" * 50)

    # 测试配置
    print("\n[1] 测试配置加载...")
    config = Config.load()
    if config.is_configured():
        print(f"  角色配置: {config.app.role}")
        print(f"  模型配置: {config.llm.model}")
        print("  配置状态: OK")
    else:
        print("  配置状态: 未配置")
        print("  请先运行: python -m copaw setup")
        return

    # 测试技能加载
    print("\n[2] 测试技能加载...")
    loader = SkillLoader(config.skills)
    skills = loader.get_all_skills()
    print(f"  已加载技能: {len(skills)} 个")

    if skill_name:
        skill = loader.get_skill(skill_name)
        if skill:
            print(f"\n  技能详情: {skill.name}")
            print(f"  版本: {skill.version}")
            print(f"  描述: {skill.description[:50]}...")
        else:
            print(f"  未找到技能: {skill_name}")

    # 测试API连接
    print("\n[3] 测试API连接...")
    try:
        from copaw.core.config import LLMConfig
        llm_config = LLMConfig(
            provider=config.llm.provider,
            api_key=config.llm.api_key,
            api_base=config.llm.api_base,
            model=config.llm.model
        )
        client = LLMClient(llm_config)
        success, msg = client.test_connection()
        if success:
            print(f"  API状态: OK - {msg}")
        else:
            print(f"  API状态: 失败 - {msg}")
    except Exception as e:
        print(f"  API状态: 错误 - {e}")

    print("\n" + "=" * 50)
    print("测试完成!")


if __name__ == "__main__":
    main()
