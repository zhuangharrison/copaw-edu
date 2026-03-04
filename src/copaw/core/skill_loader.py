# -*- coding: utf-8 -*-
"""
CoPaw-Edu 技能加载器
"""
import re
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class Skill:
    """技能"""
    name: str
    description: str
    version: str
    tags: List[str]
    content: str  # 完整的SKILL.md内容
    role: str  # student, parent, teacher
    path: Path  # 文件路径


class SkillLoader:
    """技能加载器"""

    # 技能目录
    SKILLS_DIR = Path(__file__).parent.parent / "agents" / "skills"

    def __init__(self, enabled_skills: List[str] = None):
        """
        初始化技能加载器

        Args:
            enabled_skills: 启用的技能列表
        """
        self.enabled_skills = enabled_skills or []
        self._skills: Dict[str, Skill] = {}
        self._load_all_skills()

    def _parse_skill_md(self, content: str, path: Path, role: str) -> Optional[Skill]:
        """
        解析SKILL.md文件

        Args:
            content: 文件内容
            path: 文件路径
            role: 角色类型

        Returns:
            Skill对象或None
        """
        # 解析YAML front matter
        front_matter = {}
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                yaml_content = parts[1].strip()
                for line in yaml_content.split('\n'):
                    if ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip()
                        value = value.strip()
                        # 处理列表类型
                        if value.startswith('[') and value.endswith(']'):
                            value = [v.strip().strip('"\'') for v in value[1:-1].split(',')]
                        elif value.startswith('"') and value.endswith('"'):
                            value = value[1:-1]
                        elif value.startswith("'") and value.endswith("'"):
                            value = value[1:-1]
                        front_matter[key] = value

        if not front_matter.get('name'):
            return None

        return Skill(
            name=front_matter.get('name', ''),
            description=front_matter.get('description', ''),
            version=front_matter.get('version', '1.0.0'),
            tags=front_matter.get('tags', []),
            content=content,
            role=role,
            path=path
        )

    def _load_all_skills(self):
        """加载所有技能"""
        if not self.SKILLS_DIR.exists():
            return

        for role_dir in self.SKILLS_DIR.iterdir():
            if role_dir.is_dir() and role_dir.name in ['student', 'parent', 'teacher']:
                for skill_dir in role_dir.iterdir():
                    if skill_dir.is_dir():
                        skill_file = skill_dir / "SKILL.md"
                        if skill_file.exists():
                            try:
                                with open(skill_file, 'r', encoding='utf-8') as f:
                                    content = f.read()
                                skill = self._parse_skill_md(content, skill_file, role_dir.name)
                                if skill:
                                    self._skills[skill.name] = skill
                            except Exception as e:
                                print(f"加载技能失败 {skill_dir.name}: {e}")

    def get_skill(self, name: str) -> Optional[Skill]:
        """获取技能"""
        return self._skills.get(name)

    def get_skills_by_role(self, role: str) -> List[Skill]:
        """获取指定角色的技能"""
        return [s for s in self._skills.values() if s.role == role]

    def get_enabled_skills(self) -> List[Skill]:
        """获取启用的技能"""
        if not self.enabled_skills:
            return []
        return [self._skills.get(name) for name in self.enabled_skills if self._skills.get(name)]

    def get_all_skills(self) -> Dict[str, Skill]:
        """获取所有技能"""
        return self._skills

    def get_skill_prompt(self, name: str) -> str:
        """
        获取技能的完整prompt（用于注入到对话中）

        Args:
            name: 技能名称

        Returns:
            技能的prompt内容
        """
        skill = self.get_skill(name)
        if skill:
            return skill.content
        return ""

    def get_combined_prompt(self, role: str = None) -> str:
        """
        获取组合的技能prompt

        Args:
            role: 角色类型，如果指定则只返回该角色的技能

        Returns:
            组合的prompt
        """
        prompts = []

        if role:
            skills = self.get_skills_by_role(role)
        else:
            skills = self.get_enabled_skills()

        for skill in skills:
            if skill:
                prompts.append(f"""
## 技能：{skill.name}
{skill.content}
---
""")

        return "\n".join(prompts)

    def detect_skill_from_message(self, message: str, role: str = "student") -> Optional[str]:
        """
        从消息中检测应该使用的技能

        Args:
            message: 用户消息
            role: 用户角色

        Returns:
            技能名称或None
        """
        message_lower = message.lower()

        # 关键词映射
        skill_keywords = {
            "memory_system": [
                "记住", "记忆", "背", "背诵", "怎么记", "帮我记", "复习",
                "遗忘", "艾宾浩斯", "记忆宫殿", "口诀"
            ],
            "concept_master": [
                "听不懂", "不理解", "什么是", "解释", "讲一下", "怎么理解",
                "概念", "原理", "意思", "老师讲"
            ],
            "mistake_master": [
                "错题", "做错了", "错误", "错在哪", "为什么错",
                "记录错题", "错题本", "分析错"
            ],
            "exam_prep": [
                "考试", "考前", "冲刺", "复习计划", "备考", "还有几天",
                "期中", "期末", "月考", "高考", "中考"
            ],
            "multimodal_gen": [
                "生成图", "画图", "生成视频", "思维导图",
                "可视化", "图像", "演示图"
            ],
            "ai_study_prompts": [
                "swot", "分析学习", "作文批改", "满分作文",
                "答题策略", "考试技巧", "nlp", "心态"
            ]
        }

        skills = self.get_skills_by_role(role)

        for skill in skills:
            if skill.name in skill_keywords:
                keywords = skill_keywords[skill.name]
                for keyword in keywords:
                    if keyword in message_lower:
                        return skill.name

        return None
