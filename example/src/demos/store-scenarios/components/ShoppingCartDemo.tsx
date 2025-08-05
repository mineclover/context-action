import React, { useCallback, useMemo, useEffect } from 'react';
import { useStoreValue } from '@context-action/react';
import { useActionLoggerWithToast } from '../../../components/LogMonitor/';
import { StoreScenarios, initialProducts } from '../stores';
import { storeActionRegister } from '../actions';
import { Card, CardContent, Badge, Button } from '../../../components/ui';
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
    // 자동 계산: 실행시간, 타임스탬프가 자동으로 주입됨
    logger.logSystem('장바구니 총액 계산', { 
      context: `items: ${cart?.length ?? 0}, total: ${total}`
    });
    return total;
  }, [cart, products, logger]);

  const addToCart = useCallback((productId: string) => {
    const product = products?.find(p => p.id === productId);
    // 자동 계산: 실행시간, 타임스탬프, 액션타입이 자동으로 주입됨
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
      // 자동 계산: 실행시간, 타임스탬프, 액션타입이 자동으로 주입됨
      logger.logAction('removeFromCart', { 
        productId, 
        productName: product?.name,
        previousQuantity: currentItem?.quantity 
      });
      storeActionRegister.dispatch('removeFromCart', { productId });
    } else {
      // 자동 계산: 실행시간, 타임스탬프, 액션타입이 자동으로 주입됨
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
    // 자동 계산: 실행시간, 타임스탬프, 액션타입이 자동으로 주입됨
    logger.logAction('clearCart', { 
      itemCount: cart?.length ?? 0,
      totalValue: totalAmount
    });
    storeActionRegister.dispatch('clearCart', {});
  }, [cart, totalAmount, logger]);

  return (
    <Card variant="elevated">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">🛒 Shopping Cart System</h3>
            <p className="text-sm text-gray-600 mt-1">배열 조작과 수량 추적, 계산된 총합을 관리하는 쇼핑카트 데모</p>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-800">
            {cart?.length ?? 0} items
          </Badge>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">📦 Available Products</h4>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {products?.length ?? 0} products
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products?.map(product => {
              const inCart = cart?.find(item => item.productId === product.id);
              return (
                <div key={product.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{product.name}</h5>
                      <Badge variant="outline" className="mt-1 text-xs bg-purple-100 text-purple-800">
                        {product.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">₩{product.price.toLocaleString()}</span>
                      <div className="text-xs text-gray-600">
                        {'⭐'.repeat(Math.floor(product.rating))} {product.rating}/5
                      </div>
                    </div>
                    <div className="text-xs">
                      {product.inStock > 0 ? (
                        <span className="text-green-600 font-medium">재고 {product.inStock}개</span>
                      ) : (
                        <span className="text-red-600 font-medium">품절</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    {inCart ? (
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                          장바구니에 {inCart.quantity}개
                        </Badge>
                        <Button 
                          onClick={() => updateQuantity(product.id, inCart.quantity + 1)}
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          disabled={product.inStock <= inCart.quantity}
                        >
                          + 더 추가
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => addToCart(product.id)}
                        variant="primary"
                        size="sm"
                        className="w-full"
                        disabled={product.inStock === 0}
                      >
                        🛒 카트 담기
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">🛒 Shopping Cart</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                총 {cart?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}개 상품
              </Badge>
              {(cart?.length ?? 0) > 0 && (
                <Button 
                  onClick={clearCart} 
                  variant="danger"
                  size="sm"
                  onMouseEnter={() => {
                    // 자동 계산: 실행시간, 타임스탬프, 액션타입이 자동으로 주입됨
                    logger.logAction('hoverClearCart', { itemCount: cart?.length });
                  }}
                >
                  🗑️ Clear All
                </Button>
              )}
            </div>
          </div>
          
          {(cart?.length ?? 0) === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-4xl mb-2">🛒</div>
              <div className="text-gray-600 font-medium">장바구니가 비어있습니다</div>
              <div className="text-sm text-gray-500 mt-1">위에서 상품을 선택해주세요</div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {cart?.map(item => {
                  const product = products?.find(p => p.id === item.productId);
                  const itemTotal = product ? product.price * item.quantity : 0;
                  return product ? (
                    <div key={item.productId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-green-600 font-medium">₩{product.price.toLocaleString()}</span>
                          <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
                            {product.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            variant="secondary"
                            size="sm"
                            className="w-8 h-8 p-0"
                          >
                            ➖
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button 
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            variant="secondary"
                            size="sm"
                            className="w-8 h-8 p-0"
                            disabled={product.inStock <= item.quantity}
                          >
                            ➕
                          </Button>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">₩{itemTotal.toLocaleString()}</div>
                        </div>
                        <Button 
                          onClick={() => updateQuantity(item.productId, 0)}
                          variant="danger"
                          size="sm"
                          className="w-8 h-8 p-0"
                          title="Remove item"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">상품 개수:</span>
                  <span className="font-medium">{cart?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}개</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">배송비:</span>
                  <span className="font-medium">{totalAmount >= 50000 ? '무료' : '₩3,000'}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t border-blue-200 pt-3">
                  <span>총 결제금액:</span>
                  <span className="text-blue-600">₩{(totalAmount + (totalAmount >= 50000 ? 0 : 3000)).toLocaleString()}</span>
                </div>
                <Button 
                  variant="primary"
                  className="w-full mt-4"
                  onClick={() => {
                    // 자동 계산: 실행시간, 타임스탬프, 액션타입이 자동으로 주입됨
                    logger.logAction('proceedToCheckout', { 
                      totalAmount, 
                      itemCount: cart?.length,
                      items: cart?.map(item => ({ productId: item.productId, quantity: item.quantity }))
                    });
                  }}
                >
                  💳 주문하기
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}