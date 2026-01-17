import { Finger, FINGER_COLORS, FINGER_NAMES, FINGERS_IN_ORDER } from '../../../config/fingerMapping';

interface FingerIndicatorProps {
  activeFingers: Finger[];
  pressedFingers?: Finger[];
  size?: 'small' | 'medium' | 'large';
}

export function FingerIndicator({ activeFingers, pressedFingers = [], size = 'medium' }: FingerIndicatorProps) {
  const activeFingersSet = new Set(activeFingers);
  const pressedFingersSet = new Set(pressedFingers);

  const sizes = {
    small: { dot: 12, gap: 4 },
    medium: { dot: 20, gap: 6 },
    large: { dot: 32, gap: 8 },
  };

  const { dot, gap } = sizes[size];

  return (
    <>
      <style>
        {`
          @keyframes bounce {
            0%, 100% {
              transform: scale(1) translateY(0);
            }
            50% {
              transform: scale(1.3) translateY(-8px);
            }
          }
          @keyframes pulse {
            0%, 100% {
              box-shadow: 0 0 ${dot / 2}px currentColor;
            }
            50% {
              box-shadow: 0 0 ${dot}px currentColor, 0 0 ${dot * 1.5}px currentColor;
            }
          }
        `}
      </style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: gap,
          padding: '8px',
        }}
      >
        {/* Left hand - first 9 fingers */}
        <div style={{ display: 'flex', gap: gap, marginRight: gap * 2 }}>
          {FINGERS_IN_ORDER.slice(0, 9).map((finger) => {
            const isActive = activeFingersSet.has(finger);
            const isPressed = pressedFingersSet.has(finger);
            return (
              <div
                key={finger}
                title={FINGER_NAMES[finger]}
                style={{
                  width: dot,
                  height: dot,
                  borderRadius: '50%',
                  backgroundColor: isActive ? FINGER_COLORS[finger] : '#333',
                  border: `2px solid ${FINGER_COLORS[finger]}`,
                  opacity: isActive ? 1 : 0.3,
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? `0 0 ${dot / 2}px ${FINGER_COLORS[finger]}` : 'none',
                  animation: isPressed ? 'bounce 0.3s ease-out' : 'none',
                  color: FINGER_COLORS[finger],
                }}
              />
            );
          })}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 2,
            height: dot * 1.5,
            backgroundColor: '#444',
          }}
        />

        {/* Right hand - remaining fingers */}
        <div style={{ display: 'flex', gap: gap, marginLeft: gap * 2 }}>
          {FINGERS_IN_ORDER.slice(9).map((finger) => {
            const isActive = activeFingersSet.has(finger);
            const isPressed = pressedFingersSet.has(finger);
            return (
              <div
                key={finger}
                title={FINGER_NAMES[finger]}
                style={{
                  width: dot,
                  height: dot,
                  borderRadius: '50%',
                  backgroundColor: isActive ? FINGER_COLORS[finger] : '#333',
                  border: `2px solid ${FINGER_COLORS[finger]}`,
                  opacity: isActive ? 1 : 0.3,
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? `0 0 ${dot / 2}px ${FINGER_COLORS[finger]}` : 'none',
                  animation: isPressed ? 'bounce 0.3s ease-out' : 'none',
                  color: FINGER_COLORS[finger],
                }}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

// Hand visualization component
interface HandVisualizationProps {
  activeFingers: Finger[];
  pressedFingers?: Finger[];
  hand: 'left' | 'right';
}

export function HandVisualization({ activeFingers, pressedFingers = [], hand }: HandVisualizationProps) {
  const activeFingersSet = new Set(activeFingers);
  const pressedFingersSet = new Set(pressedFingers);

  const fingerPositions = hand === 'left'
    ? [
        { finger: Finger.L_PINKY, x: 10, y: 30 },
        { finger: Finger.L_RING, x: 22, y: 15 },
        { finger: Finger.L_MIDDLE, x: 34, y: 10 },
        { finger: Finger.L_INDEX, x: 46, y: 20 },
        { finger: Finger.L_THUMB_FIRST, x: 55, y: 50 },
        { finger: Finger.L_THUMB_SECOND, x: 65, y: 62 },
        { finger: Finger.L_THUMB_THIRD, x: 75, y: 72 },
        { finger: Finger.L_ARROW, x: 85, y: 80 },
        { finger: Finger.L_TRACKBALL, x: 92, y: 85 },
      ]
    : [
        { finger: Finger.R_TRACKBALL, x: 8, y: 85 },
        { finger: Finger.R_ARROW, x: 15, y: 80 },
        { finger: Finger.R_THUMB_THIRD, x: 25, y: 72 },
        { finger: Finger.R_THUMB_SECOND, x: 35, y: 62 },
        { finger: Finger.R_THUMB_FIRST, x: 45, y: 50 },
        { finger: Finger.R_INDEX, x: 54, y: 20 },
        { finger: Finger.R_MIDDLE, x: 66, y: 10 },
        { finger: Finger.R_RING, x: 78, y: 15 },
        { finger: Finger.R_PINKY, x: 90, y: 30 },
      ];

  return (
    <>
      <style>
        {`
          @keyframes svgBounce {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.4);
            }
          }
        `}
      </style>
      <svg viewBox="0 0 100 100" style={{ width: '150px', height: '150px' }}>
        {/* Hand outline */}
        <ellipse
          cx="50"
          cy="60"
          rx="35"
          ry="25"
          fill="#121212"
          stroke="#333"
          strokeWidth="2"
        />

        {/* Fingers */}
        {fingerPositions.map(({ finger, x, y }) => {
          const isActive = activeFingersSet.has(finger);
          const isPressed = pressedFingersSet.has(finger);
          return (
            <circle
              key={finger}
              cx={x}
              cy={y}
              r="8"
              fill={isActive ? FINGER_COLORS[finger] : '#333'}
              stroke={FINGER_COLORS[finger]}
              strokeWidth="2"
              style={{
                filter: isActive
                  ? `drop-shadow(0 0 4px ${FINGER_COLORS[finger]})`
                  : 'none',
                transition: 'all 0.15s ease',
                transformOrigin: `${x}px ${y}px`,
                animation: isPressed ? 'svgBounce 0.3s ease-out' : 'none',
              }}
            >
              <title>{FINGER_NAMES[finger]}</title>
            </circle>
          );
        })}

        {/* Hand label */}
        <text
          x="50"
          y="95"
          textAnchor="middle"
          fill="#666"
          fontSize="10"
          fontFamily="sans-serif"
        >
          {hand === 'left' ? 'Left' : 'Right'}
        </text>
      </svg>
    </>
  );
}
