/**
 * Timing Feedback Component
 *
 * Displays animated feedback for timing accuracy (Perfect, Good, Early, Late, Miss).
 */

import React, { useState, useEffect } from 'react';
import { type TimingAccuracy } from '@/data/static/songConfig';

export interface TimingFeedbackProps {
  accuracy: TimingAccuracy | null;
  offsetMs?: number;
  key?: string | number; // Force re-render for animation
}

const ACCURACY_LABELS: Record<TimingAccuracy, string> = {
  perfect: 'PERFECT',
  good: 'GOOD',
  early: 'EARLY',
  late: 'LATE',
  miss: 'MISS',
};

export function TimingFeedback({ accuracy, offsetMs }: TimingFeedbackProps) {
  const [visible, setVisible] = useState(false);
  const [currentAccuracy, setCurrentAccuracy] = useState<TimingAccuracy | null>(null);

  useEffect(() => {
    if (accuracy) {
      setCurrentAccuracy(accuracy);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [accuracy]);

  if (!visible || !currentAccuracy) {
    return null;
  }

  return (
    <div className="timing-feedback" role="status" aria-live="polite">
      <span
        className={`timing-feedback__text timing-feedback__text--${currentAccuracy}`}
        key={`${currentAccuracy}-${Date.now()}`}
      >
        {ACCURACY_LABELS[currentAccuracy]}
        {offsetMs !== undefined && currentAccuracy !== 'miss' && (
          <span className="timing-feedback__offset">
            {offsetMs > 0 ? '+' : ''}
            {Math.round(offsetMs)}ms
          </span>
        )}
      </span>
    </div>
  );
}

export default TimingFeedback;
