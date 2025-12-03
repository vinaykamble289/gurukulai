/**
 * Spaced Repetition Algorithm (SM-2)
 * Implementation follows docs/ALGORITHMS.md Section 2.1
 */

import { logger } from '../utils/logger';

export interface SM2Result {
  interval: number; // Days until next review
  repetitions: number; // Number of successful repetitions
  easeFactor: number; // Ease factor (difficulty multiplier)
}

export class SpacedRepetitionAlgorithm {
  /**
   * Calculate next review interval using SM-2 algorithm
   * @param quality - Response quality (0-5)
   * @param repetitions - Current repetition count
   * @param easeFactor - Current ease factor
   * @param interval - Current interval in days
   * @returns Next review parameters
   */
  calculateNextReview(
    quality: number,
    repetitions: number = 0,
    easeFactor: number = 2.5,
    interval: number = 0
  ): SM2Result {
    logger.debug('Calculating next review', { quality, repetitions, easeFactor, interval });

    // Quality must be 0-5
    quality = Math.max(0, Math.min(5, quality));

    let newEaseFactor = easeFactor;
    let newRepetitions = repetitions;
    let newInterval = interval;

    // If quality < 3, reset repetitions
    if (quality < 3) {
      newRepetitions = 0;
      newInterval = 1;
    } else {
      // Calculate new ease factor
      newEaseFactor = Math.max(
        1.3,
        easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      );

      // Increment repetitions
      newRepetitions = repetitions + 1;

      // Calculate new interval
      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * newEaseFactor);
      }
    }

    const result = {
      interval: newInterval,
      repetitions: newRepetitions,
      easeFactor: newEaseFactor,
    };

    logger.debug('Next review calculated', result);
    return result;
  }

  /**
   * Convert understanding score (0-100) to SM-2 quality (0-5)
   */
  understandingToQuality(understandingScore: number): number {
    if (understandingScore >= 90) return 5; // Perfect
    if (understandingScore >= 80) return 4; // Good
    if (understandingScore >= 70) return 3; // Pass
    if (understandingScore >= 60) return 2; // Difficult
    if (understandingScore >= 50) return 1; // Very difficult
    return 0; // Failed
  }

  /**
   * Calculate next review date
   */
  getNextReviewDate(intervalDays: number): Date {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return nextDate;
  }
}

export const spacedRepetition = new SpacedRepetitionAlgorithm();
