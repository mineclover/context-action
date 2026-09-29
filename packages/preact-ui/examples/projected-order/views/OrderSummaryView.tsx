import type { ReadonlySignal } from '@preact/signals';
import type { OrderSummary } from '../business/order-types.js';

/**
 * Pure presentation component showing direct Signal binding.
 * 
 * Notice that {summary.value.formattedGrandTotal} or direct signal bindings
 * update fine-grained DOM text nodes directly in Preact without re-executing
 * the parent component render lifecycle!
 */
export function OrderSummaryView({
  summarySignal,
}: {
  summarySignal: ReadonlySignal<OrderSummary>;
}) {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginTop: '16px',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
        Order Summary (Direct Signal Projection)
      </h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span>Total Items:</span>
        <strong data-testid="summary-count">{summarySignal.value.totalItemCount}</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span>Subtotal:</span>
        <span>${summarySignal.value.subtotal.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span>Tax (10%):</span>
        <span>${summarySignal.value.tax.toFixed(2)}</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px dashed #cbd5e1',
          fontSize: '18px',
          fontWeight: '700',
        }}
      >
        <span>Grand Total:</span>
        <output data-testid="summary-grand-total">{summarySignal.value.formattedGrandTotal}</output>
      </div>
    </div>
  );
}
