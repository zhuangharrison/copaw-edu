# -*- coding: utf-8 -*-
"""
CoPaw-Edu 快速启动脚本
直接双击运行即可启动Web界面
"""
import sys
import os
from pathlib import Path

# 添加src目录到路径
src_path = Path(__file__).parent / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))


def main():
    """主入口"""
    print("""
╔═══════════════════════════════════════════════════════════╗
║                    CoPaw-Edu 教育版                       ║
║                                                           ║
║              让AI助力每一个学习者 🚀                       ║
╚═══════════════════════════════════════════════════════════╝
    """)

    # 检查配置
    from copaw.core.config import Config
    config = Config.load()

    if not config.is_configured():
        print("⚠️  未检测到配置，正在启动配置向导...\n")
        from copaw.cli.setup_wizard import run_setup_wizard
        if not run_setup_wizard():
            print("\n配置已取消，无法启动应用")
            input("\n按回车键退出...")
            return

    # 启动Web UI
    print("\n🚀 正在启动Web界面...\n")

    from copaw.ui import create_web_ui
    app = create_web_ui()

    app.launch(
        server_name="127.0.0.1",
        server_port=7860,
        share=False,
        show_error=True,
        quiet=False
    )


if __name__ == "__main__":
    main()
