/**
 * 数据库种子脚本
 * 创建管理员用户和测试数据
 *
 * 运行: npx tsx scripts/seed.ts
 */
import { PrismaClient } from '../lib/generated/prisma';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. 创建管理员用户
  const admin = await prisma.user.upsert({
    where: { email: 'admin@copaw.edu' },
    update: {},
    create: {
      email: 'admin@copaw.edu',
      name: '管理员',
      passwordHash: hashSync('admin123', 10),
      role: 'ADMIN',
      credits: 99999,
    },
  });
  console.log(`Admin user: ${admin.email} (id: ${admin.id})`);

  // 记录管理员积分
  await prisma.creditHistory.upsert({
    where: { id: 'seed-admin-grant' },
    update: {},
    create: {
      id: 'seed-admin-grant',
      userId: admin.id,
      amount: 99999,
      balance: 99999,
      type: 'INITIAL_GRANT',
      description: '管理员账户初始积分',
    },
  });

  // 2. 创建测试学生用户
  const student = await prisma.user.upsert({
    where: { email: 'student@test.com' },
    update: {},
    create: {
      email: 'student@test.com',
      name: '测试学生',
      passwordHash: hashSync('test123', 10),
      role: 'FREE',
      credits: 200,
    },
  });
  console.log(`Student user: ${student.email} (id: ${student.id})`);

  await prisma.creditHistory.upsert({
    where: { id: 'seed-student-grant' },
    update: {},
    create: {
      id: 'seed-student-grant',
      userId: student.id,
      amount: 200,
      balance: 200,
      type: 'INITIAL_GRANT',
      description: '新用户注册赠送',
    },
  });

  // 3. 创建测试教师用户（带订阅）
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    update: {},
    create: {
      email: 'teacher@test.com',
      name: '测试教师',
      passwordHash: hashSync('test123', 10),
      role: 'TEACHER',
      credits: 3000,
    },
  });
  console.log(`Teacher user: ${teacher.email} (id: ${teacher.id})`);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  await prisma.subscription.upsert({
    where: { userId: teacher.id },
    update: {},
    create: {
      userId: teacher.id,
      plan: 'TEACHER',
      period: 'MONTHLY',
      status: 'ACTIVE',
      monthlyCredits: 3000,
      bonusCredits: 0,
      startDate,
      endDate,
    },
  });

  await prisma.creditHistory.upsert({
    where: { id: 'seed-teacher-grant' },
    update: {},
    create: {
      id: 'seed-teacher-grant',
      userId: teacher.id,
      amount: 3000,
      balance: 3000,
      type: 'SUBSCRIPTION',
      description: '教师版订阅 - 首月积分',
    },
  });

  console.log('\nSeed complete!');
  console.log('\nTest accounts:');
  console.log('  Admin:   admin@copaw.edu / admin123');
  console.log('  Student: student@test.com / test123');
  console.log('  Teacher: teacher@test.com / test123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
