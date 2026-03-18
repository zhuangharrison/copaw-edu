/**
 * OpenMAIC 课堂生成引擎
 *
 * 一键生成完整课堂：
 * 1. 根据主题 → 生成大纲和学习目标
 * 2. 根据大纲 → 拆分为多个场景（4种类型）
 * 3. 每个场景 → 分配智能体角色 + 生成脚本
 * 4. 场景中 → 生成白板内容 + 媒体建议
 */

import { randomBytes } from 'crypto';
import type {
  Classroom, Scene, SceneAgent, SceneType,
  GenerateClassroomOptions, AgentRole,
  SCENE_TYPE_CONFIG, WhiteboardElement,
} from './types';

/**
 * 生成课堂大纲的 prompt
 */
function buildOutlinePrompt(opts: GenerateClassroomOptions): string {
  return `你是一位资深教学设计专家。请根据以下信息，设计一堂完整的课程大纲。

课程信息：
- 主题：${opts.topic}
- 学科：${opts.subject}
- 学段：${opts.gradeLevel} ${opts.grade}
- 场景数量：${opts.sceneCount} 个
- 总时长：${opts.totalDuration ?? opts.sceneCount * 8} 分钟
${opts.additionalNotes ? `- 补充说明：${opts.additionalNotes}` : ''}

请设计 ${opts.sceneCount} 个教学场景，场景类型包括：
- lecture（讲授）：教师讲解知识点，配合板书/演示
- discussion（讨论）：多角色互动讨论，深化理解
- quiz（测验）：互动问答，检验学习效果
- activity（活动）：实践操作、实验演示、创作任务

请以 JSON 格式返回：
{
  "title": "课程标题",
  "objectives": ["学习目标1", "学习目标2", ...],
  "outline": "课程整体大纲描述",
  "scenes": [
    {
      "title": "场景标题",
      "type": "lecture|discussion|quiz|activity",
      "description": "场景描述",
      "duration": 8,
      "keyPoints": ["知识点1", "知识点2"]
    }
  ]
}

要求：
1. 场景类型要多样化，不能全是同一种
2. 开头建议用 lecture 引入，中间穿插 discussion 和 activity，结尾用 quiz 检验
3. 知识点要具体、准确
4. 时长合理分配
5. 仅返回 JSON，不要其他文字`;
}

/**
 * 生成单个场景完整脚本的 prompt
 */
function buildSceneScriptPrompt(
  classroom: { title: string; subject: string; gradeLevel: string; grade: string; outline: string },
  scene: { title: string; type: SceneType; description: string; keyPoints: string[] },
): string {
  const typeDesc = {
    lecture: '讲授型场景：由教师角色主导讲解，可以穿插提问。请写出完整的讲解稿。',
    discussion: '讨论型场景：包含教师和2个学生的多角色对话。学生A好奇好问，学生B善于质疑。请写出完整的对话剧本。',
    quiz: '测验型场景：教师出题，学生作答，教师点评。请写出3-5道题目及互动过程。',
    activity: '活动型场景：引导学生进行实践操作或创作任务。请写出活动步骤和指导语。',
  };

  return `你是一位优秀的${classroom.subject}教师，正在为${classroom.gradeLevel}${classroom.grade}的学生上课。

课程：${classroom.title}
当前场景：${scene.title}
场景类型：${typeDesc[scene.type]}
场景描述：${scene.description}
核心知识点：${scene.keyPoints.join('、')}

请生成这个场景的完整教学脚本。

格式要求：
1. 如果是讨论型（discussion），用角色标注格式：
   【教师】：内容...
   【学生A】：内容...
   【学生B】：内容...

2. 如果是讲授型（lecture），用教师独白格式，穿插板书标注：
   【教师】：内容...
   [板书] 标题：内容

3. 如果是测验型（quiz），用问答格式：
   【教师】：第1题：...
   【学生A】：（思考后回答）...
   【教师】：（点评）...

4. 如果是活动型（activity），写清楚：
   【活动步骤】
   【教师指导语】
   【预期学生反馈】

要求：
- 语言生动，符合课堂氛围
- 知识准确，逻辑清晰
- 适合${classroom.gradeLevel}学生的认知水平
- 每个角色的性格要一致`;
}

