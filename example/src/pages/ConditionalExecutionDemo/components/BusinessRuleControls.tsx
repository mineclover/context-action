import React, { useState } from 'react';
import { useConditionalAction } from '../stores';

export function BusinessRuleControls() {
  const dispatch = useConditionalAction();
  const [customerTier, setCustomerTier] = useState<'bronze' | 'silver' | 'gold' | 'platinum'>('silver');
  const [orderAmount, setOrderAmount] = useState(800);

  const handleProcessOrder = () => {
    dispatch('processOrder', {
      order: {
        id: `order-${Date.now()}`,
        amount: orderAmount,
        customerId: 'customer-123',
        items: [{ id: 'item-1', quantity: 1, price: orderAmount }]
      },
      customer: {
        id: 'customer-123',
        tier: customerTier,
        creditLimit: 5000
      }
    });
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">💼 Business Rule Engine</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Customer Tier:</label>
          <select 
            value={customerTier} 
            onChange={(e) => setCustomerTier(e.target.value as any)}
            className="border rounded px-3 py-1 w-full"
          >
            <option value="bronze">Bronze (0% discount)</option>
            <option value="silver">Silver (5% discount)</option>
            <option value="gold">Gold (10% discount)</option>
            <option value="platinum">Platinum (15% discount)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Order Amount:</label>
          <input
            type="number"
            value={orderAmount}
            onChange={(e) => setOrderAmount(Number(e.target.value))}
            className="border rounded px-3 py-1 w-full"
            min="0"
            max="3000"
            step="100"
          />
        </div>
      </div>
      
      <button 
        onClick={handleProcessOrder}
        className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
      >
        Process Order
      </button>
      
      <p className="text-sm text-gray-600 mt-2">
        Credit checks and discounts apply based on tier and amount.
        {orderAmount > 1000 && " (+5% volume discount)"}
        {orderAmount > 2000 && " (May fail credit check)"}
      </p>
    </div>
  );
}