'use client';

import Link from 'next/link';

const modules = [
  {
    title: '智能课堂',
    href: '/classroom',
    desc: 'AI 驱动的互动课堂，智能生成课件与练习',
    icon: '📚',
    color: '#4F46E5',
  },
  {
    title: 'CoPaw 教学',
    href: '/copaw',
    desc: '15项学习技能，涵盖听说读写全方位训练',
    icon: '🐾',
    color: '#7C3AED',
  },
  {
    title: '管理后台',
    href: '/admin',
    desc: '模型管理、API 配置、用户管理',
    icon: '⚙️',
    color: '#059669',
  },
  {
    title: '用户中心',
    href: '/account',
    desc: '账户信息、积分余额、订阅管理',
    icon: '👤',
    color: '#D97706',
  },
  {
    title: '订阅套餐',
    href: '/pricing',
    desc: '查看套餐方案，升级订阅计划',
    icon: '💎',
    color: '#DC2626',
  },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <header style={{ padding: '60px 20px 20px', textAlign: 'center', color: '#fff' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800 }}>
          🐾 CoPaw-Edu × OpenMAIC
        </h1>
        <p style={{ fontSize: '1.2rem', marginTop: 12, opacity: 0.9 }}>
          智能教育平台 — AI 赋能个性化学习
        </p>
      </header>

      {/* Module Cards */}
      <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            style={{
              textDecoration: 'none',
              background: '#fff',
              borderRadius: 16,
              padding: '32px 24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'block',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{m.icon}</div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: m.color, fontWeight: 700 }}>
              {m.title}
            </h2>
            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '0.95rem', lineHeight: 1.5 }}>
              {m.desc}
            </p>
          </Link>
        ))}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
        CoPaw-Edu × OpenMAIC 智能教育平台
      </footer>
    </div>
  );
}
