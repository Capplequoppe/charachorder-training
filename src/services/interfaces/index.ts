/**
 * Service Interfaces
 *
 * Extracted interfaces for dependency injection and testing.
 *
 * @module services/interfaces
 */

export type { ICampaignService, CampaignStateCallback } from './ICampaignService';

// Re-export from service files for convenience
export type { ITrainingSessionService, ItemFilter, SessionConfig } from '../TrainingSessionService';
