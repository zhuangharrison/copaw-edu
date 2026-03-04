# -*- coding: utf-8 -*-
"""
CoPaw-Edu 配置管理
"""
import os
from pathlib import Path
from typing import Optional, Dict, Any
from dataclasses import dataclass, field

try:
    import tomli
except ImportError:
    import tomllib as tomli


@dataclass
class LLMConfig:
    """LLM配置"""
    provider: str = "通义千问"
    api_key: str = ""
    api_base: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    model: str = "qwen-plus"


@dataclass
class MultimodalConfig:
    """多模态配置"""
    enabled: bool = False
    provider: str = "seedance"
    api_key: str = ""
    api_base: str = "https://api.seedance.ai/v1"
    model: str = "seedance-2.0"
    default_size: str = "1024x1024"


@dataclass
class UserConfig:
    """用户配置"""
    name: str = "用户"
    child_name: str = ""  # 家长角色
    school: str = ""  # 教师角色
    class_name: str = ""  # 教师角色


@dataclass
class EducationConfig:
    """教育配置"""
    grade_level: str = "初中"
    grade: str = "初二"
    subjects: list = field(default_factory=lambda: ["语文", "数学", "英语"])


@dataclass
class AppConfig:
    """应用配置"""
    name: str = "CoPaw-Edu"
    role: str = "student"


@dataclass
class Config:
    """总配置"""
    app: AppConfig = field(default_factory=AppConfig)
    user: UserConfig = field(default_factory=UserConfig)
    education: EducationConfig = field(default_factory=EducationConfig)
    llm: LLMConfig = field(default_factory=LLMConfig)
    multimodal: MultimodalConfig = field(default_factory=MultimodalConfig)
    skills: list = field(default_factory=lambda: [
        "memory_system", "concept_master", "mistake_master",
        "exam_prep", "multimodal_gen", "ai_study_prompts"
    ])

    @classmethod
    def get_config_dir(cls) -> Path:
        """获取配置目录"""
        return Path.home() / ".copaw-edu"

    @classmethod
    def get_config_file(cls) -> Path:
        """获取配置文件路径"""
        return cls.get_config_dir() / "config.toml"

    @classmethod
    def load(cls) -> "Config":
        """加载配置"""
        config_file = cls.get_config_file()

        if not config_file.exists():
            return cls()

        try:
            with open(config_file, "rb") as f:
                data = tomli.load(f)

            config = cls()

            # 解析app配置
            if "app" in data:
                app_data = data["app"]
                config.app = AppConfig(
                    name=app_data.get("name", "CoPaw-Edu"),
                    role=app_data.get("role", "student")
                )

            # 解析user配置
            if "user" in data:
                user_data = data["user"]
                config.user = UserConfig(
                    name=user_data.get("name", "用户"),
                    child_name=user_data.get("child_name", ""),
                    school=user_data.get("school", ""),
                    class_name=user_data.get("class_name", "")
                )

            # 解析education配置
            if "education" in data:
                edu_data = data["education"]
                config.education = EducationConfig(
                    grade_level=edu_data.get("grade_level", "初中"),
                    grade=edu_data.get("grade", "初二"),
                    subjects=edu_data.get("subjects", ["语文", "数学", "英语"])
                )

            # 解析llm配置
            if "llm" in data:
                llm_data = data["llm"]
                config.llm = LLMConfig(
                    provider=llm_data.get("provider", "通义千问"),
                    api_key=llm_data.get("api_key", ""),
                    api_base=llm_data.get("api_base", ""),
                    model=llm_data.get("model", "qwen-plus")
                )

            # 解析multimodal配置
            if "multimodal" in data:
                mm_data = data["multimodal"]
                config.multimodal = MultimodalConfig(
                    enabled=mm_data.get("enabled", False),
                    provider=mm_data.get("provider", "seedance"),
                    api_key=mm_data.get("api_key", ""),
                    api_base=mm_data.get("api_base", ""),
                    model=mm_data.get("model", "seedance-2.0"),
                    default_size=mm_data.get("default_size", "1024x1024")
                )

            # 解析skills配置
            if "skills" in data:
                config.skills = data["skills"].get("enabled", config.skills)

            return config

        except Exception as e:
            print(f"加载配置失败: {e}")
            return cls()

    def is_configured(self) -> bool:
        """检查是否已配置"""
        return bool(self.llm.api_key)
