import { useOrderDraftHandlers } from './useOrderDraftHandlers';
import { useOrderLayoutHandlers } from './useOrderLayoutHandlers';
import { useOrderSubmissionHandlers } from './useOrderSubmissionHandlers';

export function OrderHandlerRegistry() {
  useOrderDraftHandlers();
  useOrderSubmissionHandlers();
  useOrderLayoutHandlers();
  return null;
}
