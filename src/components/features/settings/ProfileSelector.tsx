/**
 * Profile Selector Component
 *
 * Displays a grid of layout profiles for selection.
 * Includes default layout option and create new button.
 */

import type { LayoutProfile } from '../../../domain';

interface ProfileSelectorProps {
  /** All available profiles */
  profiles: LayoutProfile[];
  /** Currently active profile ID (null = default) */
  activeProfileId: string | null;
  /** Called when a profile is selected */
  onSelect: (profileId: string | null) => void;
  /** Called when creating a new profile */
  onCreate: () => void;
}

/**
 * Profile selector with grid of profile cards.
 */
export function ProfileSelector({
  profiles,
  activeProfileId,
  onSelect,
  onCreate,
}: ProfileSelectorProps) {
  return (
    <div className="profile-selector">
      <div className="profile-selector__grid">
        {/* Default Layout Card */}
        <button
          className={`profile-card profile-card--default ${
            activeProfileId === null ? 'profile-card--active' : ''
          }`}
          onClick={() => onSelect(null)}
          type="button"
        >
          <span className="profile-card__name">
            Default Layout
            {activeProfileId === null && (
              <span className="profile-card__check">✓</span>
            )}
          </span>
          <span className="profile-card__info">CharaChorder 2.1</span>
        </button>

        {/* Custom Profile Cards */}
        {profiles.map((profile) => {
          const isActive = activeProfileId === profile.id;
          return (
            <button
              key={profile.id}
              className={`profile-card ${isActive ? 'profile-card--active' : ''}`}
              onClick={() => onSelect(profile.id)}
              type="button"
            >
              <span className="profile-card__name">
                {profile.name}
                {isActive && <span className="profile-card__check">✓</span>}
              </span>
              <span className="profile-card__info">
                {profile.mappings.length} custom mapping
                {profile.mappings.length !== 1 ? 's' : ''}
              </span>
            </button>
          );
        })}

        {/* Create New Card */}
        <button
          className="profile-card profile-card--add"
          onClick={onCreate}
          type="button"
        >
          <span className="profile-card__add-icon">+</span>
          <span>New Layout</span>
        </button>
      </div>
    </div>
  );
}
