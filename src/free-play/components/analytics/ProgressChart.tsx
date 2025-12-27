/**
 * Progress Chart Component
 *
 * Canvas-based line chart showing accuracy and WPM trends over time.
 */

import React, { useRef, useEffect } from 'react';
import type { ProgressTrend } from '../../data/models/Analytics';

export interface ProgressChartProps {
  /** Progress trend data */
  data: ProgressTrend;
}

/**
 * Format date for display.
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Draw the progress chart on canvas.
 */
function drawChart(
  ctx: CanvasRenderingContext2D,
  data: ProgressTrend,
  width: number,
  height: number
): void {
  const padding = { top: 20, right: 60, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (data.points.length === 0) {
    ctx.fillStyle = '#666';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data available', width / 2, height / 2);
    return;
  }

  // Draw background grid
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 1;

  // Horizontal grid lines
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    // Y-axis labels (accuracy %)
    ctx.fillStyle = '#888';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${100 - i * 25}%`, padding.left - 8, y + 4);
  }

  // Draw accuracy line
  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 2;
  ctx.beginPath();

  const pointCount = data.points.length;
  data.points.forEach((point, index) => {
    const x = padding.left + (chartWidth / Math.max(pointCount - 1, 1)) * index;
    const y = padding.top + chartHeight * (1 - point.accuracy);

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw accuracy points
  ctx.fillStyle = '#3498db';
  data.points.forEach((point, index) => {
    const x = padding.left + (chartWidth / Math.max(pointCount - 1, 1)) * index;
    const y = padding.top + chartHeight * (1 - point.accuracy);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw WPM line (normalized to 0-150 scale on right axis)
  const maxWpm = 150;
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 2;
  ctx.beginPath();

  data.points.forEach((point, index) => {
    const x = padding.left + (chartWidth / Math.max(pointCount - 1, 1)) * index;
    const normalizedWpm = Math.min(point.wpm / maxWpm, 1);
    const y = padding.top + chartHeight * (1 - normalizedWpm);

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw WPM points
  ctx.fillStyle = '#2ecc71';
  data.points.forEach((point, index) => {
    const x = padding.left + (chartWidth / Math.max(pointCount - 1, 1)) * index;
    const normalizedWpm = Math.min(point.wpm / maxWpm, 1);
    const y = padding.top + chartHeight * (1 - normalizedWpm);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw right Y-axis labels (WPM)
  ctx.fillStyle = '#888';
  ctx.textAlign = 'left';
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    const wpm = maxWpm - (maxWpm / 4) * i;
    ctx.fillText(`${wpm}`, width - padding.right + 8, y + 4);
  }

  // Draw X-axis labels (dates)
  ctx.fillStyle = '#888';
  ctx.textAlign = 'center';
  const labelInterval = Math.ceil(pointCount / 7);

  data.points.forEach((point, index) => {
    if (index % labelInterval === 0 || index === pointCount - 1) {
      const x = padding.left + (chartWidth / Math.max(pointCount - 1, 1)) * index;
      ctx.fillText(formatDate(point.date), x, height - 10);
    }
  });

  // Draw axis labels
  ctx.save();
  ctx.translate(12, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#3498db';
  ctx.textAlign = 'center';
  ctx.fillText('Accuracy', 0, 0);
  ctx.restore();

  ctx.save();
  ctx.translate(width - 12, height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = '#2ecc71';
  ctx.textAlign = 'center';
  ctx.fillText('WPM', 0, 0);
  ctx.restore();
}

/**
 * Progress chart component.
 */
export function ProgressChart({ data }: ProgressChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    drawChart(ctx, data, rect.width, rect.height);
  }, [data]);

  return (
    <div className="progress-chart">
      <canvas ref={canvasRef} />
      <div className="chart-legend">
        <div className="legend-item">
          <span className="color-dot accuracy" />
          <span>Accuracy</span>
        </div>
        <div className="legend-item">
          <span className="color-dot wpm" />
          <span>WPM</span>
        </div>
      </div>
    </div>
  );
}

export default ProgressChart;
