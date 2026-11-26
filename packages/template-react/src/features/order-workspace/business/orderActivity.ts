export type OrderActivityEvent =
  | { type: 'workspace_initialized' }
  | { type: 'draft_reset' }
  | { type: 'validation_failed'; issueCount: number }
  | { type: 'submission_started'; quantity: number }
  | { type: 'order_completed'; orderId: string };
