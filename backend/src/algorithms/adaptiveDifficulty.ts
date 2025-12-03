/**
 * Adaptive Difficulty Algorithm
 * Implementation follows docs/ALGORITHMS.md Section 2.3
 * Uses Elo-like rating system
 */

import { logger } from '../utils/logger';

export interface DifficultyAdjustment {
  newDifficulty: number;
  change: number;
  reason: string;
}

export class AdaptiveDifficultyEngine {
  private readonly K_FACTOR = 32; // Sensitivity of rating changes
  private readonly MIN_DIFFICULTY = 1;
  private readonly MAX_DIFFICULTY = 10;

  /**
   * Calculate new difficulty based on performance
   * Uses Elo-like algorithm as specified in ALGORITHMS.md
   */
  adjustDifficulty(
    currentDifficulty: number,
    understandingScore: number,
    cognitiveLoad: number,
    responseTime: number,
    expectedTime: number
  ): DifficultyAdjustment {
    logger.debug('Adjusting difficulty', {
      currentDifficulty,
      understandingScore,
      cognitiveLoad,
    });

    // Calculate expected performance (0-1)
    const expectedPerformance = this.calculateExpectedPerformance(currentDifficulty);

    // Calculate actual performance (0-1)
    const actualPerformance = this.calculateActualPerformance(
      understandingScore,
      cognitiveLoad,
      responseTime,
      expectedTime
    );

    // Calculate difficulty change using Elo formula
    const performanceDiff = actualPerformance - expectedPerformance;
    const difficultyChange = (this.K_FACTOR / 10) * performanceDiff;

    // Apply change with bounds
    let newDifficulty = currentDifficulty + difficultyChange;
    newDifficulty = Math.max(this.MIN_DIFFICULTY, Math.min(this.MAX_DIFFICULTY, newDifficulty));
    newDifficulty = Math.round(newDifficulty * 10) / 10; // Round to 1 decimal

    // Determine reason
    const reason = this.getDifficultyChangeReason(
      difficultyChange,
      understandingScore,
      cognitiveLoad
    );

    const result = {
      newDifficulty,
      change: newDifficulty - currentDifficulty,
      reason,
    };

    logger.info('Difficulty adjusted', result);
    return result;
  }

  /**
   * Calculate expected performance for given difficulty
   */
  private calculateExpectedPerformance(difficulty: number): number {
    // Normalize difficulty to 0-1 scale
    const normalizedDifficulty = (difficulty - this.MIN_DIFFICULTY) / 
                                 (this.MAX_DIFFICULTY - this.MIN_DIFFICULTY);
    
    // Expected performance decreases with difficulty
    return 1 - (normalizedDifficulty * 0.5); // Range: 0.5 to 1.0
  }

  /**
   * Calculate actual performance from multiple factors
   */
  private calculateActualPerformance(
    understandingScore: number,
    cognitiveLoad: number,
    responseTime: number,
    expectedTime: number
  ): number {
    // Normalize understanding score (0-100 to 0-1)
    const understandingFactor = understandingScore / 100;

    // Cognitive load factor (lower load = better performance)
    const cognitiveLoadFactor = 1 - (cognitiveLoad / 100);

    // Time efficiency factor
    const timeEfficiency = Math.min(1, expectedTime / responseTime);

    // Weighted combination
    const performance = (
      understandingFactor * 0.5 +
      cognitiveLoadFactor * 0.3 +
      timeEfficiency * 0.2
    );

    return Math.max(0, Math.min(1, performance));
  }

  /**
   * Get human-readable reason for difficulty change
   */
  private getDifficultyChangeReason(
    change: number,
    understandingScore: number,
    cognitiveLoad: number
  ): string {
    if (Math.abs(change) < 0.1) {
      return 'Performance matches current difficulty level';
    }

    if (change > 0) {
      if (understandingScore >= 85 && cognitiveLoad < 60) {
        return 'Excellent performance with low cognitive load - increasing challenge';
      } else if (understandingScore >= 75) {
        return 'Good understanding - gradually increasing difficulty';
      } else {
        return 'Slight increase to maintain optimal challenge';
      }
    } else {
      if (cognitiveLoad > 85) {
        return 'High cognitive load detected - reducing difficulty';
      } else if (understandingScore < 60) {
        return 'Low understanding - decreasing difficulty for better learning';
      } else {
        return 'Slight decrease to optimize learning zone';
      }
    }
  }

  /**
   * Suggest optimal difficulty for new topic based on user history
   */
  suggestInitialDifficulty(
    userLevel: number,
    topicMastery: number,
    averagePerformance: number
  ): number {
    // Base difficulty on user level (1-10 scale)
    let difficulty = Math.min(10, Math.max(1, userLevel / 2));

    // Adjust for topic mastery
    if (topicMastery > 0) {
      difficulty += (topicMastery / 100) * 2;
    }

    // Adjust for average performance
    if (averagePerformance > 80) {
      difficulty += 1;
    } else if (averagePerformance < 60) {
      difficulty -= 1;
    }

    // Ensure within bounds
    difficulty = Math.max(this.MIN_DIFFICULTY, Math.min(this.MAX_DIFFICULTY, difficulty));

    logger.info('Initial difficulty suggested', {
      userLevel,
      topicMastery,
      averagePerformance,
      suggestedDifficulty: difficulty,
    });

    return Math.round(difficulty);
  }
}

export const adaptiveDifficultyEngine = new AdaptiveDifficultyEngine();
