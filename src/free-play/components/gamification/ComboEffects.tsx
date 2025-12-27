/**
 * Combo Effects Component
 *
 * Handles visual effects for combo events: particles, screen shake, glow overlay.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { type ComboState } from '@/free-play/services/ComboService';
import { spawnParticles, spawnConfetti, spawnStars } from '@/utils/particles';
import './gamification.css';

export interface ComboEffectsProps {
  comboState: ComboState;
  enableParticles?: boolean;
  enableScreenShake?: boolean;
  enableGlow?: boolean;
}

export function ComboEffects({
  comboState,
  enableParticles = true,
  enableScreenShake = true,
  enableGlow = true,
}: ComboEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentTier, justLeveledUp, justBrokeStreak, brokenStreak } = comboState;

  // Trigger particle effects on level up
  useEffect(() => {
    if (!justLeveledUp || !enableParticles || currentTier.particleCount === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Different effects based on tier
    if (currentTier.minStreak >= 50) {
      // Legendary tier: confetti explosion
      spawnConfetti(canvas, currentTier.particleCount, [
        currentTier.color,
        '#ffd700',
        '#ff6b6b',
        '#4ecdc4',
        '#a29bfe',
      ]);
    } else if (currentTier.minStreak >= 25) {
      // Amazing tier: star burst
      spawnStars(canvas, Math.floor(currentTier.particleCount / 2), currentTier.color);
    } else {
      // Standard particle burst
      spawnParticles(canvas, {
        count: currentTier.particleCount,
        color: currentTier.color,
        origin: 'center',
        minSpeed: 3,
        maxSpeed: 12,
        gravity: 0.15,
      });
    }
  }, [justLeveledUp, currentTier, enableParticles]);

  // Screen shake effect
  useEffect(() => {
    if (!justLeveledUp || !enableScreenShake || !currentTier.screenShake) return;

    document.body.classList.add('screen-shake');

    const timeout = setTimeout(() => {
      document.body.classList.remove('screen-shake');
    }, 200);

    return () => {
      clearTimeout(timeout);
      document.body.classList.remove('screen-shake');
    };
  }, [justLeveledUp, currentTier.screenShake, enableScreenShake]);

  // Broken streak effect
  useEffect(() => {
    if (!justBrokeStreak || brokenStreak < 5) return;

    // Flash effect for broken streak
    document.body.classList.add('streak-break-flash');

    const timeout = setTimeout(() => {
      document.body.classList.remove('streak-break-flash');
    }, 300);

    return () => {
      clearTimeout(timeout);
      document.body.classList.remove('streak-break-flash');
    };
  }, [justBrokeStreak, brokenStreak]);

  return (
    <>
      {/* Particle canvas */}
      {enableParticles && (
        <canvas
          ref={canvasRef}
          className="combo-particles"
          aria-hidden="true"
        />
      )}

      {/* Glow overlay */}
      {enableGlow && currentTier.glowIntensity > 0 && (
        <div
          className="combo-glow-overlay"
          style={{
            opacity: currentTier.glowIntensity * 0.15,
            backgroundColor: currentTier.color,
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
}

// ==================== Standalone Effect Triggers ====================

export interface ParticleBurstProps {
  trigger: boolean;
  count?: number;
  color?: string;
  onComplete?: () => void;
}

export function ParticleBurst({
  trigger,
  count = 30,
  color = '#4da6ff',
  onComplete,
}: ParticleBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevTriggerRef = useRef(trigger);

  useEffect(() => {
    // Only trigger on false -> true transition
    if (trigger && !prevTriggerRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        spawnParticles(canvas, {
          count,
          color,
          origin: 'center',
        });

        // Estimate animation duration
        if (onComplete) {
          setTimeout(onComplete, 1500);
        }
      }
    }
    prevTriggerRef.current = trigger;
  }, [trigger, count, color, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="combo-particles"
      aria-hidden="true"
    />
  );
}

// ==================== Screen Effects Hook ====================

export function useScreenEffects() {
  const shake = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    const className = `screen-shake-${intensity}`;
    document.body.classList.add(className);

    setTimeout(() => {
      document.body.classList.remove(className);
    }, intensity === 'heavy' ? 300 : intensity === 'medium' ? 200 : 100);
  }, []);

  const flash = useCallback((color: string = '#fff', duration: number = 100) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: ${color};
      pointer-events: none;
      z-index: 9999;
      opacity: 0.3;
      transition: opacity ${duration}ms ease-out;
    `;
    document.body.appendChild(overlay);

    // Trigger fade out
    requestAnimationFrame(() => {
      overlay.style.opacity = '0';
    });

    setTimeout(() => {
      overlay.remove();
    }, duration);
  }, []);

  return { shake, flash };
}
