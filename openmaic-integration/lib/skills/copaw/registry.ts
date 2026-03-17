/**
 * CoPaw 技能注册表
 * 懒加载所有 15 个技能，提供查询和过滤接口
 */

import type { CoPawSkill, SkillRole } from './types';

let _skills: CoPawSkill[] | null = null;

async function loadAllSkills(): Promise<CoPawSkill[]> {
  const modules = await Promise.all([
    // Student skills (6)
    import('./student/memory-system'),
    import('./student/concept-master'),
    import('./student/mistake-master'),
    import('./student/exam-prep'),
    import('./student/multimodal-gen'),
    import('./student/ai-study-prompts'),
    // Parent skills (4)
    import('./parent/progress-report'),
    import('./parent/daily-briefing'),
    import('./parent/resource-finder'),
    import('./parent/schedule-reminder'),
    // Teacher skills (5)
    import('./teacher/lesson-plan'),
    import('./teacher/quiz-creator'),
    import('./teacher/student-analyzer'),
    import('./teacher/grading-helper'),
    import('./teacher/parent-comm'),
  ]);

  return modules.map((m) => m.default);
}

/**
 * 获取所有已注册的 CoPaw 技能
 */
export async function getAllSkills(): Promise<CoPawSkill[]> {
  if (!_skills) {
    _skills = await loadAllSkills();
  }
  return _skills;
}

/**
 * 按角色过滤技能
 */
export async function getSkillsByRole(role: SkillRole): Promise<CoPawSkill[]> {
  const all = await getAllSkills();
  return all.filter((s) => s.role === role);
}

/**
 * 根据 ID 获取技能
 */
export async function getSkillById(id: string): Promise<CoPawSkill | undefined> {
  const all = await getAllSkills();
  return all.find((s) => s.id === id);
}

/**
 * 根据用户消息内容，自动检测匹配的技能
 */
export async function detectSkill(message: string): Promise<CoPawSkill | undefined> {
  const all = await getAllSkills();
  const lowerMsg = message.toLowerCase();

  for (const skill of all) {
    for (const keyword of skill.triggerKeywords) {
      if (lowerMsg.includes(keyword.toLowerCase())) {
        return skill;
      }
    }
  }

  return undefined;
}

/**
 * 获取技能的摘要列表（不含 systemPrompt，用于前端展示）
 */
export async function getSkillSummaries() {
  const all = await getAllSkills();
  return all.map(({ id, displayName, description, role, tags, icon }) => ({
    id,
    displayName,
    description,
    role,
    tags,
    icon,
  }));
}
