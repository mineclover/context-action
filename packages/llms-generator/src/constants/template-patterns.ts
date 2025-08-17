/**
 * Template Detection Patterns
 * 
 * Constants for detecting template content and placeholder text in generated documents
 */

export const TEMPLATE_INDICATORS = {
  /**
   * Korean template patterns
   */
  korean: [
    '개요를 제공합니다',
    '설명하는 내용입니다', 
    '다음과 같습니다',
    '[설명]',
    '예시:',
    '다음 예시',
    '아래 예시'
  ],

  /**
   * English template patterns
   */
  english: [
    'This section provides',
    'This document describes',
    'The following describes'
  ],

  /**
   * Generic placeholder patterns
   */
  placeholders: [
    '{{',
    'TODO:',
    'PLACEHOLDER',
    '[INSERT',
    'EXAMPLE:'
  ],

  /**
   * Combined array of all template indicators
   */
  all: [] as string[]
};

// Initialize the combined array
TEMPLATE_INDICATORS.all = [
  ...TEMPLATE_INDICATORS.korean,
  ...TEMPLATE_INDICATORS.english,
  ...TEMPLATE_INDICATORS.placeholders
];

/**
 * Quality assessment thresholds
 */
export const QUALITY_THRESHOLDS = {
  /**
   * Score penalties for different quality issues
   */
  penalties: {
    templateDetected: 40,
    tooShort: 30,
    tooLong: 20,
    emptyContent: 100
  },

  /**
   * Length ratio thresholds
   */
  lengthRatio: {
    tooShort: 0.3,
    tooLong: 1.2
  },

  /**
   * Minimum quality score for acceptance
   */
  minimumScore: 50
} as const;

/**
 * Work status indicators
 */
export const WORK_STATUS_INDICATORS = {
  /**
   * Reasons that trigger work needed status
   */
  workTriggers: [
    'source_newer',
    'template_detected', 
    'quality_low',
    'manual_edit_needed',
    'missing'
  ],

  /**
   * Quality score threshold for triggering manual review
   */
  manualReviewThreshold: 50,

  /**
   * File modification time tolerance (in milliseconds)
   */
  modificationTolerance: 1000
} as const;