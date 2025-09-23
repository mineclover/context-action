/**
 * Pure UI Components Layer (5-Layer Architecture)
 *
 * This layer:
 * - Contains pure presentational components
 * - Handles event dispatching to parent components
 * - Manages UI state and interactions
 * - No direct business logic or store access
 */

import React, { useState, useCallback } from 'react';
import type { CartItem, ValidationResult, CalculationResult, ProcessingResult } from '../contexts/CartContexts';

// 🎯 Cart Item View Component
export interface CartItemViewProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  disabled?: boolean;
}

export function CartItemView({ item, onUpdateQuantity, onRemoveItem, disabled = false }: CartItemViewProps) {
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    setQuantity(newQuantity);
    onUpdateQuantity(item.id, newQuantity);
  }, [item.id, onUpdateQuantity]);

  const totalPrice = item.price * quantity;

  return (
    <div className="flex items-center gap-4 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800">{item.name}</h3>
        <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
          disabled={disabled || quantity <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          -
        </button>
        <span className="w-12 text-center font-medium">{quantity}</span>
        <button
          onClick={() => handleQuantityChange(Math.min(99, quantity + 1))}
          disabled={disabled || quantity >= 99}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>

      <div className="text-right">
        <p className="font-semibold text-gray-800">${totalPrice.toFixed(2)}</p>
        <button
          onClick={() => onRemoveItem(item.id)}
          disabled={disabled}
          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

// 🎯 Cart List View Component
export interface CartListViewProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  disabled?: boolean;
}

export function CartListView({ items, onUpdateQuantity, onRemoveItem, disabled = false }: CartListViewProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-6xl mb-4">🛒</div>
        <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
        <p className="text-sm">Add some items to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <CartItemView
          key={item.id}
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

// 🎯 Add Item Form Component
export interface AddItemFormProps {
  onAddItem: (item: Omit<CartItem, 'id'>) => void;
  disabled?: boolean;
}

export function AddItemForm({ onAddItem, disabled = false }: AddItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '1',
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price || Number(formData.price) <= 0) {
      return;
    }

    onAddItem({
      name: formData.name.trim(),
      price: Number(formData.price),
      quantity: Number(formData.quantity),
    });

    // Reset form
    setFormData({ name: '', price: '', quantity: '1' });
  }, [formData, onAddItem]);

  const canSubmit = formData.name.trim() && formData.price && Number(formData.price) > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      <h3 className="font-semibold text-gray-800">Add New Item</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            disabled={disabled}
            placeholder="Enter item name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price ($)
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            disabled={disabled}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            disabled={disabled}
            min="1"
            max="99"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || !canSubmit}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add Item
      </button>
    </form>
  );
}

// 🎯 Validation Result View Component
export interface ValidationViewProps {
  validation: ValidationResult | null;
}

export function ValidationView({ validation }: ValidationViewProps) {
  if (!validation) return null;

  return (
    <div className={`p-4 rounded-lg border ${
      validation.isValid
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">
          {validation.isValid ? '✅' : '❌'}
        </span>
        <h3 className="font-semibold">
          {validation.isValid ? 'Cart is Valid' : 'Validation Errors'}
        </h3>
      </div>

      {!validation.isValid && validation.errors.length > 0 && (
        <ul className="space-y-1">
          {validation.errors.map((error, index) => (
            <li key={index} className="text-sm">
              • {error}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs mt-2 opacity-75">
        Validated by: {validation.validatedBy}
      </p>
    </div>
  );
}

// 🎯 Calculation Result View Component
export interface CalculationViewProps {
  calculation: CalculationResult | null;
}

export function CalculationView({ calculation }: CalculationViewProps) {
  if (!calculation) return null;

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
        <span>💰</span>
        Order Summary
      </h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${calculation.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>${calculation.tax.toFixed(2)}</span>
        </div>
        <hr className="my-2" />
        <div className="flex justify-between font-semibold text-base">
          <span>Total:</span>
          <span>${calculation.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>Items: {calculation.itemCount}</span>
          <span>Calculated by: {calculation.calculatedBy}</span>
        </div>
      </div>
    </div>
  );
}

// 🎯 Order Status View Component
export interface OrderStatusViewProps {
  order: ProcessingResult | null;
}

export function OrderStatusView({ order }: OrderStatusViewProps) {
  if (!order || !order.orderId) return null;

  const statusConfig = {
    processing: { icon: '⏳', color: 'yellow', label: 'Processing' },
    completed: { icon: '✅', color: 'green', label: 'Completed' },
    failed: { icon: '❌', color: 'red', label: 'Failed' },
  };

  const config = statusConfig[order.status];

  return (
    <div className={`p-4 rounded-lg border ${
      config.color === 'green' ? 'bg-green-50 border-green-200 text-green-800' :
      config.color === 'red' ? 'bg-red-50 border-red-200 text-red-800' :
      'bg-yellow-50 border-yellow-200 text-yellow-800'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{config.icon}</span>
        <h3 className="font-semibold">Order {config.label}</h3>
      </div>

      <p className="text-sm mb-1">
        Order ID: <code className="bg-white bg-opacity-50 px-1 rounded">{order.orderId}</code>
      </p>

      <p className="text-xs opacity-75">
        Processed by: {order.processedBy} at {new Date(order.timestamp).toLocaleString()}
      </p>
    </div>
  );
}

// 🎯 Checkout Form Component
export interface CheckoutFormProps {
  onCheckout: (paymentMethod: string, discountCode?: string) => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export function CheckoutForm({ onCheckout, disabled = false, isProcessing = false }: CheckoutFormProps) {
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [discountCode, setDiscountCode] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onCheckout(paymentMethod, discountCode || undefined);
  }, [paymentMethod, discountCode, onCheckout]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      <h3 className="font-semibold text-gray-800">Checkout</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          disabled={disabled || isProcessing}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="credit_card">Credit Card</option>
          <option value="paypal">PayPal</option>
          <option value="stripe">Stripe</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Discount Code (Optional)
        </label>
        <input
          type="text"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
          disabled={disabled || isProcessing}
          placeholder="SAVE10, SAVE20, WELCOME"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={disabled || isProcessing}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          'Complete Order'
        )}
      </button>
    </form>
  );
}

// 🎯 Cart Statistics View Component
export interface CartStatisticsViewProps {
  statistics: {
    totalItems: number;
    totalValue: number;
    averageItemPrice: number;
    uniqueItems: number;
    mostExpensiveItem: CartItem | null;
  };
}

export function CartStatisticsView({ statistics }: CartStatisticsViewProps) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span>📊</span>
        Cart Statistics
      </h3>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Total Items:</p>
          <p className="font-semibold">{statistics.totalItems}</p>
        </div>
        <div>
          <p className="text-gray-600">Unique Items:</p>
          <p className="font-semibold">{statistics.uniqueItems}</p>
        </div>
        <div>
          <p className="text-gray-600">Total Value:</p>
          <p className="font-semibold">${statistics.totalValue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">Average Price:</p>
          <p className="font-semibold">${statistics.averageItemPrice.toFixed(2)}</p>
        </div>
      </div>

      {statistics.mostExpensiveItem && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-gray-600 text-sm">Most Expensive:</p>
          <p className="font-semibold text-sm">
            {statistics.mostExpensiveItem.name} - ${statistics.mostExpensiveItem.price.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}