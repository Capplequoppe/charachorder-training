/**
 * CharaChorder Trainer Application
 *
 * Main application component with navigation and integrated services.
 * Supports both Campaign Mode (guided progression) and Free Play (full access).
 */

import { useState, useCallback, useEffect } from 'react';
import { CharacterLearning } from './components/CharacterLearning';
import { PowerChordLearning } from './components/PowerChordLearning';
import { QuizMode } from './components/QuizMode';
import { Settings } from './components/Settings';
import { ModeSelector, CampaignDashboard, UnlockNotification } from './components/campaign';
import {
  CampaignProvider,
  useCampaign,
  UnlockableFeature,
} from './campaign';
import type { TimeAttackConfig, SprintConfig } from './data/static/challengeConfig';
import type { SemanticCategory } from './data/static/semanticCategories';
import './App.css';

// // Free Play imports
// import { ChordLibrary } from './free-play/components/ChordLibrary';
// import { Practice } from './free-play/components/Practice';
// import { AnalyticsDashboard } from './free-play/components/analytics';
// import { AchievementGallery, AchievementNotification, ComboDisplay } from './free-play/components/gamification';
// import { CategoryBrowser, CategoryQuiz } from './free-play/components/learning';
// import {
//   ChallengeSelector,
//   TimeAttackChallenge,
//   SprintChallenge,
//   ChallengeResults,
// } from './free-play/components/challenges';
// import { SongsTab } from './free-play/components/songs';
// import { getAnalyticsService } from './free-play/services/AnalyticsService';
// import { getAchievementService, type AchievementUnlockEvent } from './free-play/services/AchievementService';
// import { useCombo } from './free-play/hooks/useCombo';
// import type { ChallengeResult } from './free-play/services/ChallengeService';

/**
 * Main navigation tabs.
 */
type Tab =
  | 'practice'
  | 'quiz'
  | 'challenges'
  | 'songs'
  | 'categories'
  | 'library'
  | 'keys'
  | 'powerchords'
  | 'analytics'
  | 'achievements'
  | 'settings';

/**
 * Challenge state management.
 */
type ChallengeState =
  | { type: 'selecting' }
  | { type: 'timeAttack'; config: TimeAttackConfig }
  | { type: 'sprint'; config: SprintConfig }
  | { type: 'results'; result: ChallengeResult; config: TimeAttackConfig | SprintConfig };

/**
 * Category state management.
 */
type CategoryState =
  | { type: 'browsing' }
  | { type: 'quiz'; category: SemanticCategory };

/**
 * Main App component that wraps everything with CampaignProvider.
 */
function App() {
  return (
    <CampaignProvider>
      <AppContent />
    </CampaignProvider>
  );
}

/**
 * Inner app content that uses campaign context.
 */
