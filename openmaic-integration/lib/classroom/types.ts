/**
 * OpenMAIC 课堂场景类型定义
 *
 * 4种场景类型：
 * 1. lecture   - 讲授型：AI教师讲解知识点
 * 2. discussion - 讨论型：多智能体角色讨论
 * 3. quiz      - 测验型：互动问答练习
 * 4. activity  - 活动型：实践/实验/创作
 */

export type SceneType = 'lecture' | 'discussion' | 'quiz' | 'activity';

export interface Scene {
  id: string;
  title: string;
  type: SceneType;
  /** 场景描述/大纲 */
  description: string;
  /** 场景时长（分钟） */
  duration: number;
  /** 知识点列表 */
  keyPoints: string[];
  /** 场景内容（AI生成的完整脚本） */
  content: string;
  /** 智能体角色分配 */
  agents: SceneAgent[];
  /** 白板内容（可选） */
  whiteboard?: WhiteboardData;
  /** 媒体资源 */
  media?: SceneMedia[];
  /** 排序 */
  order: number;
}

export interface SceneAgent {
  id: string;
  name: string;
  role: AgentRole;
  /** 该场景中的系统提示 */
  systemPrompt: string;
  /** 头像 */
  avatar?: string;
  /** 语音ID */
  voiceId?: string;
}

export type AgentRole =
  | 'teacher'      // 教师/讲师
  | 'student_a'    // 学生A（好问）
  | 'student_b'    // 学生B（质疑）
  | 'moderator'    // 主持人/引导者
  | 'expert'       // 专家嘉宾
  | 'copaw';       // CoPaw 技能智能体

export interface WhiteboardData {
  /** 白板元素 */
  elements: WhiteboardElement[];
  /** 背景色 */
  background?: string;
}

export interface WhiteboardElement {
  id: string;
  type: 'text' | 'shape' | 'line' | 'image' | 'latex' | 'freehand';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  style?: Record<string, string | number>;
  /** 出现时机（秒） */
  appearAt?: number;
}

export interface SceneMedia {
  type: 'image' | 'video' | 'audio';
  url: string;
  caption?: string;
}

export interface Classroom {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  grade: string;
  /** 课程大纲 */
  outline: string;
  /** 学习目标 */
  objectives: string[];
  /** 场景列表 */
  scenes: Scene[];
  /** 生成状态 */
  status: 'generating' | 'ready' | 'playing' | 'completed';
  /** 创建时间 */
  createdAt: string;
  /** CoPaw 技能关联 */
  copawSkillIds?: string[];
}

export interface GenerateClassroomOptions {
  /** 课程主题 */
  topic: string;
  /** 学科 */
  subject: string;
  /** 学段 */
  gradeLevel: string;
  /** 年级 */
  grade: string;
  /** 场景数量 */
  sceneCount: number;
  /** 场景类型偏好 */
  sceneTypes?: SceneType[];
  /** 总时长（分钟） */
  totalDuration?: number;
  /** 是否关联 CoPaw 技能 */
  withCoPawSkills?: boolean;
  /** 补充说明 */
  additionalNotes?: string;
}

// ==================== 场景类型配置 ====================

export const SCENE_TYPE_CONFIG: Record<SceneType, {
  label: string;
  description: string;
  icon: string;
  defaultDuration: number;
  agentRoles: AgentRole[];
}> = {
  lecture: {
    label: '讲授',
    description: '教师讲解知识点，配合白板演示',
    icon: 'BookOpen',
    defaultDuration: 8,
    agentRoles: ['teacher'],
  },
  discussion: {
    label: '讨论',
    description: '多角色互动讨论，深化理解',
    icon: 'MessageSquare',
    defaultDuration: 10,
    agentRoles: ['teacher', 'student_a', 'student_b'],
  },
  quiz: {
    label: '测验',
    description: '互动问答，检验学习效果',
    icon: 'HelpCircle',
    defaultDuration: 6,
    agentRoles: ['teacher', 'student_a'],
  },
  activity: {
    label: '活动',
    description: '实践操作、实验演示、创作任务',
    icon: 'Lightbulb',
    defaultDuration: 12,
    agentRoles: ['teacher', 'moderator'],
  },
};

export const ALL_SCENE_TYPES: SceneType[] = ['lecture', 'discussion', 'quiz', 'activity'];