/**
 * 为场景生成白板内容的 prompt
 */
function buildWhiteboardPrompt(
  scene: { title: string; type: SceneType; keyPoints: string[]; content: string },
): string {
  return `根据以下教学场景内容，设计白板上需要展示的内容。

场景：${scene.title}
知识点：${scene.keyPoints.join('、')}

请以 JSON 数组格式返回白板元素：
[
  { "type": "text", "x": 50, "y": 30, "content": "标题", "style": { "fontSize": 28, "fontWeight": "bold" } },
  { "type": "text", "x": 50, "y": 80, "content": "要点1", "style": { "fontSize": 18 } },
  { "type": "shape", "x": 40, "y": 150, "width": 200, "height": 60, "content": "公式或概念", "style": { "borderColor": "#3b82f6", "borderWidth": 2 } },
  { "type": "line", "x": 100, "y": 120, "width": 300, "style": { "color": "#ef4444" } },
  { "type": "latex", "x": 50, "y": 250, "content": "E = mc^2", "style": { "fontSize": 24 } }
]

要求：
- 内容简洁，突出重点
- 布局美观，层次分明
- 坐标使用百分比（0-100）
- 仅返回 JSON 数组`;
}

// ==================== 智能体角色模板 ====================

const AGENT_TEMPLATES: Record<AgentRole, { name: string; systemPrompt: string; avatar: string; voiceId: string }> = {
  teacher: {
    name: '老师',
    systemPrompt: '你是一位经验丰富的教师，讲解清晰，善于引导思考。你要按照教学脚本进行讲授，语气亲切专业。',
    avatar: '👨‍🏫',
    voiceId: 'teacher-male',
  },
  student_a: {
    name: '小明',
    systemPrompt: '你是一个好奇心强、爱提问的学生。你会认真听讲，积极回答问题，偶尔提出自己的疑惑。',
    avatar: '👦',
    voiceId: 'student-male',
  },
  student_b: {
    name: '小红',
    systemPrompt: '你是一个善于思考、敢于质疑的学生。你会从不同角度思考问题，有时提出与众不同的见解。',
    avatar: '👧',
    voiceId: 'student-female',
  },
  moderator: {
    name: '主持人',
    systemPrompt: '你是课堂活动的主持人，负责引导活动流程，确保每个环节顺利进行。',
    avatar: '🎤',
    voiceId: 'moderator',
  },
  expert: {
    name: '专家',
    systemPrompt: '你是该领域的专家嘉宾，提供专业深入的解析和扩展知识。',
    avatar: '🧑‍🔬',
    voiceId: 'expert',
  },
  copaw: {
    name: 'CoPaw助手',
    systemPrompt: '你是CoPaw学习助手，帮助学生运用记忆系统、错题分析等学习方法来巩固课堂内容。',
    avatar: '🐾',
    voiceId: 'copaw',
  },
};

// ==================== 核心生成函数 ====================

interface LLMCallFn {
  (prompt: string, systemPrompt?: string): Promise<string>;
}

/**
 * 一键生成课堂
 */
