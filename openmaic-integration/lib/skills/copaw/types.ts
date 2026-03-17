export type SkillRole = 'student' | 'parent' | 'teacher';

export interface CoPawSkill {
  id: string;
  name: string;
  displayName: string;
  description: string;
  role: SkillRole;
  version: string;
  tags: string[];
  systemPrompt: string;
  triggerKeywords: string[];
  /** 图标 (lucide icon name) */
  icon: string;
}
