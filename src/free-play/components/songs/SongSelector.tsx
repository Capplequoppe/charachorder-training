/**
 * Song Selector Component
 *
 * Displays available songs and allows filtering by difficulty.
 * Includes option to generate random songs.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { type SongConfig, type SongDifficulty, calculateDuration } from '@/data/static/songConfig';
import { getAllPrecomposedSongs } from '@/data/songs/precomposedSongs';
import { getSongGeneratorService } from '@/free-play/services/SongGeneratorService';

export interface SongSelectorProps {
  onSelectSong: (song: SongConfig) => void;
  generatedSongs?: SongConfig[];
}

type FilterOption = 'all' | SongDifficulty;

export function SongSelector({ onSelectSong, generatedSongs = [] }: SongSelectorProps) {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [localGeneratedSongs, setLocalGeneratedSongs] = useState<SongConfig[]>([]);
  const songGenerator = getSongGeneratorService();

  // Combine precomposed and generated songs
  const allSongs = useMemo(() => {
    return [...getAllPrecomposedSongs(), ...generatedSongs, ...localGeneratedSongs];
  }, [generatedSongs, localGeneratedSongs]);

  // Handle generating a new song
  const handleGenerateSong = useCallback((difficulty?: SongDifficulty) => {
    const newSong = songGenerator.generateSong({ difficulty });
    setLocalGeneratedSongs((prev) => [...prev, newSong]);
    onSelectSong(newSong);
  }, [songGenerator, onSelectSong]);

  // Filter songs
  const filteredSongs = useMemo(() => {
    if (filter === 'all') {
      return allSongs;
    }
    return allSongs.filter((song) => song.difficulty === filter);
  }, [allSongs, filter]);

  const formatDuration = (song: SongConfig): string => {
    const seconds = Math.round(calculateDuration(song));
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="song-selector">
      <div className="song-selector__header">
        <h1 className="song-selector__title">Songs</h1>
        <p className="song-selector__subtitle">
          Type words in rhythm with the music
        </p>
      </div>

      <div className="song-selector__filters">
        <button
          className={`song-selector__filter-btn ${filter === 'all' ? 'song-selector__filter-btn--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`song-selector__filter-btn ${filter === 'beginner' ? 'song-selector__filter-btn--active' : ''}`}
          onClick={() => setFilter('beginner')}
        >
          Beginner
        </button>
        <button
          className={`song-selector__filter-btn ${filter === 'intermediate' ? 'song-selector__filter-btn--active' : ''}`}
          onClick={() => setFilter('intermediate')}
        >
          Intermediate
        </button>
        <button
          className={`song-selector__filter-btn ${filter === 'advanced' ? 'song-selector__filter-btn--active' : ''}`}
          onClick={() => setFilter('advanced')}
        >
          Advanced
        </button>
      </div>

      {/* Generate Song Section */}
      <div className="song-selector__generate">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
          Or generate a random song:
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button
            className="song-selector__filter-btn"
            onClick={() => handleGenerateSong('beginner')}
          >
            Easy Random
          </button>
          <button
            className="song-selector__filter-btn"
            onClick={() => handleGenerateSong('intermediate')}
          >
            Medium Random
          </button>
          <button
            className="song-selector__filter-btn"
            onClick={() => handleGenerateSong('advanced')}
          >
            Hard Random
          </button>
        </div>
      </div>

      <div className="song-selector__grid">
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            className="song-card"
            onClick={() => onSelectSong(song)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectSong(song);
              }
            }}
          >
            <div className="song-card__title">{song.title}</div>
            <div className="song-card__artist">{song.artist || 'CharaChorder Trainer'}</div>
            <div className="song-card__meta">
              <span className="song-card__bpm">{song.bpm} BPM</span>
              <span className="song-card__duration">{formatDuration(song)}</span>
            </div>
            <span className={`song-card__difficulty song-card__difficulty--${song.difficulty}`}>
              {song.difficulty}
            </span>
            <p className="song-card__description">{song.description}</p>
          </div>
        ))}
      </div>

      {filteredSongs.length === 0 && (
        <div className="song-selector__empty">
          No songs found for this difficulty level.
        </div>
      )}
    </div>
  );
}

export default SongSelector;
