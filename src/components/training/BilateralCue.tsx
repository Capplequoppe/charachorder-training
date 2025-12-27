/**
 * BilateralCue Component
 *
 * Visual timing cue for cross-hand synchronization.
 * Two dots move from the edges toward the center - user should
 * press both keys when the dots meet in the middle.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { FingerId } from '../../domain';
import { useColor } from '../../hooks';

/**
 * Props for BilateralCue component.
 */
export interface BilateralCueProps {
  /** Left hand finger ID */
  leftFinger: FingerId;
  /** Right hand finger ID */
  rightFinger: FingerId;
  /** Duration of one cycle in milliseconds */
  cycleDurationMs?: number;
  /** Whether the animation is active */
  isActive?: boolean;
  /** Callback when dots meet in the center */
  onCueComplete?: () => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * BilateralCue displays an animated visual cue to help users
 * time their cross-hand key presses.
 */
export function BilateralCue({
  leftFinger,
  rightFinger,
  cycleDurationMs = 1500,
  isActive = true,
  onCueComplete,
  className = '',
}: BilateralCueProps): React.ReactElement {
  const colorService = useColor();

  const leftColor = colorService.getFingerColor(leftFinger);
  const rightColor = colorService.getFingerColor(rightFinger);

  // Track animation cycle
  const [cycleCount, setCycleCount] = useState(0);

  // Fire callback at the peak of each cycle
  useEffect(() => {
    if (!isActive || !onCueComplete) return;

    // Callback fires at the middle of the cycle (when dots meet)
    const timer = setTimeout(() => {
      onCueComplete();
      setCycleCount((c) => c + 1);
    }, cycleDurationMs / 2);

    return () => clearTimeout(timer);
  }, [isActive, cycleDurationMs, onCueComplete, cycleCount]);

  return (
    <div
      className={`bilateral-cue ${isActive ? 'active' : ''} ${className}`}
      style={
        {
          '--cycle-duration': `${cycleDurationMs}ms`,
          '--left-color': leftColor,
          '--right-color': rightColor,
        } as React.CSSProperties
      }
    >
      {/* Left dot - moves from left to center */}
      <div
        className="bilateral-dot left-dot"
        style={{ backgroundColor: leftColor }}
      />

      {/* Center target area */}
      <div className="bilateral-center-target">
        <div className="bilateral-center-ring" />
      </div>

      {/* Right dot - moves from right to center */}
      <div
        className="bilateral-dot right-dot"
        style={{ backgroundColor: rightColor }}
      />

      {/* Timing hint */}
      <div className="bilateral-hint">
        Press when dots meet!
      </div>
    </div>
  );
}

export default BilateralCue;
