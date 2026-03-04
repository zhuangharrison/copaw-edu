# -*- coding: utf-8 -*-
"""
CoPaw-Edu LLM客户端
支持OpenAI兼容接口（通义千问、DeepSeek、智谱AI等）
"""
import json
from typing import Optional, List, Dict, Any, Generator
from dataclasses import dataclass


@dataclass
class Message:
    """消息"""
    role: str  # system, user, assistant
    content: str


class LLMClient:
    """LLM客户端"""

    def __init__(self, config):
        """
        初始化LLM客户端

        Args:
            config: LLMConfig对象
        """
        self.config = config
        self._client = None

    def _get_client(self):
        """获取OpenAI客户端"""
        if self._client is None:
            try:
                from openai import OpenAI
                self._client = OpenAI(
                    api_key=self.config.api_key,
                    base_url=self.config.api_base
                )
            except ImportError:
                raise ImportError("请安装openai: pip install openai")
        return self._client

    def chat(
        self,
        messages: List[Message],
        stream: bool = True,
        **kwargs
    ) -> Generator[str, None, None]:
        """
        发送对话请求

        Args:
            messages: 消息列表
            stream: 是否流式输出
            **kwargs: 其他参数

        Yields:
            响应文本（流式）
        """
        client = self._get_client()

        # 转换消息格式
        formatted_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]

        # 设置默认参数
        params = {
            "model": kwargs.get("model", self.config.model),
            "messages": formatted_messages,
            "stream": stream,
            "temperature": kwargs.get("temperature", 0.7),
            "max_tokens": kwargs.get("max_tokens", 4096),
        }

        try:
            response = client.chat.completions.create(**params)

            if stream:
                for chunk in response:
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            else:
                yield response.choices[0].message.content

        except Exception as e:
            yield f"[错误] {str(e)}"

    def chat_sync(
        self,
        messages: List[Message],
        **kwargs
    ) -> str:
        """
        同步对话（非流式）

        Args:
            messages: 消息列表
            **kwargs: 其他参数

        Returns:
            响应文本
        """
        return "".join(self.chat(messages, stream=False, **kwargs))

    def test_connection(self) -> tuple:
        """
        测试连接

        Returns:
            (success: bool, message: str)
        """
        try:
            client = self._get_client()
            response = client.chat.completions.create(
                model=self.config.model,
                messages=[{"role": "user", "content": "你好"}],
                max_tokens=10
            )
            return True, "连接成功"
        except Exception as e:
            return False, str(e)
