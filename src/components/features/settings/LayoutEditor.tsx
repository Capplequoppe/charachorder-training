/**
 * Layout Editor Component
 *
 * Full editor for a layout profile.
 * Includes name editing, mapping table, and action buttons.
 */

import { useState, useCallback } from 'react';
import { CharacterMapping } from '../../../domain';
import type { LayoutProfile } from '../../../domain';
import { LayoutMappingTable } from './LayoutMappingTable';

interface LayoutEditorProps {
  /** The profile being edited */
  profile: LayoutProfile;
  /** Called when the profile is saved */
  onSave: (profile: LayoutProfile) => void;
  /** Called when editing is cancelled/closed */
  onClose: () => void;
  /** Called when the profile is deleted */
  onDelete?: () => void;
}

/**
 * Layout editor component.
 */
export function LayoutEditor({
  profile,
  onSave,
  onClose,
  onDelete,
}: LayoutEditorProps) {
  const [name, setName] = useState(profile.name);
  const [mappings, setMappings] = useState<CharacterMapping[]>([
    ...profile.mappings,
  ]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if there are unsaved changes
  const hasChanges =
    name !== profile.name ||
    mappings.length !== profile.mappings.length ||
    mappings.some((m, i) => !m.equals(profile.mappings[i]));

  // Handle save using domain entity's immutable methods
  const handleSave = useCallback(() => {
    const trimmedName = name.trim() || 'Unnamed Layout';
    const updatedProfile = profile.withName(trimmedName).withMappings(mappings);
    onSave(updatedProfile);
  }, [profile, name, mappings, onSave]);

  // Handle reset all mappings
  const handleResetAll = useCallback(() => {
    setMappings([]);
  }, []);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete();
    }
  }, [onDelete]);

  return (
    <div className="layout-editor">
      <div className="layout-editor__header">
        <div className="layout-editor__title-section">
          <input
            type="text"
            className="layout-editor__name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Layout name..."
          />
          <div className="layout-editor__subtitle">
            {mappings.length} custom mapping{mappings.length !== 1 ? 's' : ''}
            {hasChanges && ' • Unsaved changes'}
          </div>
        </div>

        <div className="layout-editor__actions">
          <button
            type="button"
            className="layout-editor__action-btn layout-editor__action-btn--primary"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save
          </button>
          <button
            type="button"
            className="layout-editor__action-btn layout-editor__action-btn--secondary"
            onClick={handleResetAll}
            disabled={mappings.length === 0}
          >
            Reset All
          </button>
          {onDelete && !showDeleteConfirm && (
            <button
              type="button"
              className="layout-editor__action-btn layout-editor__action-btn--danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </button>
          )}
          {showDeleteConfirm && (
            <>
              <button
                type="button"
                className="layout-editor__action-btn layout-editor__action-btn--danger"
                onClick={handleDelete}
              >
                Confirm Delete
              </button>
              <button
                type="button"
                className="layout-editor__action-btn layout-editor__action-btn--secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <LayoutMappingTable mappings={mappings} onChange={setMappings} />
    </div>
  );
}
