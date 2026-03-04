# -*- coding: utf-8 -*-
"""
CoPaw-Edu Web UI
完整的Web界面，集成技能系统
"""
import sys
from pathlib import Path

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

try:
    import gradio as gr
    GRADIO_VERSION = tuple(map(int, gr.__version__.split('.')[:2]))
except ImportError:
    import subprocess
    print("正在安装Gradio...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "gradio", "-q"])
    import gradio as gr
    GRADIO_VERSION = tuple(map(int, gr.__version__.split('.')[:2]))

from copaw.core.config import Config
from copaw.core.skill_loader import SkillLoader
from copaw.app import CoPawEduApp, create_app


def create_web_ui():
    """创建Web UI"""

    # 加载配置
    config = Config.load()
    skill_loader = SkillLoader(config.skills)

    # 角色名称
    ROLE_NAMES = {"student": "🎓 学生", "parent": "👨‍👩‍👧 家长", "teacher": "👨‍🏫 教师"}

    # CSS样式
    custom_css = """
    .gradio-container {
        font-family: 'Microsoft YaHei', sans-serif !important;
        max-width: 1200px !important;
        margin: 0 auto !important;
    }
    .chat-message {
        padding: 10px;
        border-radius: 10px;
        margin: 5px 0;
    }
    .user-message {
        background: #e3f2fd;
        text-align: right;
    }
    .assistant-message {
        background: #f5f5f5;
    }
    .skill-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 12px;
        margin: 8px 0;
        background: #fafafa;
    }
    .skill-card:hover {
        background: #f0f0f0;
    }
    .config-status {
        padding: 10px;
        border-radius: 5px;
        margin: 10px 0;
    }
    """

    # 构建 Blocks 参数（兼容 Gradio 5.x 和 6.x）
    blocks_kwargs = {"title": "CoPaw-Edu 教育版"}
    if GRADIO_VERSION < (6, 0):
        blocks_kwargs["css"] = custom_css
        blocks_kwargs["theme"] = gr.themes.Soft()

    with gr.Blocks(**blocks_kwargs) as app:

        # 应用实例（全局）
        app_instance = gr.State(None)

        gr.Markdown("""
        # 🎓 CoPaw-Edu 教育版

        **让AI助力每一个学习者** | [GitHub](https://github.com/xxx/copaw-edu)
        """)

        # 配置状态提示
        with gr.Row():
            with gr.Column():
                if config.is_configured():
                    status_html = f"""
                    <div class="config-status" style="background: #e8f5e9; color: #2e7d32;">
                    ✅ 已配置 | 角色: {ROLE_NAMES.get(config.app.role, config.app.role)} |
                    模型: {config.llm.model}
                    </div>
                    """
                else:
                    status_html = """
                    <div class="config-status" style="background: #fff3e0; color: #e65100;">
                    ⚠️ 未配置API，请先运行配置向导: python src/copaw/cli/setup_wizard.py
                    </div>
                    """
                config_status = gr.HTML(status_html)

        # 主标签页
        with gr.Tabs():
            # 对话标签页
            with gr.TabItem("💬 对话"):
                gr.Markdown("### 与AI学习伙伴对话")

                with gr.Row():
                    with gr.Column(scale=3):
                        # 对话框
                        chatbot_kwargs = {
                            "label": "",
                            "height": 500,
                            "show_label": False,
                        }
                        # bubble_full_width 在 Gradio 5.x 及以下版本支持
                        if GRADIO_VERSION < (6, 0):
                            chatbot_kwargs["bubble_full_width"] = False
                        chatbot = gr.Chatbot(**chatbot_kwargs)

                        # 输入框
                        with gr.Row():
                            msg_input = gr.Textbox(
                                label="",
                                placeholder="输入你的问题... (例如: 帮我记住光合作用的原料、条件、产物)",
                                lines=2,
                                show_label=False,
                                scale=9
                            )
                            submit_btn = gr.Button("发送", variant="primary", scale=1)

                        # 操作按钮
                        with gr.Row():
                            clear_btn = gr.Button("🗑️ 清空对话", size="sm")
                            skill_hint = gr.HTML("")

                    with gr.Column(scale=1):
                        gr.Markdown("#### 📚 快捷技能")
                        gr.Markdown("点击快速使用技能:")

                        # 技能按钮
                        skill_buttons = []
                        skills = skill_loader.get_skills_by_role(config.app.role)
                        for skill in skills[:6]:  # 最多显示6个
                            btn = gr.Button(
                                f"📌 {skill.name[:12]}{'...' if len(skill.name) > 12 else ''}",
                                size="sm",
                                elem_classes=["skill-btn"]
                            )
                            skill_buttons.append((btn, skill.name))

                        gr.Markdown("#### 💡 使用示例")
                        examples = gr.Examples(
                            examples=[
                                ["帮我记住：光合作用的原料、条件、产物"],
                                ["老师讲的惯性我没听懂"],
                                ["记录错题：2x+5=13，我算的x=9，正确答案是x=4"],
                                ["还有2周期中考，帮我规划复习计划"],
                                ["用SWOT分析一下我的英语学习情况"],
                            ],
                            inputs=msg_input,
                            label=""
                        )

            # 技能库标签页
            with gr.TabItem("📚 技能库"):
                gr.Markdown("### 所有可用技能")

                with gr.Row():
                    role_filter = gr.Radio(
                        choices=["全部", "🎓 学生", "👨‍👩‍👧 家长", "👨‍🏫 教师"],
                        value="全部",
                        label="筛选角色"
                    )

                skill_gallery = gr.HTML("")

            # 配置标签页
            with gr.TabItem("⚙️ 配置"):
                gr.Markdown("### 当前配置")

                config_display = gr.JSON(
                    value={
                        "角色": config.app.role,
                        "用户名": config.user.name,
                        "学段": config.education.grade_level,
                        "年级": config.education.grade,
                        "关注学科": config.education.subjects,
                        "模型": config.llm.model,
                        "多模态": "已启用" if config.multimodal.enabled else "未启用"
                    },
                    label=""
                )

                gr.Markdown("""
                ### 修改配置

                运行以下命令重新配置:
                ```bash
                python src/copaw/cli/setup_wizard.py
                ```

                配置文件位置: `~/.copaw-edu/config.toml`
                """)

        # 底部信息
        gr.Markdown("""
        ---
        **CoPaw-Edu** - 让每个学习者都有专属的AI学习伙伴 🚀

        💡 提示: 技能会根据你的问题自动激活，也可以点击上方技能按钮手动使用
        """)

        # 事件处理函数
        def init_app():
            """初始化应用"""
            app = create_app()
            if app.initialize():
                return app, "✅ 应用已就绪"
            return None, "❌ 请先配置API"

        def chat(user_message, history, app_inst):
            """处理对话"""
            if not app_inst:
                yield history + [[user_message, "❌ 应用未初始化，请刷新页面"]], app_inst, ""
                return

            if not user_message.strip():
                yield history, app_inst, ""
                return

            # 检测技能
            detected = skill_loader.detect_skill_from_message(user_message, config.app.role)
            skill_msg = f"🎯 激活技能: {detected}" if detected else ""

            # 调用LLM
            response = ""
            history.append([user_message, ""])

            try:
                for chunk in app_inst.chat(user_message):
                    response += chunk
                    history[-1][1] = response
                    yield history, app_inst, skill_msg
            except Exception as e:
                history[-1][1] = f"❌ 错误: {str(e)}"
                yield history, app_inst, skill_msg

        def use_skill(skill_name, history, app_inst):
            """使用特定技能"""
            skill = skill_loader.get_skill(skill_name)
            if skill:
                prompt = f"请使用【{skill.name}】技能帮助我。技能描述：{skill.description}"
                return chat(prompt, history, app_inst)
            return history, app_inst, f"❌ 未找到技能: {skill_name}"

        def update_skill_gallery(role_filter):
            """更新技能展示"""
            if role_filter == "全部":
                skills = list(skill_loader.get_all_skills().values())
            else:
                role_map = {"🎓 学生": "student", "👨‍👩‍👧 家长": "parent", "👨‍🏫 教师": "teacher"}
                role = role_map.get(role_filter, "student")
                skills = skill_loader.get_skills_by_role(role)

            html = ""
            for skill in skills:
                html += f"""
                <div class="skill-card">
                    <h4>📌 {skill.name}</h4>
                    <p><strong>版本:</strong> {skill.version} | <strong>角色:</strong> {ROLE_NAMES.get(skill.role, skill.role)}</p>
                    <p>{skill.description[:150]}{'...' if len(skill.description) > 150 else ''}</p>
                    <p><strong>标签:</strong> {', '.join(skill.tags)}</p>
                </div>
                """
            return html

        def clear_chat():
            """清空对话"""
            return [], ""

        # 绑定事件
        app.load(
            fn=lambda: (update_skill_gallery("全部"), init_app()[1]),
            outputs=[skill_gallery, config_status]
        )

        submit_btn.click(
            fn=chat,
            inputs=[msg_input, chatbot, app_instance],
            outputs=[chatbot, app_instance, skill_hint]
        ).then(
            fn=lambda: "",
            outputs=msg_input
        )

        msg_input.submit(
            fn=chat,
            inputs=[msg_input, chatbot, app_instance],
            outputs=[chatbot, app_instance, skill_hint]
        ).then(
            fn=lambda: "",
            outputs=msg_input
        )

        clear_btn.click(
            fn=clear_chat,
            outputs=[chatbot, skill_hint]
        )

        role_filter.change(
            fn=update_skill_gallery,
            inputs=[role_filter],
            outputs=[skill_gallery]
        )

        # 技能按钮事件
        for btn, skill_name in skill_buttons:
            btn.click(
                fn=lambda h, a, s=skill_name: use_skill(s, h, a),
                inputs=[chatbot, app_instance],
                outputs=[chatbot, app_instance, skill_hint]
            )

    return app


def main():
    """主入口"""
    print("""
╔═══════════════════════════════════════════════════════════╗
║                    CoPaw-Edu Web UI                       ║
║                                                           ║
║              教育版 - 让AI助力每一个学习者                 ║
╚═══════════════════════════════════════════════════════════╝
    """)

    print("🚀 正在启动Web界面...\n")

    app = create_web_ui()
    app.launch(
        server_name="127.0.0.1",
        server_port=7860,
        share=False,
        show_error=True,
        quiet=True
    )


if __name__ == "__main__":
    main()
