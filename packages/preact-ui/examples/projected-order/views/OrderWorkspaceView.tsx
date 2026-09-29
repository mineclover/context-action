import { useState } from 'preact/hooks';
import { useOrderActions } from '../actions/use-order-actions.js';
import { useOrderProjection } from '../projections/use-order-projection.js';
import { OrderSummaryView } from './OrderSummaryView.js';

/**
 * Tier 3 Presentation View for Projected Order Workspace.
 * 
 * Separation of Concerns Checklist:
 * 1. Reads NO store directly; consumes fine-grained signals via useOrderProjection()
 * 2. Invokes NO raw dispatch; executes semantic actions via useOrderActions()
 * 3. Keeps volatile UI state (active tab, log accordion, local input drafts) in local useState
 */
export function OrderWorkspaceView() {
  // 1. Projection Hook: Read-only derived signals
  const {
    customerNameSignal,
    shippingAddressSignal,
    itemsSignal,
    summarySignal,
    submissionSignal,
    validationIssuesSignal,
    activityLogSignal,
    isSubmittingSignal,
    isSuccessSignal,
    canSubmitSignal,
    getFieldError,
  } = useOrderProjection();

  // 2. Business Logic Hook: Typed action dispatchers
  const {
    setCustomerName,
    setShippingAddress,
    addItem,
    removeItem,
    updateItemQuantity,
    submitOrder,
    resetDraft,
  } = useOrderActions();

  // 3. Tier 3 Volatile Presentation State (Waiver: Purely local UI)
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [itemNameInput, setItemNameInput] = useState('');
  const [itemPriceInput, setItemPriceInput] = useState('10');

  const customerNameError = getFieldError('customerName');
  const shippingAddressError = getFieldError('shippingAddress');
  const itemsError = getFieldError('items');

  const handleAddItem = (e: preact.JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!itemNameInput.trim()) return;
    const unitPrice = parseFloat(itemPriceInput) || 10;
    void addItem({
      id: `item_${Date.now()}`,
      name: itemNameInput.trim(),
      unitPrice,
      quantity: 1,
    });
    setItemNameInput('');
  };

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1e293b',
      }}
    >
      <header style={{ marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>
          Preact Signal Projection Order Workspace
        </h2>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
          Context-Layered Architecture: Projection Hooks & Business Logic Hooks
        </p>
      </header>

      {/* Submission Phase Banner */}
      {isSuccessSignal.value ? (
        <div
          role="status"
          style={{
            padding: '16px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <strong>Order Placed Successfully!</strong> Order ID:{' '}
          <code data-testid="placed-order-id">{submissionSignal.value.orderId}</code>
          <div style={{ marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => void resetDraft()}
              style={{
                padding: '6px 12px',
                backgroundColor: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Start New Order
            </button>
          </div>
        </div>
      ) : null}

      {/* Customer Info Form */}
      <section style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
            Customer Name
          </label>
          <input
            type="text"
            data-testid="input-customer-name"
            value={customerNameSignal.value}
            onInput={(e) => void setCustomerName((e.target as HTMLInputElement).value)}
            disabled={isSubmittingSignal.value}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: customerNameError.value ? '1px solid #ef4444' : '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          {customerNameError.value ? (
            <p data-testid="error-customer-name" style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
              {customerNameError.value}
            </p>
          ) : null}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
            Shipping Address
          </label>
          <input
            type="text"
            data-testid="input-shipping-address"
            value={shippingAddressSignal.value}
            onInput={(e) => void setShippingAddress((e.target as HTMLInputElement).value)}
            disabled={isSubmittingSignal.value}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: shippingAddressError.value ? '1px solid #ef4444' : '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          {shippingAddressError.value ? (
            <p data-testid="error-shipping-address" style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
              {shippingAddressError.value}
            </p>
          ) : null}
        </div>
      </section>

      {/* Item List & Add Form */}
      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Order Items</h3>
        
        {itemsError.value ? (
          <p data-testid="error-items" style={{ color: '#ef4444', fontSize: '12px', margin: '0 0 8px 0' }}>
            {itemsError.value}
          </p>
        ) : null}

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
          {itemsSignal.value.map((item) => (
            <li
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                marginBottom: '6px',
              }}
            >
              <div>
                <strong style={{ fontSize: '14px' }}>{item.name}</strong>
                <span style={{ color: '#64748b', fontSize: '13px', marginLeft: '8px' }}>
                  ${item.unitPrice.toFixed(2)} ea
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => void updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                  disabled={isSubmittingSignal.value || item.quantity <= 1}
                  style={{ padding: '2px 8px' }}
                >
                  -
                </button>
                <span data-testid={`item-qty-${item.id}`} style={{ minWidth: '20px', textAlign: 'center' }}>
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => void updateItemQuantity(item.id, item.quantity + 1)}
                  disabled={isSubmittingSignal.value}
                  style={{ padding: '2px 8px' }}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => void removeItem(item.id)}
                  disabled={isSubmittingSignal.value}
                  style={{
                    marginLeft: '8px',
                    color: '#ef4444',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Add Item Local Form (Tier 3 Local State) */}
        <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Item name (e.g. Widget)"
            data-testid="input-new-item-name"
            value={itemNameInput}
            onInput={(e) => setItemNameInput((e.target as HTMLInputElement).value)}
            disabled={isSubmittingSignal.value}
            style={{ flex: 2, padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          />
          <input
            type="number"
            min="1"
            placeholder="Price"
            data-testid="input-new-item-price"
            value={itemPriceInput}
            onInput={(e) => setItemPriceInput((e.target as HTMLInputElement).value)}
            disabled={isSubmittingSignal.value}
            style={{ width: '80px', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          />
          <button
            type="submit"
            data-testid="btn-add-item"
            disabled={isSubmittingSignal.value || !itemNameInput.trim()}
            style={{
              padding: '6px 14px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add Item
          </button>
        </form>
      </section>

      {/* Projection Summary Section */}
      <OrderSummaryView summarySignal={summarySignal} />

      {/* Action Submit Controls */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          type="button"
          data-testid="btn-submit-order"
          onClick={() => void submitOrder()}
          disabled={!canSubmitSignal.value}
          style={{
            flex: 1,
            padding: '12px 20px',
            backgroundColor: canSubmitSignal.value ? '#2563eb' : '#94a3b8',
            color: '#fff',
            fontSize: '15px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '6px',
            cursor: canSubmitSignal.value ? 'pointer' : 'not-allowed',
          }}
        >
          {isSubmittingSignal.value ? 'Placing Order...' : 'Place Order Now'}
        </button>

        <button
          type="button"
          data-testid="btn-reset-order"
          onClick={() => void resetDraft()}
          disabled={isSubmittingSignal.value}
          style={{
            padding: '12px 16px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      {/* Tier 3 Presentation Accordion: Activity Log */}
      <section style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
        <button
          type="button"
          onClick={() => setIsLogOpen(!isLogOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '13px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {isLogOpen ? '▼ Hide Activity Log' : '▶ Show Activity Log'} ({activityLogSignal.value.length})
        </button>

        {isLogOpen ? (
          <ul
            data-testid="activity-log-list"
            style={{
              margin: '8px 0 0 0',
              padding: '8px 12px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#64748b',
              maxHeight: '120px',
              overflowY: 'auto',
            }}
          >
            {activityLogSignal.value.map((entry) => (
              <li key={entry.id} style={{ marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>
                  {new Date(entry.timestamp).toLocaleTimeString()}:
                </span>{' '}
                {entry.message}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
