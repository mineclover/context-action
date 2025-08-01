/**
 * Shopping cart component demonstrating MVVM pattern and business logic
 * @implements mvvm-pattern
 * @memberof architecture-terms
 * @implements cross-store-coordination
 * @memberof core-concepts
 * @example
 * ```typescript
 * // MVVM: CartStore (ViewModel) + React Component (View)
 * function CartDemo() {
 *   const cartStore = new CartStore('cart');    // ViewModel with business logic
 *   const cart = useStoreValue(cartStore);      // Data binding
 *   return <div>Items: {cart.items.length}</div>; // View presentation
 * }
 * ```
 */

import type React from 'react';
import { useState } from 'react';
import { useStoreRegistry, Store, useStoreValue } from '@context-action/react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Cart {
  items: CartItem[];
  total: number;
  currency: string;
}

/**
 * Shopping cart ViewModel implementing complex business logic
 * @implements business-logic
 * @memberof core-concepts
 * @implements type-safety
 * @memberof architecture-terms
 */
class CartStore extends Store<Cart> {
  constructor(name: string) {
    super(name, { items: [], total: 0, currency: 'USD' });
  }

  addItem(item: Omit<CartItem, 'quantity'>) {
    this.update(cart => {
      const existingIndex = cart.items.findIndex(i => i.id === item.id);
      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += 1;
      } else {
        cart.items.push({ ...item, quantity: 1 });
      }
      cart.total = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      return cart;
    });
  }

  removeItem(id: string) {
    this.update(cart => {
      cart.items = cart.items.filter(item => item.id !== id);
      cart.total = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      return cart;
    });
  }

  updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(id);
      return;
    }
    this.update(cart => {
      const item = cart.items.find(i => i.id === id);
      if (item) {
        item.quantity = quantity;
        cart.total = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      }
      return cart;
    });
  }

  clearCart() {
    this.setValue({ items: [], total: 0, currency: 'USD' });
  }
}

const CartDemo: React.FC = () => {
  const registry = useStoreRegistry();
  
  // Get or create the cart store
  const [cartStore] = useState(() => {
    let store = registry.getStore('cart') as CartStore;
    if (!store) {
      store = new CartStore('cart');
      registry.register('cart', store);
    }
    return store;
  });

  const cart = useStoreValue(cartStore);

  if (!cartStore || !cart) {
    return (
      <div style={cardStyle}>
        <h3>Cart Demo</h3>
        <p>Cart store not found or cart data not available</p>
      </div>
    );
  }

  const sampleProducts = [
    { id: 'p1', name: 'MacBook Pro 16"', price: 2499.99, image: '💻' },
    { id: 'p2', name: 'iPhone 15 Pro', price: 1199.99, image: '📱' },
    { id: 'p3', name: 'AirPods Pro', price: 249.99, image: '🎧' },
    { id: 'p4', name: 'iPad Air', price: 599.99, image: '📱' },
    { id: 'p5', name: 'Apple Watch', price: 399.99, image: '⌚' },
    { id: 'p6', name: 'Magic Keyboard', price: 299.99, image: '⌨️' }
  ];

  const addSampleItem = (product: typeof sampleProducts[0]) => {
    cartStore.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cart.currency || 'USD'
    }).format(price);
  };

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>🛒 Shopping Cart Demo</h3>
      <p style={descriptionStyle}>
        Demonstrates cart management with add/remove items and quantity updates.
      </p>

      <div style={summaryStyle}>
        <div style={summaryItemStyle}>
          <span style={summaryLabelStyle}>Items:</span>
          <span style={summaryValueStyle}>{totalItems}</span>
        </div>
        <div style={summaryItemStyle}>
          <span style={summaryLabelStyle}>Total:</span>
          <span style={{ ...summaryValueStyle, fontWeight: 'bold', color: '#10b981' }}>
            {formatPrice(cart.total)}
          </span>
        </div>
      </div>

      {cart.items.length === 0 ? (
        <div style={emptyCartStyle}>
          <div style={emptyIconStyle}>🛒</div>
          <p style={emptyTextStyle}>Your cart is empty</p>
          <p style={emptySubTextStyle}>Add some products to get started!</p>
        </div>
      ) : (
        <div style={cartItemsStyle}>
          <h4 style={sectionTitleStyle}>Cart Items</h4>
          {cart.items.map((item) => (
            <div key={item.id} style={cartItemStyle}>
              <div style={itemImageStyle}>
                {typeof item.image === 'string' && item.image.startsWith('http') ? (
                  <img src={item.image} alt={item.name} style={productImageStyle} />
                ) : (
                  <span style={emojiImageStyle}>{item.image || '📦'}</span>
                )}
              </div>
              <div style={itemInfoStyle}>
                <h5 style={itemNameStyle}>{item.name}</h5>
                <p style={itemPriceStyle}>{formatPrice(item.price)}</p>
              </div>
              <div style={quantityControlsStyle}>
                <button
                  style={quantityButtonStyle}
                  onClick={() => cartStore.updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span style={quantityDisplayStyle}>{item.quantity}</span>
                <button
                  style={quantityButtonStyle}
                  onClick={() => cartStore.updateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <div style={itemTotalStyle}>
                {formatPrice(item.price * item.quantity)}
              </div>
              <button
                style={removeButtonStyle}
                onClick={() => cartStore.removeItem(item.id)}
                title="Remove item"
              >
                🗑️
              </button>
            </div>
          ))}
          <div style={cartActionsStyle}>
            <button style={clearButtonStyle} onClick={() => cartStore.clearCart()}>
              Clear Cart
            </button>
          </div>
        </div>
      )}

      <div style={productsStyle}>
        <h4 style={sectionTitleStyle}>Available Products</h4>
        <div style={productsGridStyle}>
          {sampleProducts.map((product) => (
            <div key={product.id} style={productCardStyle}>
              <div style={productImageContainerStyle}>
                <span style={productEmojiStyle}>{product.image}</span>
              </div>
              <div style={productInfoStyle}>
                <h6 style={productNameStyle}>{product.name}</h6>
                <p style={productPriceStyle}>{formatPrice(product.price)}</p>
                <button
                  style={addButtonStyle}
                  onClick={() => addSampleItem(product)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={infoStyle}>
        <small>
          This demonstrates cart state management with quantity controls,
          item removal, and price calculations.
        </small>
      </div>
    </div>
  );
};

// Styles
const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  border: '1px solid #e2e8f0'
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  color: '#1e293b',
  fontSize: '1.25rem',
  fontWeight: '600'
};

const descriptionStyle: React.CSSProperties = {
  margin: '0 0 20px 0',
  color: '#64748b',
  fontSize: '0.9rem',
  lineHeight: '1.4'
};

const summaryStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '16px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  marginBottom: '20px',
  border: '1px solid #e2e8f0'
};

const summaryItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const summaryLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '0.9rem'
};

const summaryValueStyle: React.CSSProperties = {
  color: '#1e293b',
  fontSize: '1.1rem',
  fontWeight: '600'
};

const emptyCartStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#64748b'
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: '3rem',
  marginBottom: '16px'
};

const emptyTextStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '1.1rem',
  fontWeight: '500',
  color: '#374151'
};

const emptySubTextStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '0.9rem'
};

const cartItemsStyle: React.CSSProperties = {
  marginBottom: '24px'
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  color: '#374151',
  fontSize: '1rem',
  fontWeight: '500'
};

const cartItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  marginBottom: '8px',
  backgroundColor: '#fafafa'
};

const itemImageStyle: React.CSSProperties = {
  flexShrink: 0
};

const productImageStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  objectFit: 'cover',
  borderRadius: '4px'
};

const emojiImageStyle: React.CSSProperties = {
  fontSize: '2rem',
  display: 'block',
  width: '40px',
  textAlign: 'center'
};

const itemInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0
};

const itemNameStyle: React.CSSProperties = {
  margin: '0 0 4px 0',
  fontSize: '0.9rem',
  fontWeight: '500',
  color: '#1e293b'
};

const itemPriceStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '0.8rem',
  color: '#64748b'
};

const quantityControlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const quantityButtonStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  border: '1px solid #d1d5db',
  backgroundColor: 'white',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const quantityDisplayStyle: React.CSSProperties = {
  minWidth: '24px',
  textAlign: 'center',
  fontSize: '0.9rem',
  fontWeight: '500'
};

const itemTotalStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#10b981',
  minWidth: '80px',
  textAlign: 'right'
};

const removeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  padding: '4px',
  borderRadius: '4px',
  opacity: 0.7,
  transition: 'opacity 0.2s'
};

const cartActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '16px'
};

const clearButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem'
};

const productsStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const productsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '12px'
};

const productCardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '12px',
  textAlign: 'center',
  backgroundColor: '#fafafa'
};

const productImageContainerStyle: React.CSSProperties = {
  marginBottom: '8px'
};

const productEmojiStyle: React.CSSProperties = {
  fontSize: '2rem'
};

const productInfoStyle: React.CSSProperties = {
  textAlign: 'center'
};

const productNameStyle: React.CSSProperties = {
  margin: '0 0 4px 0',
  fontSize: '0.8rem',
  fontWeight: '500',
  color: '#1e293b'
};

const productPriceStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '0.8rem',
  color: '#3b82f6',
  fontWeight: '600'
};

const addButtonStyle: React.CSSProperties = {
  padding: '4px 8px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: '500'
};

const infoStyle: React.CSSProperties = {
  marginTop: '16px',
  padding: '12px',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderRadius: '6px',
  borderLeft: '3px solid #3b82f6',
  color: '#64748b'
};

export default CartDemo;