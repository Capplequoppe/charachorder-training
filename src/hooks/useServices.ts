/**
 * React Hooks for Service Access
 *
 * Provides React Context-based access to application services.
 * Services are singleton instances managed by the ServiceContainer.
 */

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import {
  ServiceContainer,
  getServices,
  initializeServices,
  IAudioService,
  IColorService,
  ILearningService,
  IChordService,
  IProgressService,
  IInputService,
} from '../services';

/**
 * React Context for the service container.
 */
const ServiceContext = createContext<ServiceContainer | null>(null);

/**
 * Props for ServiceProvider component.
 */
interface ServiceProviderProps {
  children: React.ReactNode;
}

/**
 * Service Provider component.
 * Wraps the application to provide service access via context.
 */
export function ServiceProvider({ children }: ServiceProviderProps): React.ReactElement {
  const [isInitialized, setIsInitialized] = useState(false);

  const services = useMemo(() => getServices(), []);

  useEffect(() => {
    // Initialize async services
    initializeServices()
      .then(() => setIsInitialized(true))
      .catch((error) => {
        console.warn('Service initialization warning:', error);
        setIsInitialized(true); // Continue anyway, audio will init on user interaction
      });
  }, []);

  return React.createElement(
    ServiceContext.Provider,
    { value: services },
    children
  );
}

/**
 * Hook to access all services.
 * @throws Error if used outside of ServiceProvider
 */
export function useServices(): ServiceContainer {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return services;
}

/**
 * Hook to access the audio service.
 */
export function useAudio(): IAudioService {
  return useServices().audio;
}

/**
 * Hook to access the color service.
 */
export function useColor(): IColorService {
  return useServices().color;
}

/**
 * Hook to access the learning service.
 */
export function useLearning(): ILearningService {
  return useServices().learning;
}

/**
 * Hook to access the chord service.
 */
export function useChord(): IChordService {
  return useServices().chord;
}

/**
 * Hook to access the progress service.
 */
export function useProgress(): IProgressService {
  return useServices().progress;
}

/**
 * Hook to access the input service.
 */
export function useInput(): IInputService {
  return useServices().input;
}

/**
 * Hook for audio with auto-initialization on user interaction.
 * Returns audio service and a function to ensure it's initialized.
 */
export function useAudioWithInit(): {
  audio: IAudioService;
  ensureInitialized: () => Promise<void>;
} {
  const audio = useAudio();

  const ensureInitialized = async () => {
    if (!audio.isReady()) {
      await audio.initialize();
    }
  };

  return { audio, ensureInitialized };
}