export async function generateClassroom(
  opts: GenerateClassroomOptions,
  llmCall: LLMCallFn,
  onProgress?: (stage: string, progress: number) => void,
): Promise<Classroom> {
  const classroomId = `cls_${randomBytes(8).toString('hex')}`;

  // === Step 1: 生成大纲 ===
  onProgress?.('正在生成课程大纲...', 10);

  const outlinePrompt = buildOutlinePrompt(opts);
  const outlineRaw = await llmCall(outlinePrompt);
  const outlineData = parseJSON(outlineRaw);

  if (!outlineData?.scenes || !Array.isArray(outlineData.scenes)) {
    throw new Error('大纲生成失败，请重试');
  }

  const classroom: Classroom = {
    id: classroomId,
    title: outlineData.title ?? opts.topic,
    subject: opts.subject,
    gradeLevel: opts.gradeLevel,
    grade: opts.grade,
    outline: outlineData.outline ?? '',
    objectives: outlineData.objectives ?? [],
    scenes: [],
    status: 'generating',
    createdAt: new Date().toISOString(),
    copawSkillIds: opts.withCoPawSkills ? [] : undefined,
  };

  // === Step 2: 为每个场景生成脚本 ===
  const totalScenes = outlineData.scenes.length;

  for (let i = 0; i < totalScenes; i++) {
    const sceneData = outlineData.scenes[i];
    const progress = 20 + Math.floor((i / totalScenes) * 60);
    onProgress?.(`正在生成场景 ${i + 1}/${totalScenes}：${sceneData.title}`, progress);

    // 生成场景脚本
    const scriptPrompt = buildSceneScriptPrompt(
      { title: classroom.title, subject: opts.subject, gradeLevel: opts.gradeLevel, grade: opts.grade, outline: classroom.outline },
      sceneData,
    );
    const scriptContent = await llmCall(scriptPrompt);

    // 场景类型对应的智能体
    const sceneType = (sceneData.type as SceneType) || 'lecture';
    const typeConfig = {
      lecture: { agentRoles: ['teacher'] as AgentRole[] },
      discussion: { agentRoles: ['teacher', 'student_a', 'student_b'] as AgentRole[] },
      quiz: { agentRoles: ['teacher', 'student_a'] as AgentRole[] },
      activity: { agentRoles: ['teacher', 'moderator'] as AgentRole[] },
    };

    const agentRoles = typeConfig[sceneType]?.agentRoles ?? ['teacher'];
    const agents: SceneAgent[] = agentRoles.map((role) => {
      const template = AGENT_TEMPLATES[role];
      return {
        id: `${classroomId}_${i}_${role}`,
        name: template.name,
        role,
        systemPrompt: template.systemPrompt,
        avatar: template.avatar,
        voiceId: template.voiceId,
      };
    });

    // CoPaw 技能智能体（可选）
    if (opts.withCoPawSkills && (sceneType === 'lecture' || sceneType === 'quiz')) {
      agents.push({
        id: `${classroomId}_${i}_copaw`,
        name: AGENT_TEMPLATES.copaw.name,
        role: 'copaw',
        systemPrompt: AGENT_TEMPLATES.copaw.systemPrompt,
        avatar: AGENT_TEMPLATES.copaw.avatar,
        voiceId: AGENT_TEMPLATES.copaw.voiceId,
      });
    }

    const scene: Scene = {
      id: `scene_${randomBytes(6).toString('hex')}`,
      title: sceneData.title,
      type: sceneType,
      description: sceneData.description ?? '',
      duration: sceneData.duration ?? 8,
      keyPoints: sceneData.keyPoints ?? [],
      content: scriptContent,
      agents,
      order: i,
    };

    classroom.scenes.push(scene);
  }

  // === Step 3: 生成白板内容（仅 lecture 和 quiz 场景） ===
  onProgress?.('正在生成白板内容...', 85);

  for (const scene of classroom.scenes) {
    if (scene.type === 'lecture' || scene.type === 'quiz') {
      try {
        const wbPrompt = buildWhiteboardPrompt(scene);
        const wbRaw = await llmCall(wbPrompt);
        const wbElements = parseJSON(wbRaw);
        if (Array.isArray(wbElements)) {
          scene.whiteboard = {
            elements: wbElements.map((el: WhiteboardElement, idx: number) => ({
              ...el,
              id: `wb_${idx}`,
            })),
            background: '#ffffff',
          };
        }
      } catch {
        // 白板生成失败不影响整体
      }
    }
  }

  // === Step 4: 完成 ===
  classroom.status = 'ready';
  onProgress?.('课堂生成完成！', 100);

  return classroom;
}

/**
 * 解析 JSON（从 LLM 输出中提取）
 */
function parseJSON(text: string): Record<string, unknown> | unknown[] | null {
  // 尝试直接解析
  try {
    return JSON.parse(text);
  } catch {
    // 尝试提取 JSON 块
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // continue
      }
    }

    // 尝试找到第一个 { 或 [ 开始的内容
    const start = text.search(/[{[]/);
    if (start >= 0) {
      const end = text.lastIndexOf(text[start] === '{' ? '}' : ']');
      if (end > start) {
        try {
          return JSON.parse(text.slice(start, end + 1));
        } catch {
          // give up
        }
      }
    }

    return null;
  }
}
