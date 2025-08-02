import React, { useCallback, useMemo, useEffect } from 'react';
import { useStoreValue } from '@context-action/react';
import { useActionLoggerWithToast } from '../../../components/LogMonitor/';
import { StoreScenarios, initialProducts } from '../stores';
import { storeActionRegister } from '../actions';
import type { CartItem } from '../types';

/**
 * 쇼핑카트 시스템 데모 컴포넌트
 * 배열 조작과 수량 추적, 계산된 총합을 관리하는 Context Store 패턴 예제
 * 
 * @implements store-integration-pattern
 * @implements action-handler
 * @memberof core-concepts
 * @example
 * // 쇼핑카트 관리를 위한 Context Store 패턴
 * const productsStore = StoreScenarios.useStore('products', initialProducts);
 * const cartStore = StoreScenarios.useStore('cart', [] as CartItem[]);
 * @since 1.0.0
 */
export function ShoppingCartDemo() {
  const productsStore = StoreScenarios.useStore('products', initialProducts);
  const cartStore = StoreScenarios.useStore('cart', [] as CartItem[]);
  
  const products = useStoreValue(productsStore);
  const cart = useStoreValue(cartStore);
  const logger = useActionLoggerWithToast();

  // 필요한 액션 핸들러들을 등록
  useEffect(() => {
    const unsubscribers = [
      storeActionRegister.register('addToCart', ({ productId, quantity }, controller) => {
        cartStore.update(prev => {
          const existingItem = prev.find(item => item.productId === productId);
          if (existingItem) {
            return prev.map(item =>
              item.productId === productId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          }
          return [...prev, { productId, quantity, addedAt: new Date() }];
        });
        controller.next();
      }),

      storeActionRegister.register('removeFromCart', ({ productId }, controller) => {
        cartStore.update(prev => prev.filter(item => item.productId !== productId));
        controller.next();
      }),

      storeActionRegister.register('updateCartQuantity', ({ productId, quantity }, controller) => {
        cartStore.update(prev =>
          prev.map(item =>
            item.productId === productId ? { ...item, quantity } : item
          )
        );
        controller.next();
      }),

      storeActionRegister.register('clearCart', (_, controller) => {
        cartStore.setValue([]);
        controller.next();
      })
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [cartStore]);

  const totalAmount = useMemo(() => {
    if (!cart || !products) return 0;
    const total = cart?.reduce((total, item) => {
      const product = products?.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
    logger.logSystem('장바구니 총액 계산', { 
      context: { itemCount: cart?.length ?? 0, totalAmount: total }
    });
    return total;
  }, [cart, products, logger]);

  const addToCart = useCallback((productId: string) => {
    const product = products?.find(p => p.id === productId);
    logger.logAction('addToCart', { 
      productId, 
      productName: product?.name,
      price: product?.price,
      cartSize: cart?.length ?? 0
    });
    storeActionRegister.dispatch('addToCart', { productId, quantity: 1 });
  }, [products, cart, logger]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const product = products?.find(p => p.id === productId);
    const currentItem = cart?.find(item => item.productId === productId);
    
    if (quantity <= 0) {
      logger.logAction('removeFromCart', { 
        productId, 
        productName: product?.name,
        previousQuantity: currentItem?.quantity 
      });
      storeActionRegister.dispatch('removeFromCart', { productId });
    } else {
      logger.logAction('updateCartQuantity', { 
        productId, 
        productName: product?.name,
        previousQuantity: currentItem?.quantity,
        newQuantity: quantity 
      });
      storeActionRegister.dispatch('updateCartQuantity', { productId, quantity });
    }
  }, [products, cart, logger]);

  const clearCart = useCallback(() => {
    logger.logAction('clearCart', { 
      itemCount: cart?.length ?? 0,
      totalValue: totalAmount
    });
    storeActionRegister.dispatch('clearCart', {});
  }, [cart, totalAmount, logger]);

  return (
    <div className="demo-card">
      <h3>🛒 Shopping Cart System</h3>
      <p className="demo-description">배열 조작과 수량 추적, 계산된 총합을 관리하는 쇼핑카트 데모</p>
      
      <div className="cart-products">
        <h4>📦 Available Products</h4>
        <div className="product-grid">
          {products?.map(product => {
            const inCart = cart?.find(item => item.productId === product.id);
            return (
              <div key={product.id} className="product-card">
                <div className="product-header">
                  <span className="product-name">{product.name}</span>
                  <span className="product-category">{product.category}</span>
                </div>
                <div className="product-details">
                  <div className="product-price">₩{product.price.toLocaleString()}</div>
                  <div className="product-stock">
                    {product.inStock > 0 ? (
                      <span className="stock-available">재고 {product.inStock}개</span>
                    ) : (
                      <span className="stock-out">품절</span>
                    )}
                  </div>
                  <div className="product-rating">
                    {'⭐'.repeat(Math.floor(product.rating))} {product.rating}/5
                  </div>
                </div>
                <div className="product-actions">
                  {inCart ? (
                    <div className="in-cart-info">
                      <span className="cart-badge">장바구니에 {inCart.quantity}개</span>
                      <button 
                        onClick={() => updateQuantity(product.id, inCart.quantity + 1)}
                        className="btn btn-small btn-secondary"
                        disabled={product.inStock <= inCart.quantity}
                      >
                        + 더 추가
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(product.id)}
                      className="btn btn-small btn-primary"
                      disabled={product.inStock === 0}
                    >
                      🛒 카트 담기
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cart-section">
        <div className="cart-header">
          <h4>🛒 Shopping Cart ({cart?.length ?? 0} items)</h4>
          <div className="cart-stats">
            <span className="total-items">총 {cart?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}개 상품</span>
            {(cart?.length ?? 0) > 0 && (
              <button 
                onClick={clearCart} 
                className="btn btn-small btn-danger"
                onMouseEnter={() => logger.logAction('hoverClearCart', { itemCount: cart?.length })}
              >
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>
        
        {(cart?.length ?? 0) === 0 ? (
          <div className="cart-empty">
            <div className="empty-icon">🛒</div>
            <div className="empty-message">장바구니가 비어있습니다</div>
            <div className="empty-hint">위에서 상품을 선택해주세요</div>
          </div>
        ) : (
          <>
            <div className="cart-list">
              {cart?.map(item => {
                const product = products?.find(p => p.id === item.productId);
                const itemTotal = product ? product.price * item.quantity : 0;
                return product ? (
                  <div key={item.productId} className="cart-item">
                    <div className="item-info">
                      <div className="item-name">{product.name}</div>
                      <div className="item-details">
                        <span className="item-price">₩{product.price.toLocaleString()}</span>
                        <span className="item-category">{product.category}</span>
                      </div>
                    </div>
                    <div className="quantity-section">
                      <div className="quantity-controls">
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="btn btn-small btn-secondary"
                        >
                          ➖
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="btn btn-small btn-secondary"
                          disabled={product.inStock <= item.quantity}
                        >
                          ➕
                        </button>
                      </div>
                      <div className="item-total">₩{itemTotal.toLocaleString()}</div>
                    </div>
                    <button 
                      onClick={() => updateQuantity(item.productId, 0)}
                      className="btn btn-small btn-danger remove-btn"
                      title="Remove item"
                    >
                      🗑️
                    </button>
                  </div>
                ) : null;
              })}
            </div>
            
            <div className="cart-summary">
              <div className="summary-row">
                <span>상품 개수:</span>
                <span>{cart?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}개</span>
              </div>
              <div className="summary-row">
                <span>배송비:</span>
                <span>{totalAmount >= 50000 ? '무료' : '₩3,000'}</span>
              </div>
              <div className="summary-total">
                <span>총 결제금액:</span>
                <span>₩{(totalAmount + (totalAmount >= 50000 ? 0 : 3000)).toLocaleString()}</span>
              </div>
              <button 
                className="btn btn-primary checkout-btn"
                onClick={() => logger.logAction('proceedToCheckout', { 
                  totalAmount, 
                  itemCount: cart?.length,
                  items: cart?.map(item => ({ productId: item.productId, quantity: item.quantity }))
                })}
              >
                💳 주문하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}