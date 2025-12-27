/**
 * Tip Modal Component
 *
 * Educational modal that displays learning tips to users.
 * Follows the same pattern as UnlockNotification for consistency.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { type TipDefinition } from './types';
import './TipModal.css';

interface TipModalProps {
  /** The tip to display */
  tip: TipDefinition;
  /** Callback when modal is dismissed */
  onDismiss: () => void;
}

/**
 * Modal component for displaying educational tips.
 */
export function TipModal({ tip, onDismiss }: TipModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus any input on the page after dismissing the modal
  const focusInputAfterDismiss = useCallback(() => {
    // Small delay to allow the modal to unmount first
    setTimeout(() => {
      // Look for common input elements that should receive focus
      const inputSelectors = [
        '.chord-input',
        '.finger-lesson input',
        'input[type="text"]:not([disabled])',
        'input:not([type="hidden"]):not([disabled])',
      ];

      for (const selector of inputSelectors) {
        const input = document.querySelector<HTMLInputElement>(selector);
        if (input && input.offsetParent !== null) { // Check if visible
          input.focus();
          return;
        }
      }
    }, 50);
  }, []);

  // Wrapped dismiss that also focuses input
  const handleDismiss = useCallback(() => {
    onDismiss();
    focusInputAfterDismiss();
  }, [onDismiss, focusInputAfterDismiss]);

  // Handle click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleDismiss();
      }
    };

    // Handle Escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleDismiss();
      }
    };

    // Add listeners after a small delay to prevent immediate dismiss
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDismiss]);

  return (
    <div className="tip-modal-overlay">
      <div className="tip-modal" ref={modalRef}>
        <button
          className="tip-modal-close"
          onClick={handleDismiss}
          aria-label="Close tip"
        >
          &times;
        </button>

        <div className="tip-modal-header">
          <span className="tip-modal-icon">{tip.icon}</span>
          <h2 className="tip-modal-title">{tip.title}</h2>
        </div>

        <p className="tip-modal-content">{tip.content}</p>

        {tip.keyPoints.length > 0 && (
          <div className="tip-modal-keypoints">
            <span className="tip-modal-keypoints-label">Key Points:</span>
            <ul className="tip-modal-keypoints-list">
              {tip.keyPoints.map((point, index) => (
                <li key={index} className="tip-modal-keypoint">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button className="tip-modal-button" onClick={handleDismiss}>
          Got it!
        </button>
      </div>
    </div>
  );
}
