/**
 * Time estimation utilities for programming-friendly time handling
 */

export interface EstimatedReadingTime {
  min: number;
  max: number;
  unit: 'minutes' | 'hours' | 'seconds';
  complexity: 'low' | 'medium' | 'high';
}

export interface DocumentAge {
  value: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
}

/**
 * Convert estimated reading time to minutes for calculations
 */
export function toMinutes(time: EstimatedReadingTime): { min: number; max: number } {
  const multiplier = time.unit === 'hours' ? 60 : time.unit === 'seconds' ? 1/60 : 1;
  return {
    min: time.min * multiplier,
    max: time.max * multiplier
  };
}

/**
 * Get average reading time in minutes
 */
export function getAverageMinutes(time: EstimatedReadingTime): number {
  const { min, max } = toMinutes(time);
  return (min + max) / 2;
}

/**
 * Compare two reading times
 */
export function compareReadingTimes(time1: EstimatedReadingTime, time2: EstimatedReadingTime): number {
  const avg1 = getAverageMinutes(time1);
  const avg2 = getAverageMinutes(time2);
  return avg1 - avg2;
}

/**
 * Check if reading time fits within budget
 */
export function fitsInTimeBudget(time: EstimatedReadingTime, budgetMinutes: number): boolean {
  const { max } = toMinutes(time);
  return max <= budgetMinutes;
}

/**
 * Format reading time for display
 */
export function formatReadingTime(time: EstimatedReadingTime, locale: 'ko' | 'en' | 'ja' = 'ko'): string {
  const unitLabels = {
    ko: { minutes: '분', hours: '시간', seconds: '초' },
    en: { minutes: 'min', hours: 'hr', seconds: 'sec' },
    ja: { minutes: '分', hours: '時間', seconds: '秒' }
  };
  
  const unit = unitLabels[locale][time.unit];
  
  if (time.min === time.max) {
    return `${time.min}${unit}`;
  }
  return `${time.min}-${time.max}${unit}`;
}

/**
 * Calculate total estimated time for multiple documents
 */
export function calculateTotalTime(times: EstimatedReadingTime[]): EstimatedReadingTime {
  const totalMin = times.reduce((sum, time) => sum + toMinutes(time).min, 0);
  const totalMax = times.reduce((sum, time) => sum + toMinutes(time).max, 0);
  
  return {
    min: Math.round(totalMin),
    max: Math.round(totalMax),
    unit: 'minutes',
    complexity: times.some(t => t.complexity === 'high') ? 'high' : 
                times.some(t => t.complexity === 'medium') ? 'medium' : 'low'
  };
}

/**
 * Convert document age to days for calculations
 */
export function toDays(age: DocumentAge): number {
  const multipliers = {
    days: 1,
    weeks: 7,
    months: 30,
    years: 365
  };
  return age.value * multipliers[age.unit];
}

/**
 * Check if document is too old based on age limit
 */
export function isDocumentTooOld(documentDate: Date, ageLimit: DocumentAge): boolean {
  const ageLimitDays = toDays(ageLimit);
  const documentAgeDays = (Date.now() - documentDate.getTime()) / (1000 * 60 * 60 * 24);
  return documentAgeDays > ageLimitDays;
}

/**
 * Parse legacy time strings to structured format
 */
export function parseLegacyTimeString(timeString: string): EstimatedReadingTime | null {
  // Parse patterns like "5-15분", "30-60분", "5-10분"
  const match = timeString.match(/^(\d+)-(\d+)분$/);
  if (match) {
    return {
      min: parseInt(match[1], 10),
      max: parseInt(match[2], 10),
      unit: 'minutes',
      complexity: parseInt(match[2], 10) > 30 ? 'high' : parseInt(match[2], 10) > 15 ? 'medium' : 'low'
    };
  }
  
  // Parse single time like "10분"
  const singleMatch = timeString.match(/^(\d+)분$/);
  if (singleMatch) {
    const value = parseInt(singleMatch[1], 10);
    return {
      min: value,
      max: value,
      unit: 'minutes',
      complexity: value > 30 ? 'high' : value > 15 ? 'medium' : 'low'
    };
  }
  
  return null;
}

/**
 * Estimate reading time based on character count and complexity
 */
export function estimateReadingTimeFromContent(
  characterCount: number, 
  complexity: 'low' | 'medium' | 'high' = 'medium'
): EstimatedReadingTime {
  // Korean reading speed: ~150-250 characters per minute
  const baseSpeed = 200; // characters per minute
  const complexityMultipliers = {
    low: 1.0,
    medium: 1.3,
    high: 1.8
  };
  
  const adjustedSpeed = baseSpeed / complexityMultipliers[complexity];
  const baseMinutes = characterCount / adjustedSpeed;
  
  return {
    min: Math.max(1, Math.floor(baseMinutes * 0.8)),
    max: Math.ceil(baseMinutes * 1.2),
    unit: 'minutes',
    complexity
  };
}