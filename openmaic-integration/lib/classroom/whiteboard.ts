/**
 * OpenMAIC 白板系统
 *
 * 支持：
 * - 文本、形状、线条、公式、自由绘制
 * - 按时间轴逐步展示（配合场景播放）
 * - 用户标注交互
 * - 导出为图片
 */

import type { WhiteboardData, WhiteboardElement } from './types';

export interface CanvasStyle {
  color: string;
  fontSize: number;
  fontWeight: string;
  borderColor: string;
  borderWidth: number;
  backgroundColor: string;
}

const DEFAULT_STYLE: CanvasStyle = {
  color: '#1a1a1a',
  fontSize: 18,
  fontWeight: 'normal',
  borderColor: '#3b82f6',
  borderWidth: 2,
  backgroundColor: 'transparent',
};

/**
 * 白板渲染器
 */
export class WhiteboardRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private elements: WhiteboardElement[] = [];
  private visibleElements: WhiteboardElement[] = [];
  private width = 800;
  private height = 600;
  private scale = 1;

  // 绘制状态
  private isDrawing = false;
  private drawPath: { x: number; y: number }[] = [];
  private userAnnotations: WhiteboardElement[] = [];
  private annotationColor = '#ef4444';
  private annotationWidth = 3;

  /**
   * 绑定到 Canvas 元素
   */
  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // 绑定绘制事件
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    canvas.addEventListener('touchend', this.onMouseUp.bind(this));
  }

  /**
   * 加载白板数据
   */
  loadData(data: WhiteboardData): void {
    this.elements = data.elements ?? [];
    this.visibleElements = [];
    this.render();
  }

  /**
   * 按时间展示元素（配合场景播放）
   */
  showElementsUpTo(seconds: number): void {
    this.visibleElements = this.elements.filter(
      (el) => !el.appearAt || el.appearAt <= seconds,
    );
    this.render();
  }

  /**
   * 显示所有元素
   */
  showAll(): void {
    this.visibleElements = [...this.elements];
    this.render();
  }

  /**
   * 添加用户标注
   */
  addAnnotation(element: WhiteboardElement): void {
    this.userAnnotations.push(element);
    this.render();
  }

  /**
   * 清除用户标注
   */
  clearAnnotations(): void {
    this.userAnnotations = [];
    this.render();
  }

  /**
   * 设置标注颜色
   */
  setAnnotationColor(color: string): void {
    this.annotationColor = color;
  }

  /**
   * 渲染白板
   */
  render(): void {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 清空画布
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // 绘制元素
    for (const el of this.visibleElements) {
      this.renderElement(ctx, el, w, h);
    }

    // 绘制用户标注
    for (const el of this.userAnnotations) {
      this.renderElement(ctx, el, w, h);
    }
  }

  /**
   * 渲染单个元素
   */
  private renderElement(
    ctx: CanvasRenderingContext2D,
    el: WhiteboardElement,
    canvasW: number,
    canvasH: number,
  ): void {
    const style = { ...DEFAULT_STYLE, ...(el.style as Partial<CanvasStyle>) };

    // 百分比坐标 → 像素坐标
    const x = (el.x / 100) * canvasW;
    const y = (el.y / 100) * canvasH;
    const elWidth = el.width ? (el.width / 100) * canvasW : 0;
    const elHeight = el.height ? (el.height / 100) * canvasH : 0;

    switch (el.type) {
      case 'text': {
        ctx.font = `${style.fontWeight} ${style.fontSize * this.scale}px "Microsoft YaHei", sans-serif`;
        ctx.fillStyle = style.color;
        ctx.textBaseline = 'top';

        // 自动换行
        const maxWidth = canvasW - x - 20;
        const lines = this.wrapText(ctx, el.content ?? '', maxWidth);
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], x, y + i * (style.fontSize * this.scale * 1.4));
        }
        break;
      }

      case 'shape': {
        ctx.strokeStyle = style.borderColor;
        ctx.lineWidth = style.borderWidth;

        if (style.backgroundColor !== 'transparent') {
          ctx.fillStyle = style.backgroundColor;
          ctx.fillRect(x, y, elWidth, elHeight);
        }

        ctx.strokeRect(x, y, elWidth, elHeight);

        // 形状内的文字
        if (el.content) {
          ctx.font = `${style.fontSize * this.scale}px "Microsoft YaHei", sans-serif`;
          ctx.fillStyle = style.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.content, x + elWidth / 2, y + elHeight / 2);
          ctx.textAlign = 'start';
        }
        break;
      }

      case 'line': {
        ctx.strokeStyle = style.color;
        ctx.lineWidth = style.borderWidth;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (elWidth || 200), y);
        ctx.stroke();
        break;
      }

      case 'latex': {
        // 简化处理：直接渲染为文本（生产环境可集成 KaTeX）
        ctx.font = `italic ${style.fontSize * this.scale}px "Courier New", monospace`;
        ctx.fillStyle = style.color;
        ctx.fillText(el.content ?? '', x, y);
        break;
      }

      case 'freehand': {
        // 自由绘制路径
        if (el.content) {
          try {
            const points = JSON.parse(el.content) as { x: number; y: number }[];
            if (points.length > 1) {
              ctx.strokeStyle = style.color;
              ctx.lineWidth = style.borderWidth;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.beginPath();
              ctx.moveTo((points[0].x / 100) * canvasW, (points[0].y / 100) * canvasH);
              for (let i = 1; i < points.length; i++) {
                ctx.lineTo((points[i].x / 100) * canvasW, (points[i].y / 100) * canvasH);
              }
              ctx.stroke();
            }
          } catch {
            // ignore
          }
        }
        break;
      }
    }
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';

    for (const char of words) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // ==================== 绘制事件 ====================

  private getCanvasPos(e: MouseEvent | Touch): { x: number; y: number } {
    if (!this.canvas) return { x: 0, y: 0 };
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }

  private onMouseDown(e: MouseEvent): void {
    this.isDrawing = true;
    this.drawPath = [this.getCanvasPos(e)];
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDrawing) return;
    this.drawPath.push(this.getCanvasPos(e));

    // 实时预览
    this.render();
    if (this.ctx && this.canvas && this.drawPath.length > 1) {
      this.ctx.strokeStyle = this.annotationColor;
      this.ctx.lineWidth = this.annotationWidth;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.ctx.moveTo((this.drawPath[0].x / 100) * w, (this.drawPath[0].y / 100) * h);
      for (let i = 1; i < this.drawPath.length; i++) {
        this.ctx.lineTo((this.drawPath[i].x / 100) * w, (this.drawPath[i].y / 100) * h);
      }
      this.ctx.stroke();
    }
  }

  private onMouseUp(): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.drawPath.length > 1) {
      this.userAnnotations.push({
        id: `annot_${Date.now()}`,
        type: 'freehand',
        x: 0,
        y: 0,
        content: JSON.stringify(this.drawPath),
        style: {
          color: this.annotationColor,
          borderWidth: this.annotationWidth,
        },
      });
    }

    this.drawPath = [];
    this.render();
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    this.isDrawing = true;
    this.drawPath = [this.getCanvasPos(touch)];
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.isDrawing) return;
    this.drawPath.push(this.getCanvasPos(e.touches[0]));
    this.onMouseMove(e.touches[0] as unknown as MouseEvent);
  }

  /**
   * 导出白板为图片
   */
  toDataURL(format: 'png' | 'jpeg' = 'png'): string {
    return this.canvas?.toDataURL(`image/${format}`) ?? '';
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.canvas = null;
    this.ctx = null;
  }
}
