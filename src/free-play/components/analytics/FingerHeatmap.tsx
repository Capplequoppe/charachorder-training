/**
 * Finger Heatmap Component
 *
 * Visualizes finger performance with color-coded accuracy display.
 */

import type { FingerHeatmapData } from '../../data/models/Analytics';
import type { FingerId } from '../../domain';

export interface FingerHeatmapProps {
  /** Finger performance data */
  data: FingerHeatmapData;
}

/** Left hand fingers in display order (pinky to thumb) */
const LEFT_FINGERS: FingerId[] = [
  'l_pinky',
  'l_ring',
  'l_middle',
  'l_index',
  'l_thumb_inner',
];

/** Right hand fingers in display order (thumb to pinky) */
const RIGHT_FINGERS: FingerId[] = [
  'r_thumb_inner',
  'r_index',
  'r_middle',
  'r_ring',
  'r_pinky',
];

/** Short display names for fingers */
const FINGER_SHORT_NAMES: Record<FingerId, string> = {
  l_pinky: 'LP',
  l_ring: 'LR',
  l_middle: 'LM',
  l_index: 'LI',
  l_thumb_inner: 'LTI',
  l_thumb_outer: 'LTO',
  r_thumb_inner: 'RTI',
  r_thumb_outer: 'RTO',
  r_index: 'RI',
  r_middle: 'RM',
  r_ring: 'RR',
  r_pinky: 'RP',
};

/** Full display names for fingers */
const FINGER_NAMES: Record<FingerId, string> = {
  l_pinky: 'Left Pinky',
  l_ring: 'Left Ring',
  l_middle: 'Left Middle',
  l_index: 'Left Index',
  l_thumb_inner: 'Left Thumb Inner',
  l_thumb_outer: 'Left Thumb Outer',
  r_thumb_inner: 'Right Thumb Inner',
  r_thumb_outer: 'Right Thumb Outer',
  r_index: 'Right Index',
  r_middle: 'Right Middle',
  r_ring: 'Right Ring',
  r_pinky: 'Right Pinky',
};

interface FingerCellProps {
  finger: FingerId;
  accuracy: number;
  responseTime: number;
  attempts: number;
}

/**
 * Individual finger cell in the heatmap.
 */
function FingerCell({ finger, accuracy, responseTime, attempts }: FingerCellProps) {
  // Color from red (0%) through yellow (50%) to green (100%)
  const hue = accuracy * 120; // 0 = red, 60 = yellow, 120 = green
  const saturation = 70;
  const lightness = attempts > 0 ? 45 : 30;
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  const title = attempts > 0
    ? `${FINGER_NAMES[finger]}: ${Math.round(accuracy * 100)}% accuracy, ${Math.round(responseTime)}ms avg, ${attempts} attempts`
    : `${FINGER_NAMES[finger]}: No data`;

  return (
    <div
      className={`finger-cell ${attempts === 0 ? 'no-data' : ''}`}
      style={{ backgroundColor: color }}
      title={title}
    >
      <span className="finger-label">{FINGER_SHORT_NAMES[finger]}</span>
      {attempts > 0 && (
        <span className="finger-accuracy">{Math.round(accuracy * 100)}%</span>
      )}
    </div>
  );
}

/**
 * Finger heatmap visualization component.
 */
export function FingerHeatmap({ data }: FingerHeatmapProps) {
  return (
    <div className="finger-heatmap">
      <h3>Finger Performance</h3>

      <div className="hands-container">
        {/* Left hand */}
        <div className="hand left">
          <span className="hand-label">Left</span>
          <div className="fingers">
            {LEFT_FINGERS.map((finger) => {
              const fingerData = data[finger];
              return (
                <FingerCell
                  key={finger}
                  finger={finger}
                  accuracy={fingerData?.accuracy ?? 0}
                  responseTime={fingerData?.averageResponseTimeMs ?? 0}
                  attempts={fingerData?.totalAttempts ?? 0}
                />
              );
            })}
          </div>
        </div>

        {/* Right hand */}
        <div className="hand right">
          <span className="hand-label">Right</span>
          <div className="fingers">
            {RIGHT_FINGERS.map((finger) => {
              const fingerData = data[finger];
              return (
                <FingerCell
                  key={finger}
                  finger={finger}
                  accuracy={fingerData?.accuracy ?? 0}
                  responseTime={fingerData?.averageResponseTimeMs ?? 0}
                  attempts={fingerData?.totalAttempts ?? 0}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span className="low">Needs Practice</span>
        <div className="gradient" />
        <span className="high">Mastered</span>
      </div>
    </div>
  );
}

export default FingerHeatmap;
