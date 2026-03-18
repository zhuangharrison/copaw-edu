'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Users, BookOpen, ArrowRight } from 'lucide-react';

type CoPawRole = 'student' | 'parent' | 'teacher';

const GRADE_LEVELS = ['小学', '初中', '高中', '大学'];

const GRADES: Record<string, string[]> = {
  '小学': ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
  '初中': ['初一', '初二', '初三'],
  '高中': ['高一', '高二', '高三'],
  '大学': ['大一', '大二', '大三', '大四'],
};

const SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];

const ROLES: { id: CoPawRole; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'student', label: '学生', icon: <GraduationCap className="h-6 w-6" />, description: '我是学生，需要学习帮助' },
  { id: 'parent', label: '家长', icon: <Users className="h-6 w-6" />, description: '我是家长，关注孩子学习' },
  { id: 'teacher', label: '教师', icon: <BookOpen className="h-6 w-6" />, description: '我是教师，需要教学工具' },
];

export default function CoPawSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    role: 'student' as CoPawRole,
    name: '',
    gradeLevel: '初中',
    grade: '初二',
    subjects: ['语文', '数学', '英语'] as string[],
    childName: '',
    school: '',
    className: '',
  });

  const handleComplete = () => {
    // 保存到 localStorage
    localStorage.setItem('copaw-profile', JSON.stringify(profile));
    router.push('/copaw');
  };

  const toggleSubject = (subject: string) => {
    setProfile((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-12 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Role Selection */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">欢迎使用 CoPaw-Edu</h1>
              <p className="text-muted-foreground mt-2">请选择你的角色</p>
            </div>

            <div className="space-y-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setProfile((prev) => ({ ...prev, role: r.id }));
                    setStep(1);
                  }}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all hover:shadow-sm ${
                    profile.role === r.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="bg-primary/10 text-primary rounded-xl p-3">{r.icon}</div>
                  <div>
                    <div className="font-semibold">{r.label}</div>
                    <div className="text-muted-foreground text-sm">{r.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">基本信息</h1>
              <p className="text-muted-foreground mt-2">让我更好地了解你</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-muted-foreground mb-1 block text-sm">
                  {profile.role === 'student' ? '你的名字' : profile.role === 'parent' ? '您的称呼' : '老师称呼'}
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={profile.role === 'student' ? '小明' : profile.role === 'parent' ? '家长' : '王老师'}
                  className="border-input bg-background w-full rounded-xl border px-4 py-3 text-sm"
                />
              </div>

              {profile.role === 'parent' && (
                <div>
                  <label className="text-muted-foreground mb-1 block text-sm">孩子姓名</label>
                  <input
                    type="text"
                    value={profile.childName}
                    onChange={(e) => setProfile((prev) => ({ ...prev, childName: e.target.value }))}
                    placeholder="小明"
                    className="border-input bg-background w-full rounded-xl border px-4 py-3 text-sm"
                  />
                </div>
              )}

              {profile.role === 'teacher' && (
                <>
                  <div>
                    <label className="text-muted-foreground mb-1 block text-sm">学校</label>
                    <input
                      type="text"
                      value={profile.school}
                      onChange={(e) => setProfile((prev) => ({ ...prev, school: e.target.value }))}
                      placeholder="XX中学"
                      className="border-input bg-background w-full rounded-xl border px-4 py-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground mb-1 block text-sm">班级</label>
                    <input
                      type="text"
                      value={profile.className}
                      onChange={(e) => setProfile((prev) => ({ ...prev, className: e.target.value }))}
                      placeholder="初二(3)班"
                      className="border-input bg-background w-full rounded-xl border px-4 py-3 text-sm"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-muted-foreground mb-1 block text-sm">学段</label>
                <div className="flex gap-2">
                  {GRADE_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        setProfile((prev) => ({
                          ...prev,
                          gradeLevel: level,
                          grade: GRADES[level][0],
                        }));
                      }}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                        profile.gradeLevel === level
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-1 block text-sm">年级</label>
                <div className="flex flex-wrap gap-2">
                  {GRADES[profile.gradeLevel]?.map((grade) => (
                    <button
                      key={grade}
                      onClick={() => setProfile((prev) => ({ ...prev, grade }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        profile.grade === grade
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="text-muted-foreground hover:text-foreground flex-1 rounded-xl py-3 text-sm"
              >
                上一步
              </button>
              <button
                onClick={() => setStep(2)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-medium"
              >
                下一步 <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Subjects */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">关注学科</h1>
              <p className="text-muted-foreground mt-2">选择你关注的学科（可多选）</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((subject) => (
                <button
                  key={subject}
                  onClick={() => toggleSubject(subject)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                    profile.subjects.includes(subject)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="text-muted-foreground hover:text-foreground flex-1 rounded-xl py-3 text-sm"
              >
                上一步
              </button>
              <button
                onClick={handleComplete}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-medium"
              >
                开始使用 <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
