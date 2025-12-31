/**
 * CharaChorder Trainer Application
 *
 * Main application component with Campaign Mode progression.
 */

import { CampaignProvider, useCampaign } from './campaign';
import { TipsProvider, useTips, TipModal } from './tips';
import { ModeSelector } from './components/ui/organisms/ModeSelector';
import { CampaignDashboard } from './components/features/campaign/CampaignDashboard';
import { UnlockNotification } from './components/ui/molecules/UnlockNotification';
import './App.css';

/**
 * Main App component that wraps everything with CampaignProvider.
 */
function App() {
  return (
    <CampaignProvider>
      <TipsProvider>
        <AppContent />
      </TipsProvider>
    </CampaignProvider>
  );
}

/**
 * Inner app content that uses campaign context.
 */
function AppContent() {
  // Campaign context
  const { campaignState, setMode, clearPendingUnlock } = useCampaign();

  // Tips context
  const { currentTip, dismissTip } = useTips();

  // Get first pending unlock notification (if any)
  const pendingUnlock = campaignState.pendingUnlockNotifications[0] ?? null;

  // Show mode selector if no mode is chosen yet
  if (campaignState.mode === null) {
    return <ModeSelector onSelectMode={setMode} />;
  }

  // Campaign mode - show Campaign Dashboard
  return (
    <>
      <CampaignDashboard />
      {/* Educational Tip Modal */}
      {currentTip && (
        <TipModal tip={currentTip} onDismiss={dismissTip} />
      )}
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

export default App;
