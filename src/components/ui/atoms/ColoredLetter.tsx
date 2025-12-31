import { getColorForChar, getFingerForChar, FINGER_NAMES } from '../../../config/fingerMapping';

interface ColoredLetterProps {
  char: string;
  showTooltip?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function ColoredLetter({ char, showTooltip = true, size = 'medium' }: ColoredLetterProps) {
  const color = getColorForChar(char);
  const finger = getFingerForChar(char);
  const fingerName = finger ? FINGER_NAMES[finger] : 'Unknown';

  const sizeStyles = {
    small: { fontSize: '0.875rem', padding: '0 2px' },
    medium: { fontSize: '1.25rem', padding: '0 3px' },
    large: { fontSize: '2rem', padding: '0 4px' },
  };

  return (
    <span
      style={{
        color,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        textShadow: '0 0 1px rgba(0,0,0,0.3)',
        ...sizeStyles[size],
      }}
      title={showTooltip ? `${char.toUpperCase()} - ${fingerName}` : undefined}
    >
      {char}
    </span>
  );
}

interface ColoredChordProps {
  chord: string;
  size?: 'small' | 'medium' | 'large';
}

export function ColoredChord({ chord, size = 'medium' }: ColoredChordProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {chord.split('').map((char, index) => (
        <ColoredLetter key={index} char={char} size={size} />
      ))}
    </span>
  );
}
