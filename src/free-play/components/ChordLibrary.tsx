import { useState, useMemo } from 'react';
import { CHORD_DATA, getWordEntries } from '@/data/chords';
import { ColoredChord } from '@/components/ColoredLetter';
import { FingerIndicator } from '@/components/FingerIndicator';
import { useAudio } from '@/hooks/useAudio';
import { getFingersForChord, Finger, FINGER_COLORS, FINGER_NAMES, FINGERS_IN_ORDER } from '@/config/fingerMapping';
import type { WordEntry } from '@/data/types';

type SearchMode = 'word' | 'chord' | 'fingers';

export function ChordLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('word');
  const [selectedFingers, setSelectedFingers] = useState<Set<Finger>>(new Set());
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const { playChordFromString } = useAudio();

  const wordEntries = useMemo(() => getWordEntries(), []);

  const filteredEntries = useMemo(() => {
    if (searchMode === 'fingers') {
      if (selectedFingers.size === 0) {
        return wordEntries.slice(0, 50);
      }

      return wordEntries.filter((entry) => {
        // Check if any chord for this word uses exactly or subset of selected fingers
        return entry.chords.some((chord) => {
          const chordFingers = new Set(getFingersForChord(chord));
          // All fingers in chord must be in selected fingers
          for (const finger of chordFingers) {
            if (!selectedFingers.has(finger)) {
              return false;
            }
          }
          return chordFingers.size > 0;
        });
      });
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return wordEntries.slice(0, 50);
    }

    if (searchMode === 'word') {
      return wordEntries.filter((entry) =>
        entry.word.toLowerCase().includes(query)
      );
    } else {
      // Search by chord
      const matchingChords = CHORD_DATA.filter((entry) =>
        entry.chord.toLowerCase().includes(query)
      );
      const matchingWords = new Set(matchingChords.map((c) => c.word));
      return wordEntries.filter((entry) => matchingWords.has(entry.word));
    }
  }, [searchQuery, searchMode, selectedFingers, wordEntries]);

  const handleFingerToggle = (finger: Finger) => {
    setSelectedFingers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(finger)) {
        newSet.delete(finger);
      } else {
        newSet.add(finger);
      }
      return newSet;
    });
  };

  const handlePlayChord = (chord: string) => {
    playChordFromString(chord);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#fff' }}>Chord Library</h2>

      {/* Search mode tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {(['word', 'chord', 'fingers'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              setSearchMode(mode);
              setSearchQuery('');
              setSelectedFingers(new Set());
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: searchMode === mode ? '#4a9eff' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontWeight: searchMode === mode ? 'bold' : 'normal',
            }}
          >
            Search by {mode}
          </button>
        ))}
      </div>

      {/* Search input or finger selector */}
      {searchMode === 'fingers' ? (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#888', marginBottom: '10px' }}>
            Select fingers to find chords that use only those fingers:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {FINGERS_IN_ORDER.map((finger) => (
              <button
                key={finger}
                onClick={() => handleFingerToggle(finger)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: selectedFingers.has(finger)
                    ? FINGER_COLORS[finger]
                    : '#222',
                  color: selectedFingers.has(finger) ? '#000' : '#fff',
                  border: `2px solid ${FINGER_COLORS[finger]}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: selectedFingers.has(finger) ? 'bold' : 'normal',
                }}
              >
                {FINGER_NAMES[finger]}
              </button>
            ))}
          </div>
          {selectedFingers.size > 0 && (
            <button
              onClick={() => setSelectedFingers(new Set())}
              style={{
                marginTop: '10px',
                padding: '6px 12px',
                backgroundColor: 'transparent',
                color: '#888',
                border: '1px solid #444',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Clear selection
            </button>
          )}
        </div>
      ) : (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search by ${searchMode}...`}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '12px 16px',
            fontSize: '1rem',
            backgroundColor: '#222',
            color: '#fff',
            border: '2px solid #444',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        />
      )}

      {/* Results count */}
      <p style={{ color: '#888', marginBottom: '15px' }}>
        Showing {filteredEntries.length} words
      </p>

      {/* Results list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredEntries.map((entry) => (
          <WordCard
            key={entry.word}
            entry={entry}
            isExpanded={expandedWord === entry.word}
            onToggle={() =>
              setExpandedWord(expandedWord === entry.word ? null : entry.word)
            }
            onPlayChord={handlePlayChord}
          />
        ))}
      </div>
    </div>
  );
}

interface WordCardProps {
  entry: WordEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onPlayChord: (chord: string) => void;
}

function WordCard({ entry, isExpanded, onToggle, onPlayChord }: WordCardProps) {
  const primaryChord = entry.chords[0];
  const primaryFingers = getFingersForChord(primaryChord);

  return (
    <div
      style={{
        backgroundColor: '#121212',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #333',
      }}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          padding: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Word */}
          <span style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 'bold', minWidth: '120px' }}>
            {entry.word}
          </span>

          {/* Primary chord */}
          <ColoredChord chord={primaryChord} size="medium" />

          {/* Rank badge */}
          {entry.rank && (
            <span
              style={{
                padding: '4px 8px',
                backgroundColor: entry.rank <= 50 ? '#2ecc71' : entry.rank <= 100 ? '#f1c40f' : '#666',
                color: entry.rank <= 100 ? '#000' : '#fff',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}
            >
              #{entry.rank}
            </span>
          )}
        </div>

        {/* Finger indicator */}
        <FingerIndicator activeFingers={primaryFingers} size="small" />
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #333',
            backgroundColor: '#111',
          }}
        >
          <h4 style={{ color: '#888', marginBottom: '12px' }}>
            All chord variations ({entry.chords.length}):
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {entry.chords.map((chord, index) => {
              const fingers = getFingersForChord(chord);
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    backgroundColor: '#121212',
                    borderRadius: '8px',
                  }}
                >
                  <ColoredChord chord={chord} size="large" />
                  <FingerIndicator activeFingers={fingers} size="medium" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayChord(chord);
                    }}
                    style={{
                      marginLeft: 'auto',
                      padding: '8px 16px',
                      backgroundColor: '#4a9eff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>♪</span> Play
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
