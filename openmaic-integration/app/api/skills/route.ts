import { NextResponse } from 'next/server';
import { getSkillSummaries, getSkillsByRole } from '@/lib/skills/copaw/registry';
import type { SkillRole } from '@/lib/skills/copaw/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') as SkillRole | null;

  if (role) {
    const skills = await getSkillsByRole(role);
    return NextResponse.json({
      skills: skills.map(({ id, displayName, description, role, tags, icon }) => ({
        id, displayName, description, role, tags, icon,
      })),
    });
  }

  const summaries = await getSkillSummaries();
  return NextResponse.json({ skills: summaries });
}
