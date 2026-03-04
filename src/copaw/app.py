# -*- coding: utf-8 -*-
"""
CoPaw-Edu 主应用
整合技能系统与LLM的完整对话应用
"""
import sys
from pathlib import Path
from typing import List, Optional, Generator

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from copaw.core.config import Config
from copaw.core.llm_client import LLMClient, Message
from copaw.core.skill_loader import SkillLoader


class CoPawEduApp:
    """CoPaw-Edu 应用"""

    def __init__(self):
        """初始化应用"""
        self.config: Optional[Config] = None
        self.llm_client: Optional[LLMClient] = None
        self.skill_loader: Optional[SkillLoader] = None
        self.conversation_history: List[Message] = []

    def initialize(self) -> bool:
        """
        初始化应用

        Returns:
            是否初始化成功
        """
        # 加载配置
        self.config = Config.load()

        if not self.config.is_configured():
            print("⚠️  未检测到配置，请先运行配置向导：")
            print("   python src/copaw/cli/setup_wizard.py")
            return False

        # 初始化LLM客户端
        from copaw.core.config import LLMConfig
        llm_config = LLMConfig(
            provider=self.config.llm.provider,
            api_key=self.config.llm.api_key,
            api_base=self.config.llm.api_base,
            model=self.config.llm.model
        )
        self.llm_client = LLMClient(llm_config)

        # 初始化技能加载器
        self.skill_loader = SkillLoader(self.config.skills)

        return True

    def _build_system_prompt(self) -> str:
        """构建系统提示"""
        role = self.config.app.role

        # 角色定义
        role_prompts = {
            "student": """你是学生的AI学习伙伴，专门帮助学生高效学习。

核心原则：
1. 引导式学习：不直接给答案，而是引导学生思考
2. 个性化教学：根据学生的年级和理解程度调整讲解方式
3. 耐心细致：用简单易懂的语言解释复杂概念
4. 积极鼓励：给予学生正面反馈，培养学习兴趣

学生信息：
- 姓名：{name}
- 年级：{grade_level} {grade}
- 关注学科：{subjects}
""",
            "parent": """你是家长的AI教育顾问，帮助家长了解和指导孩子的学习。

核心原则：
1. 客观专业：提供科学的教育建议
2. 促进沟通：帮助家长与孩子建立良好关系
3. 资源推荐：推荐适合的学习资源
4. 情绪支持：理解家长的焦虑和担忧

家长信息：
- 称呼：{name}
- 孩子：{child_name}
""",
            "teacher": """你是教师的AI教学助手，帮助教师提高教学效率。

核心原则：
1. 专业可靠：提供准确的教学建议
2. 效率优先：帮助教师节省时间
3. 因材施教：关注学生个体差异
4. 家校沟通：协助处理家校事务

教师信息：
- 称呼：{name}
- 学校：{school}
- 班级：{class_name}
"""
        }

        system_prompt = role_prompts.get(role, role_prompts["student"]).format(
            name=self.config.user.name,
            grade_level=self.config.education.grade_level,
            grade=self.config.education.grade,
            subjects="、".join(self.config.education.subjects),
            child_name=self.config.user.child_name,
            school=self.config.user.school,
            class_name=self.config.user.class_name
        )

        # 添加技能prompt
        skills_prompt = self.skill_loader.get_combined_prompt(role)
        if skills_prompt:
            system_prompt += "\n\n# 可用技能\n\n" + skills_prompt

        return system_prompt

    def chat(self, user_message: str, stream: bool = True) -> Generator[str, None, None]:
        """
        对话

        Args:
            user_message: 用户消息
            stream: 是否流式输出

        Yields:
            响应文本
        """
        if not self.llm_client:
            yield "❌ 应用未初始化，请先运行配置向导"
            return

        # 检测是否有匹配的技能
        detected_skill = self.skill_loader.detect_skill_from_message(
            user_message, self.config.app.role
        )

        # 构建消息列表
        messages = [Message(role="system", content=self._build_system_prompt())]

        # 添加历史对话
        messages.extend(self.conversation_history[-10:])  # 保留最近10条

        # 添加用户消息
        messages.append(Message(role="user", content=user_message))

        # 如果检测到特定技能，在用户消息中添加技能提示
        if detected_skill:
            skill = self.skill_loader.get_skill(detected_skill)
            if skill:
                skill_hint = f"\n\n[当前使用技能：{skill.name}]\n请根据该技能的方法论来回答用户的问题。"
                messages[-1] = Message(role="user", content=user_message + skill_hint)

        # 调用LLM
        full_response = ""
        for chunk in self.llm_client.chat(messages, stream=stream):
            full_response += chunk
            yield chunk

        # 保存到历史
        self.conversation_history.append(Message(role="user", content=user_message))
        self.conversation_history.append(Message(role="assistant", content=full_response))

    def chat_sync(self, user_message: str) -> str:
        """同步对话"""
        return "".join(self.chat(user_message, stream=False))

    def clear_history(self):
        """清空对话历史"""
        self.conversation_history = []

    def get_available_skills(self) -> list:
        """获取可用技能"""
        return self.skill_loader.get_skills_by_role(self.config.app.role)


def create_app() -> CoPawEduApp:
    """创建应用实例"""
    app = CoPawEduApp()
    return app
