/**
 * TimingMeter Component
 *
 * Visual feedback for timing accuracy in cross-hand power chord training.
 * Shows how close the user's key presses were to being simultaneous.
 */

import React from 'react';

/**
 * Props for TimingMeter component.
 */
export interface TimingMeterProps {
  /** Target timing in milliseconds (e.g., 50ms for perfect sync) */
  targetMs: number;
  /** Actual timing difference in milliseconds, or null if no measurement */
  actualMs: number | null;
  /** Whether to show text feedback */
  showFeedback?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * TimingMeter displays a visual representation of timing accuracy.
 * The scale shows a "good zone" and the user's actual timing as a marker.
 */
export function TimingMeter({
  targetMs,
  actualMs,
  showFeedback = true,
  className = '',
}: TimingMeterProps): React.ReactElement | null {
  if (actualMs === null) {
    return null;
  }

  // Calculate position (cap at 4x target)
  const maxMs = targetMs * 4;
  const ratio = Math.min(actualMs / maxMs, 1);
  const isGood = actualMs <= targetMs;

  // Good zone width as percentage
  const goodZoneWidth = (targetMs / maxMs) * 100;

  return (
    <div className={`timing-meter ${className}`}>
      <div className="timing-meter-scale">
        {/* Good zone indicator */}
        <div
          className="timing-meter-good-zone"
          style={{ width: `${goodZoneWidth}%` }}
        />

        {/* Actual timing marker */}
        <div
          className="timing-meter-marker"
          style={{ left: `${ratio * 100}%` }}
        >
          <div className={`timing-meter-dot ${isGood ? 'good' : 'bad'}`} />
        </div>

        {/* Scale labels */}
        <div className="timing-meter-labels">
          <span className="timing-meter-label start">0ms</span>
          <span className="timing-meter-label target">{targetMs}ms</span>
          <span className="timing-meter-label end">{maxMs}ms</span>
        </div>
      </div>

      {showFeedback && (
        <div className={`timing-meter-feedback ${isGood ? 'good' : 'bad'}`}>
          {isGood ? 'Perfect sync!' : `${actualMs}ms apart - try to sync better`}
        </div>
      )}
    </div>
  );
}

export default TimingMeter;
