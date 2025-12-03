/**
 * Cognitive Load Monitoring
 * Implementation follows docs/ALGORITHMS.md Section 2.2
 */

import { logger } from '../utils/logger';

export interface CognitiveLoadFactors {
  responseTime: number; // Seconds
  questionDifficulty: number; // 1-10
  userMastery: number; // 0-100
  hintUsage: number; // 0-3
  consecutiveCorrect: number;
  sessionDuration: number; // Minutes
}

export class CognitiveLoadMonitor {
  // Thresholds from environment or defaults
  private readonly LOW_THRESHOLD = parseInt(process.env.COGNITIVE_LOAD_LOW || '40');
  private readonly OPTIMAL_MIN = parseInt(process.env.COGNITIVE_LOAD_OPTIMAL_MIN || '50');
  private readonly OPTIMAL_MAX = parseInt(process.env.COGNITIVE_LOAD_OPTIMAL_MAX || '75');
  private readonly HIGH_THRESHOLD = parseInt(process.env.COGNITIVE_LOAD_HIGH || '85');

  /**
   * Estimate cognitive load (0-100)
   * Based on multiple factors as per ALGORITHMS.md
   */
  estimateLoad(factors: CognitiveLoadFactors): number {
    logger.debug('Estimating cognitive load', factors);

    // Normalize factors to 0-1 scale
    const timeLoad = this.normalizeResponseTime(factors.responseTime, factors.questionDifficulty);
    const difficultyLoad = factors.questionDifficulty / 10;
    const masteryLoad = 1 - (factors.userMastery / 100);
    const hintLoad = factors.hintUsage / 3;
    const fatigueLoad = this.calculateFatigue(factors.sessionDuration);
    const performanceLoad = this.calculatePerformanceLoad(factors.consecutiveCorrect);

    // Weighted combination
    const cognitiveLoad = (
      timeLoad * 0.25 +
      difficultyLoad * 0.20 +
      masteryLoad * 0.20 +
      hintLoad * 0.15 +
      fatigueLoad * 0.10 +
      performanceLoad * 0.10
    ) * 100;

    const finalLoad = Math.max(0, Math.min(100, cognitiveLoad));
    
    logger.debug('Cognitive load estimated', {
      load: finalLoad,
      zone: this.getLoadZone(finalLoad)
    });

    return Math.round(finalLoad);
  }

  /**
   * Normalize response time based on expected time for difficulty
   */
  private normalizeResponseTime(responseTime: number, difficulty: number): number {
    // Expected time increases with difficulty (30s base + 10s per difficulty level)
    const expectedTime = 30 + (difficulty * 10);
    const ratio = responseTime / expectedTime;

    // Sigmoid function to normalize
    return 1 / (1 + Math.exp(-2 * (ratio - 1)));
  }

  /**
   * Calculate fatigue based on session duration
   */
  private calculateFatigue(durationMinutes: number): number {
    // Fatigue increases after 20 minutes
    if (durationMinutes <= 20) return 0;
    
    const excessMinutes = durationMinutes - 20;
    return Math.min(1, excessMinutes / 40); // Max fatigue at 60 minutes
  }

  /**
   * Calculate load based on recent performance
   */
  private calculatePerformanceLoad(consecutiveCorrect: number): number {
    // More consecutive correct = lower load
    return Math.max(0, 1 - (consecutiveCorrect * 0.2));
  }

  /**
   * Get cognitive load zone
   */
  getLoadZone(load: number): 'low' | 'optimal' | 'high' | 'overload' {
    if (load < this.LOW_THRESHOLD) return 'low';
    if (load >= this.OPTIMAL_MIN && load <= this.OPTIMAL_MAX) return 'optimal';
    if (load > this.HIGH_THRESHOLD) return 'overload';
    return 'high';
  }

  /**
   * Determine if difficulty should be adjusted
   */
  shouldAdjustDifficulty(load: number): { adjust: boolean; direction: 'increase' | 'decrease' | 'maintain' } {
    const zone = this.getLoadZone(load);

    if (zone === 'low') {
      return { adjust: true, direction: 'increase' };
    } else if (zone === 'overload') {
      return { adjust: true, direction: 'decrease' };
    } else {
      return { adjust: false, direction: 'maintain' };
    }
  }
}

export const cognitiveLoadMonitor = new CognitiveLoadMonitor();
