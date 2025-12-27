/**
 * Service Container
 *
 * Provides dependency injection for all application services.
 * Uses singleton pattern with lazy initialization.
 */

import { createRepositories, type Repositories } from '../data';

import { AudioService, type IAudioService } from './AudioService';
import { ColorService, type IColorService } from './ColorService';
import { LearningService, type ILearningService } from './LearningService';
import { ChordService, type IChordService } from './ChordService';
import { ProgressService, type IProgressService } from './ProgressService';
import { InputService, type IInputService } from './InputService';
import { QuizService, type IQuizService } from './QuizService';
import { CampaignServiceImpl, setRepositoriesGetter } from '../campaign/CampaignService';
import { TrainingSessionService, type ITrainingSessionService } from './TrainingSessionService';
import type { ICampaignService } from './interfaces';

/**
 * Container holding all application services.
 */
export interface ServiceContainer {
  audio: IAudioService;
  color: IColorService;
  learning: ILearningService;
  chord: IChordService;
  progress: IProgressService;
  input: IInputService;
  quiz: IQuizService;
  campaign: ICampaignService;
  trainingSession: ITrainingSessionService;
}

/**
 * Singleton container instance.
 */
let container: ServiceContainer | null = null;

/**
 * Singleton repositories instance.
 */
let repositories: Repositories | null = null;

/**
 * Gets or creates the service container.
 * Services are lazily initialized on first access.
 */
export function getServices(): ServiceContainer {
  if (!container) {
    repositories = createRepositories();

    // Set up repository getter for legacy CampaignService singleton
    setRepositoriesGetter(() => repositories!);

    // Create learning service first (needed by progress service)
    const learningService = new LearningService(repositories.progress);

    container = {
      audio: new AudioService(repositories.fingers, repositories.characters),
      color: new ColorService(repositories.fingers, repositories.characters),
      learning: learningService,
      chord: new ChordService(
        repositories.characters,
        repositories.words,
        repositories.fingers
      ),
      progress: new ProgressService(repositories.progress, learningService, repositories.characters),
      input: new InputService(repositories.characters, repositories.fingers),
      quiz: new QuizService(repositories.progress, repositories.characters),
      campaign: new CampaignServiceImpl({ repositories }),
      trainingSession: new TrainingSessionService({ repositories }),
    };
  }

  return container;
}

/**
 * Gets the repositories used by services.
 * Useful for direct data access when needed.
 */
export function getServiceRepositories(): Repositories {
  if (!repositories) {
    getServices(); // Initialize if not already done
  }
  return repositories!;
}

/**
 * Sets custom services (for testing).
 * @param services Custom service implementations
 */
export function setServices(services: ServiceContainer): void {
  container = services;
}

/**
 * Resets the service container (for testing).
 */
export function resetServices(): void {
  container = null;
  repositories = null;
}

/**
 * Initializes async services.
 * Call this during app startup.
 */
export async function initializeServices(): Promise<void> {
  const services = getServices();

  // Initialize audio service (requires user interaction context)
  try {
    await services.audio.initialize();
  } catch (error) {
    console.warn('Audio initialization deferred (requires user interaction):', error);
  }
}
