/**
 * Layout Settings Section Component
 *
 * Main settings section for managing custom keyboard layouts.
 * Combines profile selector and layout editor.
 */

import { useState, useCallback } from 'react';
import { useLayoutContext } from '../../../hooks/LayoutContext';
import { ProfileSelector } from './ProfileSelector';
import { LayoutEditor } from './LayoutEditor';
import type { LayoutProfile } from '../../../domain';
import './layoutSettings.css';

/**
 * Layout settings section for the Settings page.
 */
export function LayoutSettingsSection() {
  const {
    profiles,
    activeProfile,
    setActiveProfile,
    createProfile,
    updateProfile,
    deleteProfile,
  } = useLayoutContext();

  // Track which profile is being edited (may differ from active)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // Get the profile being edited
  const editingProfile = editingProfileId
    ? profiles.find((p) => p.id === editingProfileId) ?? null
    : null;

  // Handle profile selection
  const handleSelectProfile = useCallback(
    (profileId: string | null) => {
      setActiveProfile(profileId);
      // Also open editor for custom profiles
      setEditingProfileId(profileId);
    },
    [setActiveProfile]
  );

  // Handle creating a new profile
  const handleCreateProfile = useCallback(() => {
    const profile = createProfile('New Layout');
    setEditingProfileId(profile.id);
    // Optionally activate it immediately
    setActiveProfile(profile.id);
  }, [createProfile, setActiveProfile]);

  // Handle saving a profile
  const handleSaveProfile = useCallback(
    (profile: LayoutProfile) => {
      updateProfile(profile);
    },
    [updateProfile]
  );

  // Handle closing the editor
  const handleCloseEditor = useCallback(() => {
    setEditingProfileId(null);
  }, []);

  // Handle deleting a profile
  const handleDeleteProfile = useCallback(() => {
    if (editingProfileId) {
      deleteProfile(editingProfileId);
      setEditingProfileId(null);
    }
  }, [editingProfileId, deleteProfile]);

  return (
    <section className="settings-section">
      <h3 className="section-title">
        <span className="section-icon">⌨️</span>
        Keyboard Layout
      </h3>

      <div className="info-box" style={{ marginTop: 0, marginBottom: 16 }}>
        <span className="info-icon">ℹ️</span>
        <span className="info-text">
          Customize your character mappings to match your CharaChorder configuration.
          Missing characters will fall back to the default layout.
        </span>
      </div>

      <ProfileSelector
        profiles={profiles}
        activeProfileId={activeProfile?.id ?? null}
        onSelect={handleSelectProfile}
        onCreate={handleCreateProfile}
      />

      {editingProfile && (
        <LayoutEditor
          profile={editingProfile}
          onSave={handleSaveProfile}
          onClose={handleCloseEditor}
          onDelete={handleDeleteProfile}
        />
      )}

      {!editingProfile && profiles.length === 0 && (
        <div className="layout-empty">
          <div className="layout-empty__icon">⌨️</div>
          <div className="layout-empty__text">No custom layouts yet</div>
          <div className="layout-empty__hint">
            Click "New Layout" to create your first custom keyboard layout
          </div>
        </div>
      )}
    </section>
  );
}
