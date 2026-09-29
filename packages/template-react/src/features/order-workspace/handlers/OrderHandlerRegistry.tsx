import { useOrderDraftHandlers } from './useOrderDraftHandlers';
import { useOrderSubmissionHandlers } from './useOrderSubmissionHandlers';

export function OrderHandlerRegistry() {
  useOrderDraftHandlers();
  useOrderSubmissionHandlers();
  return null;
}
