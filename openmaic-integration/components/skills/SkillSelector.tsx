'use client';

import { useState, useEffect } from 'react';
import {
  Brain,
  BookOpen,
  AlertCircle,
  Target,
  Image,
  Sparkles,
  BarChart3,
  Bell,
  Search,
  Clock,
  FileText,
  ClipboardList,
  Users,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';

interface SkillSummary {
  id: string;
  displayName: string;
  description: string;
  role: 'student' | 'parent' | 'teacher';
  tags: string[];
  icon: string;
}

interface SkillSelectorProps {
  onSelect: (skillId: string) => void;
  selectedSkillId?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Brain: <Brain className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
  AlertCircle: <AlertCircle className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
  Image: <Image className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  Bell: <Bell className="h-5 w-5" />,
  Search: <Search className="h-5 w-5" />,
  Clock: <Clock className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  ClipboardList: <ClipboardList className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  CheckCircle: <CheckCircle className="h-5 w-5" />,
  MessageSquare: <MessageSquare className="h-5 w-5" />,
};

const ROLE_LABELS = {
  student: { label: '学生技能', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  parent: { label: '家长技能', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  teacher: { label: '教师技能', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
};

export function SkillSelector({ onSelect, selectedSkillId }: SkillSelectorProps) {
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [activeRole, setActiveRole] = useState<'student' | 'parent' | 'teacher' | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/skills')
      .then((r) => r.json())
      .then((data) => { setSkills(data.skills ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeRole === 'all' ? skills : skills.filter((s) => s.role === activeRole);

  return (
    <div className="space-y-4">
      {/* Role Filter */}
      <div className="flex gap-2">
        {(['all', 'student', 'parent', 'teacher'] as const).map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeRole === role
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {role === 'all' ? '全部' : ROLE_LABELS[role].label}
            {role !== 'all' && ` (${skills.filter((s) => s.role === role).length})`}
          </button>
        ))}
      </div>

      {/* Skill Grid */}
      {loading ? (
        <div className="text-muted-foreground py-6 text-center text-sm">加载技能...</div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((skill) => (
            <button
              key={skill.id}
              onClick={() => onSelect(skill.id)}
              className={`group flex items-start gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-sm ${
                selectedSkillId === skill.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className={`mt-0.5 rounded-lg p-1.5 ${ROLE_LABELS[skill.role].color}`}>
                {ICON_MAP[skill.icon] ?? <Sparkles className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{skill.displayName}</span>
                  {selectedSkillId === skill.id && (
                    <CheckCircle className="text-primary h-3.5 w-3.5" />
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                  {skill.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
