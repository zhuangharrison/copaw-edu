/**
 * 集成测试脚本
 * 验证所有模块是否正确导入和工作
 *
 * 运行: npx tsx scripts/test-integration.ts
 */

async function main() {
  console.log('=== CoPaw-Edu × OpenMAIC Integration Test ===\n');

  let passed = 0;
  let failed = 0;

  function check(name: string, fn: () => Promise<boolean> | boolean) {
    return (async () => {
      try {
        const result = await fn();
        if (result) {
          console.log(`  ✓ ${name}`);
          passed++;
        } else {
          console.log(`  ✗ ${name} (returned false)`);
          failed++;
        }
      } catch (err) {
        console.log(`  ✗ ${name}: ${err}`);
        failed++;
      }
    })();
  }

  // === 1. Skill Registry ===
  console.log('\n[Skills]');
  await check('Import skill registry', async () => {
    const { skillRegistry } = await import('../lib/skills/copaw/registry');
    return !!skillRegistry;
  });

  await check('Load all 15 skills', async () => {
    const { skillRegistry } = await import('../lib/skills/copaw/registry');
    const all = skillRegistry.getAllSkills();
    console.log(`    Found ${all.length} skills`);
    return all.length === 15;
  });

  await check('Filter student skills (6)', async () => {
    const { skillRegistry } = await import('../lib/skills/copaw/registry');
    return skillRegistry.getSkillsByRole('student').length === 6;
  });

  await check('Filter parent skills (4)', async () => {
    const { skillRegistry } = await import('../lib/skills/copaw/registry');
    return skillRegistry.getSkillsByRole('parent').length === 4;
  });

  await check('Filter teacher skills (5)', async () => {
    const { skillRegistry } = await import('../lib/skills/copaw/registry');
    return skillRegistry.getSkillsByRole('teacher').length === 5;
  });

  // === 2. Credit System ===
  console.log('\n[Credits]');
  await check('Import credit functions', async () => {
    const { getCost, checkCredits, deductCredits, addCredits } = await import('../lib/server/credits');
    return !!(getCost && checkCredits && deductCredits && addCredits);
  });

  await check('Cost calculation', async () => {
    const { getCost } = await import('../lib/server/credits');
    return getCost('classroom_basic') === 50 && getCost('chat_round', 5) === 10;
  });

  // === 3. Subscription Plans ===
  console.log('\n[Subscription]');
  await check('Import plans', async () => {
    const { PLANS, CREDIT_PACKS } = await import('../lib/server/subscription/plans');
    return PLANS.length === 3 && CREDIT_PACKS.length === 3;
  });

  await check('Plan pricing correct', async () => {
    const { PLANS } = await import('../lib/server/subscription/plans');
    const student = PLANS.find(p => p.id === 'STUDENT');
    return student?.monthlyPrice === 2900 && student?.yearlyPrice === 27800;
  });

  // === 4. Encryption ===
  console.log('\n[Encryption]');
  await check('Encrypt/decrypt roundtrip', async () => {
    const { encrypt, decrypt } = await import('../lib/server/admin/encryption');
    const original = 'sk-test-api-key-12345';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    return decrypted === original && encrypted !== original;
  });

  // === 5. Middleware ===
  console.log('\n[Middleware]');
  await check('Import credits middleware', async () => {
    const { withCredits, requireCredits } = await import('../lib/middleware/credits');
    return !!(withCredits && requireCredits);
  });

  // === 6. Renewal Logic ===
  console.log('\n[Renewal]');
  await check('Import renewal functions', async () => {
    const { processSubscriptionRenewals, checkUserSubscription } = await import('../lib/server/subscription/renewal');
    return !!(processSubscriptionRenewals && checkUserSubscription);
  });

  // === Summary ===
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(40)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
