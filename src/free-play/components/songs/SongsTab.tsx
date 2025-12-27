/**
 * Songs Tab Component
 *
 * Main container for the Songs mode, handling navigation between
 * song selection and gameplay.
 */

import React, { useState, useCallback } from 'react';
import { type SongConfig } from '@/data/static/songConfig';
import { SongSelector } from './SongSelector';
import { SongGame } from './SongGame';
import './songs.css';

type SongsView = 'selector' | 'game';

export function SongsTab() {
  const [view, setView] = useState<SongsView>('selector');
  const [selectedSong, setSelectedSong] = useState<SongConfig | null>(null);

  const handleSelectSong = useCallback((song: SongConfig) => {
    setSelectedSong(song);
    setView('game');
  }, []);

  const handleBackToSelector = useCallback(() => {
    setView('selector');
    setSelectedSong(null);
  }, []);

  const handleGameComplete = useCallback(() => {
    setView('selector');
    setSelectedSong(null);
  }, []);

  if (view === 'game' && selectedSong) {
    return (
      <SongGame
        song={selectedSong}
        onComplete={handleGameComplete}
        onBack={handleBackToSelector}
      />
    );
  }

  return <SongSelector onSelectSong={handleSelectSong} />;
}

export default SongsTab;
