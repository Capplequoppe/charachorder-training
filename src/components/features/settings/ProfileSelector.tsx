/**
 * Profile Selector Component
 *
 * Displays a grid of layout profiles for selection.
 * Includes default layout option and create new button.
 */

import { useMemo } from 'react';
import type { LayoutProfile } from '../../../domain';
import { useKeyboardNavigation } from '../../../hooks';

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
  // Build navigation items for keyboard navigation
  const navigationItems = useMemo(() => {
    const items = [
      { id: 'default', onActivate: () => onSelect(null) },
      ...profiles.map((profile) => ({
        id: profile.id,
        onActivate: () => onSelect(profile.id),
      })),
      { id: 'create', onActivate: onCreate },
    ];
    return items;
  }, [profiles, onSelect, onCreate]);

  // Keyboard navigation hook with grid layout
  const { getItemProps } = useKeyboardNavigation({
    areaId: 'profile-selector',
    layout: 'grid',
    gridColumns: 3,
    items: navigationItems,
  });

  return (
    <div className="profile-selector">
      <div className="profile-selector__grid" role="listbox" aria-label="Layout profiles">
        {/* Default Layout Card */}
        <button
          className={`profile-card profile-card--default ${
            activeProfileId === null ? 'profile-card--active' : ''
          } ${getItemProps('default', 'keyboard-focus--card').className}`}
          onClick={getItemProps('default').onClick}
          data-keyboard-focus={getItemProps('default')['data-keyboard-focus']}
          type="button"
          aria-selected={activeProfileId === null}
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
          const itemProps = getItemProps(profile.id, 'keyboard-focus--card');
          return (
            <button
              key={profile.id}
              className={`profile-card ${isActive ? 'profile-card--active' : ''} ${itemProps.className}`}
              onClick={itemProps.onClick}
              data-keyboard-focus={itemProps['data-keyboard-focus']}
              type="button"
              aria-selected={isActive}
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
          className={`profile-card profile-card--add ${getItemProps('create', 'keyboard-focus--card').className}`}
          onClick={getItemProps('create').onClick}
          data-keyboard-focus={getItemProps('create')['data-keyboard-focus']}
          type="button"
        >
          <span className="profile-card__add-icon">+</span>
          <span>New Layout</span>
        </button>
      </div>
    </div>
  );
}
