/**
 * OpenMAIC 课堂导出系统
 *
 * 支持导出为：
 * - PPTX 演示文稿
 * - PDF 文档
 * - Markdown 笔记
 */

import type { Classroom, Scene, SceneType } from './types';

// ==================== Markdown 导出 ====================

/**
 * 导出课堂为 Markdown
 */
export function exportToMarkdown(classroom: Classroom): string {
  let md = '';

  md += `# ${classroom.title}\n\n`;
  md += `**学科**：${classroom.subject} | **年级**：${classroom.gradeLevel} ${classroom.grade}\n\n`;

  if (classroom.objectives.length > 0) {
    md += `## 学习目标\n\n`;
    for (const obj of classroom.objectives) {
      md += `- ${obj}\n`;
    }
    md += '\n';
  }

  if (classroom.outline) {
    md += `## 课程概述\n\n${classroom.outline}\n\n`;
  }

  md += `---\n\n`;

  for (const scene of classroom.scenes) {
    const typeLabels: Record<SceneType, string> = {
      lecture: '📖 讲授',
      discussion: '💬 讨论',
      quiz: '❓ 测验',
      activity: '🎯 活动',
    };

    md += `## 场景 ${scene.order + 1}：${scene.title}\n\n`;
    md += `**类型**：${typeLabels[scene.type]} | **时长**：${scene.duration}分钟\n\n`;

    if (scene.keyPoints.length > 0) {
      md += `**知识点**：${scene.keyPoints.join('、')}\n\n`;
    }

    md += scene.content + '\n\n';
    md += `---\n\n`;
  }

  md += `> 由 CoPaw-Edu × OpenMAIC 生成\n`;

  return md;
}

// ==================== PPTX 导出 ====================

/**
 * PPTX Slide 数据结构（用于前端传递给 pptxgenjs）
 */
export interface PPTXSlide {
  title: string;
  subtitle?: string;
  content: string[];
  notes?: string;
  layout: 'title' | 'content' | 'two_column' | 'blank';
  backgroundColor?: string;
}

/**
 * 将课堂转为 PPTX slides 数据
 */
export function classroomToSlides(classroom: Classroom): PPTXSlide[] {
  const slides: PPTXSlide[] = [];

  // 封面
  slides.push({
    title: classroom.title,
    subtitle: `${classroom.subject} · ${classroom.gradeLevel}${classroom.grade}`,
    content: [],
    layout: 'title',
  });

  // 学习目标
  if (classroom.objectives.length > 0) {
    slides.push({
      title: '学习目标',
      content: classroom.objectives,
      layout: 'content',
    });
  }

  // 场景页
  for (const scene of classroom.scenes) {
    // 场景标题页
    const typeLabels: Record<SceneType, string> = {
      lecture: '📖 讲授',
      discussion: '💬 讨论',
      quiz: '❓ 测验',
      activity: '🎯 活动',
    };

    slides.push({
      title: scene.title,
      subtitle: `${typeLabels[scene.type]} · ${scene.duration}分钟`,
      content: scene.keyPoints,
      notes: scene.description,
      layout: 'content',
    });

    // 内容页（将脚本拆分为多页）
    const contentLines = scene.content.split('\n').filter((l) => l.trim());
    const chunked = chunkArray(contentLines, 6);

    for (const chunk of chunked) {
      slides.push({
        title: scene.title,
        content: chunk,
        layout: 'content',
      });
    }
  }

  // 结束页
  slides.push({
    title: '感谢学习！',
    subtitle: 'CoPaw-Edu × OpenMAIC',
    content: [],
    layout: 'title',
  });

  return slides;
}

/**
 * 在浏览器中生成并下载 PPTX
 * 需要动态加载 pptxgenjs
 */
export async function downloadPPTX(classroom: Classroom): Promise<void> {
  const slides = classroomToSlides(classroom);

  // 动态加载 pptxgenjs
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();

  pptx.author = 'CoPaw-Edu × OpenMAIC';
  pptx.title = classroom.title;
  pptx.subject = classroom.subject;

  for (const slideData of slides) {
    const slide = pptx.addSlide();

    if (slideData.layout === 'title') {
      // 标题页
      slide.addText(slideData.title, {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 1.5,
        fontSize: 36,
        bold: true,
        align: 'center',
        color: '1a1a1a',
      });

      if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
          x: 0.5,
          y: 3.2,
          w: 9,
          h: 0.8,
          fontSize: 18,
          align: 'center',
          color: '666666',
        });
      }
    } else {
      // 内容页
      slide.addText(slideData.title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.6,
        fontSize: 24,
        bold: true,
        color: '1a1a1a',
      });

      if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
          x: 0.5,
          y: 0.9,
          w: 9,
          h: 0.4,
          fontSize: 14,
          color: '999999',
        });
      }

      if (slideData.content.length > 0) {
        const bulletText = slideData.content.map((line) => ({
          text: line,
          options: { fontSize: 16, bullet: true as const, color: '333333' },
        }));

        slide.addText(bulletText, {
          x: 0.5,
          y: slideData.subtitle ? 1.5 : 1.2,
          w: 9,
          h: 4,
          valign: 'top',
        });
      }
    }

    if (slideData.notes) {
      slide.addNotes(slideData.notes);
    }
  }

  await pptx.writeFile({ fileName: `${classroom.title}.pptx` });
}

// ==================== PDF 导出 ====================

/**
 * 导出为 PDF（通过打印方式）
 */
export function exportToPDF(classroom: Classroom): void {
  const md = exportToMarkdown(classroom);

  // 创建打印窗口
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${classroom.title}</title>
      <style>
        body {
          font-family: "Microsoft YaHei", sans-serif;
          max-width: 800px;
          margin: 40px auto;
          padding: 0 20px;
          line-height: 1.8;
          color: #1a1a1a;
        }
        h1 { font-size: 28px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
        h2 { font-size: 22px; color: #3b82f6; margin-top: 24px; }
        hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
        blockquote { color: #6b7280; font-style: italic; border-left: 3px solid #d1d5db; padding-left: 12px; }
        ul { padding-left: 20px; }
        @media print { body { margin: 20px; } }
      </style>
    </head>
    <body>
      ${markdownToHTML(md)}
    </body>
    </html>
  `);

  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
}

// ==================== 辅助函数 ====================

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function markdownToHTML(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n/g, '<br>');
}
