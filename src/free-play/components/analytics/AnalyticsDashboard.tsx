/**
 * Analytics Dashboard Component
 *
 * Main dashboard displaying learning progress, skill breakdowns,
 * trouble areas, and actionable insights.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ProgressChart } from './ProgressChart';
import { FingerHeatmap } from './FingerHeatmap';
import { TroubleItemsList } from './TroubleItemsList';
import { CalendarHeatmap } from './CalendarHeatmap';
import { InsightsList } from './InsightsList';
import { OverviewCard } from './OverviewCard';
import type { IAnalyticsService } from '../../services/AnalyticsService';
import './analytics.css';

/**
 * Download JSON data as a file.
 */
function downloadJson(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface AnalyticsDashboardProps {
  /** Analytics service instance */
  analyticsService: IAnalyticsService;
  /** Optional callback for navigation */
  onNavigate?: (path: string) => void;
}

type TimeRange = 'week' | 'month' | 'all';

/**
 * Format milliseconds to readable time.
 */
function formatPracticeTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Main analytics dashboard component.
 */
export function AnalyticsDashboard({
  analyticsService,
  onNavigate,
}: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;

  const skillAnalytics = useMemo(
    () => analyticsService.getSkillAnalytics(),
    [analyticsService]
  );

  const progressTrend = useMemo(
    () => analyticsService.getProgressTrend(days),
    [analyticsService, days]
  );

  const wpmTrend = useMemo(
    () => analyticsService.getWpmTrend(days),
    [analyticsService, days]
  );

  const troubleItems = useMemo(
    () => analyticsService.getTroubleItems(5),
    [analyticsService]
  );

  const insights = useMemo(
    () => analyticsService.generateInsights(),
    [analyticsService]
  );

  const recommendations = useMemo(
    () => analyticsService.getRecommendations(),
    [analyticsService]
  );

  const fingerHeatmap = useMemo(
    () => analyticsService.getFingerHeatmap(),
    [analyticsService]
  );

  const weeklyStats = useMemo(
    () => analyticsService.getWeeklyStats(new Date()),
    [analyticsService]
  );

  const masteredFingers = useMemo(
    () => analyticsService.getMasteredItems('finger').length,
    [analyticsService]
  );

  const masteredWords = useMemo(
    () => analyticsService.getMasteredItems('word').length,
    [analyticsService]
  );

  // Calculate WPM trend direction
  const wpmTrendDirection = wpmTrend.changePercent > 0 ? 'up' : wpmTrend.changePercent < 0 ? 'down' : 'neutral';

  // Export analytics data
  const handleExport = useCallback(() => {
    const data = analyticsService.exportAnalytics();
    const date = new Date().toISOString().split('T')[0];
    downloadJson(data, `charachorder-analytics-${date}.json`);
  }, [analyticsService]);

  return (
    <div className="analytics-dashboard">
      <header className="dashboard-header">
        <h1>Your Progress</h1>
        <div className="header-actions">
          <button
            className="export-button"
            onClick={handleExport}
            title="Export analytics data"
          >
            Export Data
          </button>
        </div>
        <div className="time-range-selector">
          <button
            className={timeRange === 'week' ? 'active' : ''}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button
            className={timeRange === 'month' ? 'active' : ''}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
          <button
            className={timeRange === 'all' ? 'active' : ''}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>
      </header>

      {/* Overview Cards */}
      <section className="overview-cards">
        <OverviewCard
          title="Overall Level"
          value={skillAnalytics.overallLevel}
          suffix="/100"
          trend={skillAnalytics.overallLevel >= 50 ? 'up' : 'neutral'}
          color={skillAnalytics.overallLevel >= 75 ? '#2ecc71' : skillAnalytics.overallLevel >= 50 ? '#f1c40f' : '#e74c3c'}
        />
        <OverviewCard
          title="Items Mastered"
          value={masteredFingers + masteredWords}
          subtitle={`${masteredFingers} chars, ${masteredWords} words`}
        />
        <OverviewCard
          title="Average WPM"
          value={wpmTrend.currentAverage}
          trend={wpmTrendDirection}
          changePercent={wpmTrend.changePercent}
        />
        <OverviewCard
          title="Practice Streak"
          value={weeklyStats.streakDays}
          suffix=" days"
          color={weeklyStats.streakDays >= 7 ? '#2ecc71' : undefined}
        />
        <OverviewCard
          title="Practice Time"
          value={formatPracticeTime(weeklyStats.totalPracticeTimeMs)}
          subtitle="this week"
        />
        <OverviewCard
          title="Accuracy"
          value={Math.round(weeklyStats.averageAccuracy * 100)}
          suffix="%"
          trend={weeklyStats.averageAccuracy >= 0.9 ? 'up' : weeklyStats.averageAccuracy >= 0.7 ? 'neutral' : 'down'}
        />
      </section>

      {/* Progress Chart */}
      <section className="chart-section">
        <h2>Progress Over Time</h2>
        <ProgressChart data={progressTrend} />
      </section>

      {/* Skills Section */}
      <section className="skills-section">
        <h2>Skill Breakdown</h2>
        <div className="skills-grid">
          <FingerHeatmap data={fingerHeatmap} />
          <div className="skill-summary">
            <h3>Strongest Areas</h3>
            <ul className="skill-list strong">
              {skillAnalytics.strongestAreas.map((area, i) => (
                <li key={i}>{area}</li>
              ))}
            </ul>
            <h3>Needs Improvement</h3>
            <ul className="skill-list weak">
              {skillAnalytics.weakestAreas.map((area, i) => (
                <li key={i}>{area}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Trouble Areas */}
      <section className="trouble-section" id="trouble-items">
        <h2>Areas Needing Practice</h2>
        <TroubleItemsList items={troubleItems} onPractice={onNavigate} />
      </section>

      {/* Calendar Heatmap */}
      <section className="calendar-section">
        <h2>Activity Calendar</h2>
        <CalendarHeatmap analyticsService={analyticsService} months={3} />
      </section>

      {/* Insights & Recommendations */}
      <section className="insights-section">
        <h2>Insights & Recommendations</h2>
        <InsightsList
          insights={insights}
          recommendations={recommendations}
          onAction={onNavigate}
        />
      </section>
    </div>
  );
}

export default AnalyticsDashboard;
