/**
 * Calendar Heatmap Component
 *
 * GitHub-style activity calendar showing practice history.
 */

import React, { useMemo } from 'react';
import type { IAnalyticsService } from '../../services/AnalyticsService';
import type { DailyStats } from '@/data/models/Analytics';

export interface CalendarHeatmapProps {
  /** Analytics service for fetching data */
  analyticsService: IAnalyticsService;
  /** Number of months to display */
  months: number;
}

/**
 * Generate date range from start to end.
 */
function generateDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Get month labels for the calendar.
 */
function getMonthLabels(
  start: Date,
  end: Date
): Array<{ month: string; column: number }> {
  const labels: Array<{ month: string; column: number }> = [];
  const current = new Date(start);
  let weekColumn = 0;
  let lastMonth = -1;

  while (current <= end) {
    const month = current.getMonth();
    if (month !== lastMonth) {
      labels.push({
        month: current.toLocaleDateString('en-US', { month: 'short' }),
        column: weekColumn + 1,
      });
      lastMonth = month;
    }

    // Move to next week
    current.setDate(current.getDate() + 7);
    weekColumn++;
  }

  return labels;
}

/**
 * Get intensity level (0-4) based on practice time.
 */
function getIntensityLevel(stats: DailyStats | null): number {
  if (!stats || stats.totalPracticeTimeMs === 0) return 0;

  const minutes = stats.totalPracticeTimeMs / 60000;

  if (minutes >= 30) return 4;
  if (minutes >= 15) return 3;
  if (minutes >= 5) return 2;
  return 1;
}

/**
 * Calendar heatmap component.
 */
export function CalendarHeatmap({
  analyticsService,
  months,
}: CalendarHeatmapProps) {
  // Calculate date range
  const { startDate, endDate, days, dailyStats } = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setMonth(start.getMonth() - months);
    // Align to start of week (Sunday)
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);

    const allDays = generateDateRange(start, end);

    // Collect stats for each day
    const stats = new Map<string, DailyStats>();
    for (const day of allDays) {
      const dayStats = analyticsService.getDailyStats(day);
      const dateStr = day.toISOString().split('T')[0];
      stats.set(dateStr, dayStats);
    }

    return {
      startDate: start,
      endDate: end,
      days: allDays,
      dailyStats: stats,
    };
  }, [analyticsService, months]);

  const monthLabels = useMemo(
    () => getMonthLabels(startDate, endDate),
    [startDate, endDate]
  );

  // Group days by week
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    let currentWeek: Date[] = [];

    for (const day of days) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add remaining days
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [days]);

  return (
    <div className="calendar-heatmap">
      <div className="month-labels">
        {monthLabels.map((label, i) => (
          <span
            key={i}
            className="month-label"
            style={{ gridColumn: label.column }}
          >
            {label.month}
          </span>
        ))}
      </div>

      <div className="calendar-body">
        <div className="day-labels">
          <span></span>
          <span>Mon</span>
          <span></span>
          <span>Wed</span>
          <span></span>
          <span>Fri</span>
          <span></span>
        </div>

        <div className="calendar-grid">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="calendar-week">
              {week.map((day, dayIndex) => {
                const dateStr = day.toISOString().split('T')[0];
                const stats = dailyStats.get(dateStr) ?? null;
                const intensity = getIntensityLevel(stats);
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                const tooltip = stats && stats.totalPracticeTimeMs > 0
                  ? `${dateStr}: ${Math.round(stats.totalPracticeTimeMs / 60000)} min, ${stats.itemsPracticed} items, ${Math.round((stats.correctCount / Math.max(stats.correctCount + stats.incorrectCount, 1)) * 100)}% accuracy`
                  : `${dateStr}: No practice`;

                return (
                  <div
                    key={dayIndex}
                    className={`day-cell intensity-${intensity} ${isToday ? 'today' : ''}`}
                    title={tooltip}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <div className="day-cell intensity-0" title="No practice" />
        <div className="day-cell intensity-1" title="< 5 minutes" />
        <div className="day-cell intensity-2" title="5-15 minutes" />
        <div className="day-cell intensity-3" title="15-30 minutes" />
        <div className="day-cell intensity-4" title="30+ minutes" />
        <span>More</span>
      </div>
    </div>
  );
}

export default CalendarHeatmap;
