# -*- coding: utf-8 -*-
"""
CoPaw-Edu Web UI 入口
启动完整的Web应用界面
"""
import sys
from pathlib import Path

# 添加src目录到路径
src_path = Path(__file__).parent / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))


def main():
    """主入口"""
    print("""
╔═══════════════════════════════════════════════════════════╗
║                    CoPaw-Edu Web UI                       ║
║                                                           ║
║              教育版 - 让AI助力每一个学习者                 ║
╚═══════════════════════════════════════════════════════════╝
    """)

    print("正在启动Web界面...")
    print("启动后请在浏览器中打开显示的地址")
    print("按 Ctrl+C 停止服务\n")

    # 使用集成框架的UI
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
