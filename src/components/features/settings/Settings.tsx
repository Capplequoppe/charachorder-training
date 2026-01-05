/**
 * Settings Component
 *
 * Provides UI for configuring application settings including
 * audio preferences, instrument selection, and display options.
 */

import { useState, useCallback } from 'react';
import { useSettings } from '../../../hooks/useSettings';
import { INSTRUMENT_PRESETS, type InstrumentPreset } from '../../../services/AudioService';
import { getServices } from '../../../services/ServiceContainer';
import { useCampaign } from '../../../campaign';
import { CHAPTERS } from '../../../campaign/constants';
import { ChapterId } from '../../../campaign/types';
import { useTips } from '../../../tips';
import { LayoutSettingsSection } from './LayoutSettingsSection';
import './settings.css';

/**
 * Instrument display information.
 */
const INSTRUMENT_INFO: Record<InstrumentPreset, { name: string; icon: string; description: string }> = {
  piano: {
    name: 'Acoustic Piano',
    icon: '🎹',
    description: 'Classic grand piano sound',
  },
  electricPiano: {
    name: 'Electric Piano',
    icon: '🎹',
    description: 'Smooth Rhodes-style electric piano',
  },
  guitarClean: {
    name: 'Clean Guitar',
    icon: '🎸',
    description: 'Clean electric guitar tone',
  },
  guitarNylon: {
    name: 'Nylon Guitar',
    icon: '🎸',
    description: 'Soft classical nylon string guitar',
  },
  guitarSteel: {
    name: 'Steel Guitar',
    icon: '🎸',
    description: 'Bright acoustic steel string guitar',
  },
  vibraphone: {
    name: 'Vibraphone',
    icon: '🎵',
    description: 'Shimmering mallet percussion',
  },
  marimba: {
    name: 'Marimba',
    icon: '🪘',
    description: 'Warm wooden mallet percussion',
  },
  organ: {
    name: 'Drawbar Organ',
    icon: '🎹',
    description: 'Classic Hammond-style organ',
  },
  strings: {
    name: 'String Ensemble',
    icon: '🎻',
    description: 'Lush orchestral strings',
  },
  synth: {
    name: 'Lead Synth',
    icon: '🎛️',
    description: 'Retro sawtooth synthesizer',
  },
};

/**
 * Settings component for managing app preferences.
 */