function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('practice');
  const [challengeState, setChallengeState] = useState<ChallengeState>({ type: 'selecting' });
  const [categoryState, setCategoryState] = useState<CategoryState>({ type: 'browsing' });
  const [unlockedAchievement, setUnlockedAchievement] = useState<AchievementUnlockEvent | null>(null);

  // Campaign context
  const { campaignState, setMode, isFeatureUnlocked, clearPendingUnlock } = useCampaign();

  // Get first pending unlock notification (if any)
  const pendingUnlock = campaignState.pendingUnlockNotifications[0] ?? null;

  // Get singleton services
  const analyticsService = getAnalyticsService();
  const achievementService = getAchievementService();

  // Use combo hook for combo state
  const { comboState } = useCombo({ enableAudio: true });

  // Subscribe to achievement unlocks
  useEffect(() => {
    const unsubscribe = achievementService.onAchievementUnlocked((event) => {
      setUnlockedAchievement(event);
    });
    return () => unsubscribe();
  }, [achievementService]);

  // Helper to check if a feature is accessible
  const canAccessFeature = useCallback(
    (feature: UnlockableFeature): boolean => {
      if (campaignState.mode === 'freeplay') return true;
      return isFeatureUnlocked(feature);
    },
    [campaignState.mode, isFeatureUnlocked]
  );

  // Challenge handlers
  const handleSelectTimeAttack = useCallback((config: TimeAttackConfig) => {
    setChallengeState({ type: 'timeAttack', config });
  }, []);

  const handleSelectSprint = useCallback((config: SprintConfig) => {
    setChallengeState({ type: 'sprint', config });
  }, []);

  const handleChallengeComplete = useCallback((result: ChallengeResult, config: TimeAttackConfig | SprintConfig) => {
    setChallengeState({ type: 'results', result, config });
    // Check achievements after challenge
    achievementService.checkAchievements();
  }, [achievementService]);

  const handleChallengeCancel = useCallback(() => {
    setChallengeState({ type: 'selecting' });
  }, []);

  const handleChallengeResultsClose = useCallback(() => {
    setChallengeState({ type: 'selecting' });
  }, []);

  // Category handlers
  const handleSelectCategory = useCallback((category: SemanticCategory) => {
    setCategoryState({ type: 'quiz', category });
  }, []);

  const handleCategoryQuizComplete = useCallback(() => {
    setCategoryState({ type: 'browsing' });
    // Check achievements after quiz
    achievementService.checkAchievements();
  }, [achievementService]);

  const handleCategoryQuizExit = useCallback(() => {
    setCategoryState({ type: 'browsing' });
  }, []);

  // Navigation handler for analytics
  const handleNavigate = useCallback((path: string) => {
    if (path.includes('practice')) {
      setActiveTab('practice');
    } else if (path.includes('quiz')) {
      setActiveTab('quiz');
    } else if (path.includes('challenge')) {
      setActiveTab('challenges');
    }
  }, []);

  // Dismiss achievement notification
  const handleDismissAchievement = useCallback(() => {
    setUnlockedAchievement(null);
  }, []);

  // Render challenge content based on state
  const renderChallenges = () => {
    switch (challengeState.type) {
      case 'selecting':
        return (
          <ChallengeSelector
            onSelectTimeAttack={handleSelectTimeAttack}
            onSelectSprint={handleSelectSprint}
          />
        );
      case 'timeAttack':
        return (
          <TimeAttackChallenge
            config={challengeState.config}
            onComplete={(result) => handleChallengeComplete(result, challengeState.config)}
            onCancel={handleChallengeCancel}
          />
        );
      case 'sprint':
        return (
          <SprintChallenge
            config={challengeState.config}
            onComplete={(result) => handleChallengeComplete(result, challengeState.config)}
            onCancel={handleChallengeCancel}
          />
        );
      case 'results':
        return (
          <ChallengeResults
            result={challengeState.result}
            onPlayAgain={() => {
              const config = challengeState.config;
              if ('duration' in config) {
                setChallengeState({ type: 'timeAttack', config: config as TimeAttackConfig });
              } else {
                setChallengeState({ type: 'sprint', config: config as SprintConfig });
              }
            }}
            onSelectDifferent={handleChallengeResultsClose}
            onClose={handleChallengeResultsClose}
          />
        );
    }
  };

  // Render category content based on state
  const renderCategories = () => {
    switch (categoryState.type) {
      case 'browsing':
        return (
          <CategoryBrowser
            onSelectCategory={handleSelectCategory}
            onStartPractice={handleSelectCategory}
          />
        );
      case 'quiz':
        return (
          <CategoryQuiz
            category={categoryState.category}
            onComplete={handleCategoryQuizComplete}
            onExit={handleCategoryQuizExit}
          />
        );
    }
  };

  // Show mode selector if no mode is chosen yet
  if (campaignState.mode === null) {
    return <ModeSelector onSelectMode={setMode} />;
  }

  // Campaign mode - show Campaign Dashboard
  if (campaignState.mode === 'campaign') {
    return (
      <>
        <CampaignDashboard onSwitchToFreePlay={() => setMode('freeplay')} />
        {/* Unlock Notification (shows when features are unlocked) */}
        {pendingUnlock && (
          <UnlockNotification
            feature={pendingUnlock}
            onDismiss={clearPendingUnlock}
          />
        )}
      </>
    );
  }

  // Free Play mode - show all tabs
  // Helper to render nav button with optional feature gating
  const renderNavButton = (
    tab: Tab,
    icon: string,
    label: string,
    feature?: UnlockableFeature,
    onClick?: () => void
  ) => {
    const isLocked = feature && !canAccessFeature(feature);

    return (
      <button
        key={tab}
        className={`nav-button ${activeTab === tab ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
        onClick={() => {
          if (isLocked) return;
          if (onClick) onClick();
          setActiveTab(tab);
        }}
        disabled={isLocked}
        title={isLocked ? `Complete campaign chapters to unlock ${label}` : label}
      >
        <span className="nav-icon">{isLocked ? '🔒' : icon}</span>
        {label}
      </button>
    );
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1 className="title">
          <span className="title-icon">🎹</span>
          CharaChorder Trainer
        </h1>
        <p className="subtitle">Learn chords with colors and sounds</p>
      </header>

      {/* Navigation */}
      <nav className="nav">
        {renderNavButton('practice', '📚', 'Learn')}
        {renderNavButton('quiz', '🎯', 'Quiz')}
        {renderNavButton('challenges', '⚡', 'Challenges', UnlockableFeature.CHALLENGES, () => {
          setChallengeState({ type: 'selecting' });
        })}
        {renderNavButton('songs', '🎵', 'Songs', UnlockableFeature.SONGS)}
        {renderNavButton('categories', '📂', 'Categories', UnlockableFeature.CATEGORIES, () => {
          setCategoryState({ type: 'browsing' });
        })}
        {renderNavButton('analytics', '📊', 'Progress', UnlockableFeature.ANALYTICS)}
        {renderNavButton('achievements', '🏆', 'Badges', UnlockableFeature.ACHIEVEMENTS)}
        {renderNavButton('library', '🔍', 'Library', UnlockableFeature.LIBRARY)}
        {renderNavButton('keys', '⌨️', 'Keys')}
        {renderNavButton('powerchords', '🎹', 'Power Chords')}
        {renderNavButton('settings', '⚙️', 'Settings')}
      </nav>

      {/* Combo Display (floating) */}
      <ComboDisplay comboState={comboState} />

      {/* Main content */}
      <main className="main">
        {activeTab === 'practice' && <Practice />}
        {activeTab === 'quiz' && <QuizMode />}
        {activeTab === 'challenges' && renderChallenges()}
        {activeTab === 'songs' && <SongsTab />}
        {activeTab === 'categories' && renderCategories()}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            analyticsService={analyticsService}
            onNavigate={handleNavigate}
          />
        )}
        {activeTab === 'achievements' && <AchievementGallery />}
        {activeTab === 'library' && <ChordLibrary />}
        {activeTab === 'keys' && <CharacterLearning />}
        {activeTab === 'powerchords' && <PowerChordLearning />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Achievement Notification */}
      {unlockedAchievement && (
        <AchievementNotification
          achievement={unlockedAchievement.achievement}
          onDismiss={handleDismissAchievement}
        />
      )}

      {/* Unlock Notification (shows when features are unlocked) */}
      {pendingUnlock && (
        <UnlockNotification
          feature={pendingUnlock}
          onDismiss={clearPendingUnlock}
        />
      )}

      {/* Footer */}
      <footer className="footer">
        <p>
          CharaChorder 2.1 Chord Trainer • Press keys together to create chords
        </p>
      </footer>
    </div>
  );
}

export default App;
