import { useState, useEffect, useCallback } from 'react';
import {
  Finger,
  FINGER_COLORS,
  FINGER_NAMES,
  FINGERS_IN_ORDER,
  KEY_MAPPING,
  getCharsForFinger,
  getFingerForChar,
  getColorForChar,
  getFingerNoteName,
} from '../../../config/fingerMapping';
import { useAudio } from '../../../hooks/useAudio';
import { ColoredLetter } from '../../ui/atoms/ColoredLetter';
import { Finger as FingerEntity } from '../../../domain';
import { ContinueButton } from '../../ui/molecules/ContinueButton';

type Hand = 'left' | 'right';
type FingerType = 'pinky' | 'ring' | 'middle' | 'index' | 'thumbFirst' | 'thumbSecond' | 'thumbThird' | 'arrow' | 'trackball';
type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Props for CharacterLearning component.
 */
interface CharacterLearningProps {
  /** Whether this component is being rendered in campaign mode */
  inCampaignMode?: boolean;
  /** Callback when chapter is completed (campaign mode only) */
  onChapterComplete?: () => void;
  /** Whether the user is revisiting a completed chapter */
  isRevisiting?: boolean;
}

interface KeyDisplayProps {
  direction: Direction;
  keyInfo: { key: string | null; char: string | null };
  finger: Finger;
  isHighlighted: boolean;
  onClick: () => void;
}

function KeyDisplay({ direction, keyInfo, finger, isHighlighted, onClick }: KeyDisplayProps) {
  const { playFingerNote } = useAudio();

  const handleClick = () => {
    if (keyInfo.char) {
      playFingerNote(finger);
    }
    onClick();
  };

  const directionArrows: Record<Direction, string> = {
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
  };

  return (
    <button
      onClick={handleClick}
      style={{
        width: '60px',
        height: '60px',
        backgroundColor: isHighlighted ? FINGER_COLORS[finger] : '#222',
        border: `2px solid ${FINGER_COLORS[finger]}`,
        borderRadius: '8px',
        cursor: keyInfo.key ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: isHighlighted ? '#000' : '#fff',
        fontWeight: 'bold',
        transition: 'all 0.15s ease',
        opacity: keyInfo.key ? 1 : 0.3,
      }}
    >
      <span style={{ fontSize: '0.75rem', color: isHighlighted ? '#333' : '#666' }}>
        {directionArrows[direction]}
      </span>
      <span style={{ fontSize: '1rem' }}>
        {keyInfo.char || keyInfo.key || '-'}
      </span>
    </button>
  );
}

interface FingerKeysDisplayProps {
  hand: Hand;
  fingerType: FingerType;
  finger: Finger;
  highlightedChar: string | null;
  onCharClick: (char: string | null) => void;
}