export function Settings() {
  const {
    settings,
    isLoading,
    setAudioEnabled,
    setVolume,
    setUseSoundfonts,
    setInstrument,
    setShowFingerLabels,
    setShowNoteNames,
    setItemsPerLearnSession,
    resetToDefaults,
  } = useSettings();

  const { campaignState, setMode, resetCampaign, unlockChapter, isChapterCompleted } = useCampaign();
  const { tipsState, setTipsEnabled, resetTips } = useTips();

  const [isChangingInstrument, setIsChangingInstrument] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle instrument change
  const handleInstrumentChange = useCallback(async (instrument: InstrumentPreset) => {
    if (isChangingInstrument) return;

    setIsChangingInstrument(true);
    try {
      await setInstrument(instrument);
    } finally {
      setIsChangingInstrument(false);
    }
  }, [setInstrument, isChangingInstrument]);

  // Play a preview sound
  const playPreview = useCallback(() => {
    if (previewPlaying) return;

    setPreviewPlaying(true);
    const { audio } = getServices();

    // Play a short musical phrase
    audio.playSuccessSound();

    setTimeout(() => {
      setPreviewPlaying(false);
    }, 500);
  }, [previewPlaying]);

  // Play instrument preview
  const playInstrumentPreview = useCallback((instrument: InstrumentPreset) => {
    if (previewPlaying || isChangingInstrument) return;

    // Quick preview without changing the setting
    const { audio } = getServices();
    audio.playSuccessSound();
  }, [previewPlaying, isChangingInstrument]);

  if (isLoading) {
    return (
      <div className="settings-container">
        <div className="settings-loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <h2 className="settings-title">
        <span className="settings-icon">⚙️</span>
        Settings
      </h2>

      {/* Audio Section */}
      <section className="settings-section">
        <h3 className="section-title">
          <span className="section-icon">🔊</span>
          Audio
        </h3>

        {/* Sound Toggle */}
        <div className="setting-item">
          <div className="setting-label">
            <span className="setting-name">Sound</span>
            <span className="setting-description">Enable or disable all audio</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.audio.enabled}
              onChange={(e) => setAudioEnabled(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Volume Slider */}
        <div className="setting-item">
          <div className="setting-label">
            <span className="setting-name">Volume</span>
            <span className="setting-description">{Math.round(settings.audio.volume * 100)}%</span>
          </div>
          <div className="volume-control">
            <span className="volume-icon">🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.audio.volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="volume-slider"
              disabled={!settings.audio.enabled}
            />
            <span className="volume-icon">🔊</span>
            <button
              className="preview-button"
              onClick={playPreview}
              disabled={!settings.audio.enabled || previewPlaying}
            >
              {previewPlaying ? '...' : '▶'}
            </button>
          </div>
        </div>

        {/* Soundfont Toggle */}
        <div className="setting-item">
          <div className="setting-label">
            <span className="setting-name">Realistic Instruments</span>
            <span className="setting-description">
              Use sampled instrument sounds (requires download)
            </span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.audio.useSoundfonts}
              onChange={(e) => setUseSoundfonts(e.target.checked)}
              disabled={!settings.audio.enabled}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Instrument Selection */}
        {settings.audio.useSoundfonts && (
          <div className="setting-item instrument-selection">
            <div className="setting-label">
              <span className="setting-name">Instrument</span>
              <span className="setting-description">
                Choose your preferred sound
              </span>
            </div>
            <div className="instrument-grid">
              {(Object.keys(INSTRUMENT_PRESETS) as InstrumentPreset[]).map((preset) => {
                const info = INSTRUMENT_INFO[preset];
                const isSelected = settings.audio.instrument === preset;
                const isLoading = isChangingInstrument && isSelected;

                return (
                  <button
                    key={preset}
                    className={`instrument-card ${isSelected ? 'selected' : ''} ${isLoading ? 'loading' : ''}`}
                    onClick={() => handleInstrumentChange(preset)}
                    disabled={!settings.audio.enabled || isChangingInstrument}
                    title={info.description}
                  >
                    <span className="instrument-icon">{info.icon}</span>
                    <span className="instrument-name">{info.name}</span>
                    {isSelected && <span className="selected-check">✓</span>}
                    {isLoading && <span className="loading-spinner"></span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Oscillator Mode Info */}
        {!settings.audio.useSoundfonts && (
          <div className="info-box">
            <span className="info-icon">ℹ️</span>
            <span className="info-text">
              Using synthesized sounds. Enable "Realistic Instruments" for sampled instrument sounds.
            </span>
          </div>
        )}
      </section>

      {/* Display Section */}
      <section className="settings-section">
        <h3 className="section-title">
          <span className="section-icon">👁️</span>
          Display
        </h3>

        {/* Finger Labels */}
        <div className="setting-item">
          <div className="setting-label">
            <span className="setting-name">Finger Labels</span>
            <span className="setting-description">Show finger names on keyboard</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.display.showFingerLabels}
              onChange={(e) => setShowFingerLabels(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Note Names */}
        <div className="setting-item">
          <div className="setting-label">
            <span className="setting-name">Note Names</span>
            <span className="setting-description">Show musical note names</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.display.showNoteNames}
              onChange={(e) => setShowNoteNames(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </section>

      {/* Keyboard Layout Section */}
      <LayoutSettingsSection />

      {/* Training Section */}
      <section className="settings-section">
        <h3 className="section-title">
          <span className="section-icon">📚</span>
          Training
        </h3>

        {/* Items Per Learn Session */}
        <div className="setting-item">
          <div className="setting-label">
            <span className="setting-name">Items Per Learn Session</span>
            <span className="setting-description">
              Number of new items to learn at once (5-10)
            </span>
          </div>
          <div className="items-per-session-control">
            <input
              type="range"
              min="5"
              max="10"
              step="1"
              value={settings.training.itemsPerLearnSession}
              onChange={(e) => setItemsPerLearnSession(parseInt(e.target.value))}
              className="items-slider"
            />
            <span className="items-count">{settings.training.itemsPerLearnSession}</span>
          </div>
        </div>
      </section>

      {/* Educational Tips Section */}
      <section className="settings-section">
        <h3 className="section-title">
          <span className="section-icon">💡</span>
          Educational Tips
        </h3>

        <div className="setting-item">
          <div className="setting-label">
            <span className="setting-name">Show Learning Tips</span>
            <span className="setting-description">
              Display helpful explanations about learning techniques
            </span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={tipsState.tipsEnabled}
              onChange={(e) => setTipsEnabled(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <span className="setting-name">Reset Tips</span>
            <span className="setting-description">
              Show all educational tips again from the beginning
            </span>
          </div>
          <button className="reset-button" onClick={resetTips}>
            Reset Tips
          </button>
        </div>

        <div className="info-box">
          <span className="info-icon">ℹ️</span>
          <span className="info-text">
            Tips explain the science behind your learning journey: chunking, spaced repetition, and more.
          </span>
        </div>
      </section>

      {/* Learning Mode Section */}
      <section className="settings-section">
        <h3 className="section-title">
          <span className="section-icon">🗺️</span>
          Learning Mode
        </h3>

        <div className="setting-item">
          <div className="setting-label">
            <span className="setting-name">Current Mode</span>
            <span className="setting-description">
              Campaign Mode - Guided progression through chapters
            </span>
          </div>
          {/* Free Play mode switch hidden for now */}
        </div>

        {campaignState.mode === 'campaign' && (
          <div className="setting-item">
            <div className="setting-label">
              <span className="setting-name">Reset Campaign</span>
              <span className="setting-description">
                Start the campaign over from the beginning
              </span>
            </div>
            {!showResetConfirm ? (
              <button
                className="reset-button"
                onClick={() => setShowResetConfirm(true)}
                style={{ background: '#e53e3e' }}
              >
                Reset Progress
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="reset-button"
                  onClick={() => {
                    resetCampaign();
                    setShowResetConfirm(false);
                  }}
                  style={{ background: '#e53e3e' }}
                >
                  Confirm
                </button>
                <button
                  className="reset-button"
                  onClick={() => setShowResetConfirm(false)}
                  style={{ background: '#666' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Developer/Skip Ahead Section */}
      <section className="settings-section">
        <h3 className="section-title">
          <span className="section-icon">🔓</span>
          Skip Ahead
        </h3>

        <div className="info-box">
          <span className="info-icon">ℹ️</span>
          <span className="info-text">
            Skip to any chapter without completing the boss challenges. Useful for experienced users or testing.
          </span>
        </div>

        <div className="chapter-unlock-grid">
          {CHAPTERS.map((chapter) => {
            const completed = isChapterCompleted(chapter.id);
            return (
              <div key={chapter.id} className="chapter-unlock-item">
                <div className="chapter-unlock-info">
                  <span className="chapter-unlock-icon">{chapter.icon}</span>
                  <div className="chapter-unlock-text">
                    <span className="chapter-unlock-title">
                      Ch. {chapter.number}: {chapter.title}
                    </span>
                    <span className="chapter-unlock-status">
                      {completed ? 'Completed' : 'Not completed'}
                    </span>
                  </div>
                </div>
                <button
                  className={`unlock-button ${completed ? 'completed' : ''}`}
                  onClick={() => unlockChapter(chapter.id)}
                  disabled={completed}
                >
                  {completed ? '✓' : 'Unlock'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Reset Section */}
      <section className="settings-section">
        <h3 className="section-title">
          <span className="section-icon">🔄</span>
          Reset
        </h3>

        <div className="setting-item">
          <div className="setting-label">
            <span className="setting-name">Reset to Defaults</span>
            <span className="setting-description">Restore all settings to their default values</span>
          </div>
          <button className="reset-button" onClick={resetToDefaults}>
            Reset
          </button>
        </div>
      </section>
    </div>
  );
}