function FingerKeysDisplay({
  hand,
  fingerType,
  finger,
  highlightedChar,
  onCharClick,
}: FingerKeysDisplayProps) {
  const fingerKeys = KEY_MAPPING[hand][fingerType];
  const { playFingerNote } = useAudio();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px',
        backgroundColor: '#121212',
        borderRadius: '12px',
        border: `2px solid ${FINGER_COLORS[finger]}`,
      }}
    >
      {/* Finger name and note */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ color: FINGER_COLORS[finger], fontWeight: 'bold' }}>
          {FINGER_NAMES[finger]}
        </div>
        <div style={{ color: '#666', fontSize: '0.875rem' }}>
          Note: {getFingerNoteName(finger)}
        </div>
        <button
          onClick={() => playFingerNote(finger)}
          style={{
            marginTop: '4px',
            padding: '4px 12px',
            backgroundColor: FINGER_COLORS[finger],
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}
        >
          ♪ Play Note
        </button>
      </div>

      {/* Keys in cross pattern */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        {/* Up */}
        <KeyDisplay
          direction="up"
          keyInfo={fingerKeys.up}
          finger={finger}
          isHighlighted={highlightedChar === fingerKeys.up.char}
          onClick={() => onCharClick(fingerKeys.up.char)}
        />

        {/* Left, Center indicator, Right */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <KeyDisplay
            direction="left"
            keyInfo={fingerKeys.left}
            finger={finger}
            isHighlighted={highlightedChar === fingerKeys.left.char}
            onClick={() => onCharClick(fingerKeys.left.char)}
          />

          {/* Center - finger indicator */}
          <div
            style={{
              width: '60px',
              height: '60px',
              backgroundColor: FINGER_COLORS[finger],
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 20px ${FINGER_COLORS[finger]}50`,
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>●</span>
          </div>

          <KeyDisplay
            direction="right"
            keyInfo={fingerKeys.right}
            finger={finger}
            isHighlighted={highlightedChar === fingerKeys.right.char}
            onClick={() => onCharClick(fingerKeys.right.char)}
          />
        </div>

        {/* Down */}
        <KeyDisplay
          direction="down"
          keyInfo={fingerKeys.down}
          finger={finger}
          isHighlighted={highlightedChar === fingerKeys.down.char}
          onClick={() => onCharClick(fingerKeys.down.char)}
        />
      </div>
    </div>
  );
}

export function CharacterLearning({
  inCampaignMode = false,
  onChapterComplete,
  isRevisiting = false,
}: CharacterLearningProps) {
  const [selectedFinger, setSelectedFinger] = useState<Finger | null>(null);
  const [highlightedChar, setHighlightedChar] = useState<string | null>(null);
  const [pressedChar, setPressedChar] = useState<string | null>(null);
  const [fingersExplored, setFingersExplored] = useState<Set<Finger>>(new Set());
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const { playFingerNote, playChordNotes } = useAudio();

  // Track engagement for campaign mode
  const hasEngaged = fingersExplored.size >= 3 || keysPressed.size >= 5;

  const leftHandFingers = FINGERS_IN_ORDER.slice(0, 9);
  const rightHandFingers = FINGERS_IN_ORDER.slice(9);

  const getFingerType = (finger: Finger): FingerType => {
    if (finger.includes('pinky')) return 'pinky';
    if (finger.includes('ring')) return 'ring';
    if (finger.includes('middle')) return 'middle';
    if (finger.includes('index')) return 'index';
    if (finger.includes('thumb_first')) return 'thumbFirst';
    if (finger.includes('thumb_second')) return 'thumbSecond';
    if (finger.includes('thumb_third')) return 'thumbThird';
    if (finger.includes('arrow')) return 'arrow';
    return 'trackball';
  };

  const getHand = (finger: Finger): Hand => {
    return FingerEntity.isLeftHandId(finger) ? 'left' : 'right';
  };

  const handleFingerSelect = (finger: Finger) => {
    setSelectedFinger(finger);
    playFingerNote(finger);
    // Track finger exploration for campaign engagement
    setFingersExplored((prev) => new Set([...prev, finger]));
  };

  const handlePlayAllNotes = () => {
    playChordNotes(FINGERS_IN_ORDER, 0.8);
  };

  // Handle keyboard input
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    const char = event.key.toLowerCase();
    const finger = getFingerForChar(char);

    if (finger) {
      playFingerNote(finger);
      setPressedChar(char);
      // Track key presses for campaign engagement
      setKeysPressed((prev) => new Set([...prev, char]));

      // Clear the pressed char after animation
      setTimeout(() => {
        setPressedChar(null);
      }, 500);
    }
  }, [playFingerNote]);

  // Add keyboard listener
  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#fff' }}>Character Learning</h2>

      {/* Big pressed character display */}
      <div
        style={{
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '30px',
          backgroundColor: '#111',
          borderRadius: '16px',
          border: '2px solid #333',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {pressedChar ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'popIn 0.3s ease-out',
            }}
          >
            <span
              style={{
                fontSize: '8rem',
                fontWeight: 'bold',
                color: getColorForChar(pressedChar),
                textShadow: `0 0 40px ${getColorForChar(pressedChar)}, 0 0 80px ${getColorForChar(pressedChar)}50`,
                fontFamily: 'monospace',
                textTransform: 'uppercase',
              }}
            >
              {pressedChar}
            </span>
            <span
              style={{
                fontSize: '1.2rem',
                color: getColorForChar(pressedChar),
                marginTop: '8px',
              }}
            >
              {FINGER_NAMES[getFingerForChar(pressedChar)!]}
            </span>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: '1.5rem', margin: 0 }}>
              Press any character key
            </p>
            <p style={{ color: '#444', fontSize: '1rem', marginTop: '8px' }}>
              to hear its note and see its color
            </p>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes popIn {
            0% {
              transform: scale(0.5);
              opacity: 0;
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>

      <p style={{ color: '#888', marginBottom: '20px' }}>
        Learn the CharaChorder key layout. Press keys on your keyboard to hear their notes,
        or click on a finger below to see its keys.
      </p>

      {/* Play all notes button */}
      <button
        onClick={handlePlayAllNotes}
        style={{
          marginBottom: '20px',
          padding: '12px 24px',
          background: 'linear-gradient(90deg, #9B59B6, #E74C3C, #673AB7)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '1rem',
        }}
      >
        ♪ Play All Notes (Scale)
      </button>

      {/* Finger selector */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#fff', marginBottom: '15px' }}>Select a finger to explore:</h3>

        <div style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
          {/* Left hand */}
          <div>
            <h4 style={{ color: '#888', marginBottom: '10px', textAlign: 'center' }}>
              Left Hand
            </h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {leftHandFingers.map((finger) => (
                <button
                  key={finger}
                  onClick={() => handleFingerSelect(finger)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor:
                      selectedFinger === finger ? FINGER_COLORS[finger] : '#222',
                    color: selectedFinger === finger ? '#000' : '#fff',
                    border: `2px solid ${FINGER_COLORS[finger]}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: selectedFinger === finger ? 'bold' : 'normal',
                    boxShadow:
                      selectedFinger === finger
                        ? `0 0 15px ${FINGER_COLORS[finger]}`
                        : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {FINGER_NAMES[finger].replace('Left ', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Right hand */}
          <div>
            <h4 style={{ color: '#888', marginBottom: '10px', textAlign: 'center' }}>
              Right Hand
            </h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {rightHandFingers.map((finger) => (
                <button
                  key={finger}
                  onClick={() => handleFingerSelect(finger)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor:
                      selectedFinger === finger ? FINGER_COLORS[finger] : '#222',
                    color: selectedFinger === finger ? '#000' : '#fff',
                    border: `2px solid ${FINGER_COLORS[finger]}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: selectedFinger === finger ? 'bold' : 'normal',
                    boxShadow:
                      selectedFinger === finger
                        ? `0 0 15px ${FINGER_COLORS[finger]}`
                        : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {FINGER_NAMES[finger].replace('Right ', '')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected finger detail */}
      {selectedFinger && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
          <FingerKeysDisplay
            hand={getHand(selectedFinger)}
            fingerType={getFingerType(selectedFinger)}
            finger={selectedFinger}
            highlightedChar={highlightedChar}
            onCharClick={setHighlightedChar}
          />
        </div>
      )}

      {/* Full keyboard overview */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ color: '#fff', marginBottom: '20px' }}>Full Layout Overview</h3>

        <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Left hand */}
          <div>
            <h4 style={{ color: '#888', marginBottom: '10px', textAlign: 'center' }}>
              Left Hand
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {leftHandFingers.map((finger) => {
                const chars = getCharsForFinger(finger);
                return (
                  <div
                    key={finger}
                    onClick={() => handleFingerSelect(finger)}
                    style={{
                      padding: '12px',
                      backgroundColor: '#121212',
                      borderRadius: '8px',
                      border: `2px solid ${FINGER_COLORS[finger]}`,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        color: FINGER_COLORS[finger],
                        fontSize: '0.75rem',
                        marginBottom: '4px',
                      }}
                    >
                      {FINGER_NAMES[finger].replace('Left ', '')}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {chars.length > 0 ? (
                        chars.map((char) => (
                          <ColoredLetter key={char} char={char} size="medium" />
                        ))
                      ) : (
                        <span style={{ color: '#444' }}>-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right hand */}
          <div>
            <h4 style={{ color: '#888', marginBottom: '10px', textAlign: 'center' }}>
              Right Hand
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {rightHandFingers.map((finger) => {
                const chars = getCharsForFinger(finger);
                return (
                  <div
                    key={finger}
                    onClick={() => handleFingerSelect(finger)}
                    style={{
                      padding: '12px',
                      backgroundColor: '#121212',
                      borderRadius: '8px',
                      border: `2px solid ${FINGER_COLORS[finger]}`,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        color: FINGER_COLORS[finger],
                        fontSize: '0.75rem',
                        marginBottom: '4px',
                      }}
                    >
                      {FINGER_NAMES[finger].replace('Right ', '')}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {chars.length > 0 ? (
                        chars.map((char) => (
                          <ColoredLetter key={char} char={char} size="medium" />
                        ))
                      ) : (
                        <span style={{ color: '#444' }}>-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Campaign mode: Continue button */}
      {inCampaignMode && hasEngaged && !isRevisiting && onChapterComplete && (
        <ContinueButton
          onContinue={onChapterComplete}
          message="Great job exploring the keyboard layout!"
          buttonText="Continue to Power Chords"
        />
      )}
    </div>
  );
}
