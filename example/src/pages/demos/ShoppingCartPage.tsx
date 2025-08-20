/**
 * @fileoverview Shopping Cart Demo Page - Individual Demo
 * 복잡한 계산과 상태 관리, 실시간 가격 업데이트가 포함된 장바구니 시스템
 */

import React from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor/';
import { ShoppingCartDemo } from './store-scenarios/components';
import { StoreScenarios } from './store-scenarios/stores';

export function ShoppingCartPage() {
  return (
    <PageWithLogMonitor
      pageId="shopping-cart-demo"
      title="Shopping Cart Demo"
    >
      <StoreScenarios.Provider>
        <div className="max-w-6xl mx-auto p-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-xl mb-8 border border-purple-200">
            <div className="flex items-start gap-6">
              <div className="text-5xl">🛒</div>
              <div>
                <h1 className="text-3xl font-bold text-purple-900 mb-4">Shopping Cart System Demo</h1>
                <p className="text-purple-800 text-lg mb-4">
                  복잡한 <strong>계산과 상태 관리</strong>, 실시간 가격 업데이트가 포함된 장바구니 시스템입니다.
                  실제 이커머스에서 사용되는 핵심 기능들을 구현했습니다.
                </p>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-600">💰</span>
                    <span className="font-semibold text-purple-800">
                      핵심 기능: 실시간 계산 + 재고 관리 + 배송비 계산
                    </span>
                  </div>
                  <p className="text-purple-800 text-sm">
                    상품 추가/제거, 수량 조절, 실시간 총액 계산, 재고 확인, 배송비 자동 계산 기능을 제공합니다.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-3">🛍️ 쇼핑 기능</h3>
                    <ul className="text-purple-700 space-y-2 text-sm">
                      <li>• <strong>Product Catalog</strong>: 상품 목록 및 상세 정보</li>
                      <li>• <strong>Cart Management</strong>: 장바구니 추가/제거</li>
                      <li>• <strong>Quantity Control</strong>: 수량 증감 및 검증</li>
                      <li>• <strong>Stock Validation</strong>: 재고 확인 및 제한</li>
                      <li>• <strong>Price Calculation</strong>: 실시간 가격 계산</li>
                      <li>• <strong>Shipping Logic</strong>: 배송비 조건부 계산</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-3">⚡ 기술 특징</h3>
                    <ul className="text-purple-700 space-y-2 text-sm">
                      <li>• 복잡한 비즈니스 로직 처리</li>
                      <li>• 실시간 계산 및 업데이트</li>
                      <li>• 조건부 배송비 계산</li>
                      <li>• 재고 상태 동기화</li>
                      <li>• 성능 최적화된 계산</li>
                      <li>• 사용자 경험 중심 설계</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Section */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <span className="text-3xl">🛒</span>
                      Live Demo
                    </h2>
                    <p className="text-purple-100 text-sm mt-2 leading-relaxed">
                      상품을 장바구니에 담고, 수량을 조절하고, 실시간 계산을 확인해보세요
                    </p>
                  </div>
                  <div className="text-right text-purple-100 text-xs">
                    <div>Real-time Calc</div>
                    <div>Stock Management</div>
                    <div>Dynamic Pricing</div>
                  </div>
                </div>
              </div>
              <div className="p-0">
                <ShoppingCartDemo />
              </div>
            </div>
          </div>

          {/* Technical Implementation */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">🔧 기술적 구현 세부사항</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-purple-600">Store Architecture</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>productsStore</strong>: 상품 데이터 및 재고 관리</li>
                  <li>• <strong>cartStore</strong>: 장바구니 아이템 관리</li>
                  <li>• <strong>Real-time Calculations</strong>: 즉시 총액 계산</li>
                  <li>• <strong>Stock Synchronization</strong>: 재고 상태 동기화</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-green-600">Business Logic</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>addToCart</strong>: 상품 추가 및 수량 증가</li>
                  <li>• <strong>updateCartQuantity</strong>: 수량 변경 검증</li>
                  <li>• <strong>removeFromCart</strong>: 아이템 제거</li>
                  <li>• <strong>calculateTotal</strong>: 총액 및 배송비 계산</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Business Rules */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">📋 비즈니스 로직</h2>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-orange-600">가격 계산</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 상품별 가격 × 수량</li>
                  <li>• 실시간 총액 업데이트</li>
                  <li>• 할인 적용 (구현 가능)</li>
                  <li>• 세금 계산 (구현 가능)</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-blue-600">배송비 정책</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• ₩50,000 이상: 무료배송</li>
                  <li>• ₩50,000 미만: ₩3,000</li>
                  <li>• 실시간 배송비 표시</li>
                  <li>• 무료배송 안내</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-red-600">재고 관리</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 실시간 재고 확인</li>
                  <li>• 재고 부족 알림</li>
                  <li>• 수량 제한 검증</li>
                  <li>• 품절 상태 표시</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Code Example */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">💻 핵심 코드 패턴</h2>
            <div className="bg-gray-50 p-6 rounded-lg border">
              <h3 className="font-semibold text-lg mb-4">장바구니 비즈니스 로직</h3>
              <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`// 1. 장바구니 추가 로직
const addToCartHandler = useCallback(
  ({ productId, quantity }: { productId: string; quantity: number }) => {
    cartStore.update((prev) => {
      const existingItem = prev.find(item => item.productId === productId);
      
      if (existingItem) {
        // 기존 아이템 수량 증가
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      // 새 아이템 추가
      return [...prev, { productId, quantity, addedAt: new Date() }];
    });
  },
  [cartStore]
);

// 2. 실시간 총액 계산
const totalAmount = useMemo(() => {
  return cartComputations.calculateTotal(cart || [], products || []);
}, [cart, products]);

// 3. 재고 검증
const updateQuantity = useCallback((productId: string, quantity: number) => {
  const product = products?.find((p) => p.id === productId);
  
  if (quantity <= 0) {
    // 아이템 제거
    storeActionRegister.dispatch('removeFromCart', { productId });
  } else if (product && quantity <= product.inStock) {
    // 수량 업데이트 (재고 범위 내)
    storeActionRegister.dispatch('updateCartQuantity', { productId, quantity });
  } else {
    // 재고 부족 알림
    showToast('재고가 부족합니다', 'warning');
  }
}, [products]);`}
              </pre>
            </div>
          </div>

          {/* Related Links */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">🔗 관련 리소스</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <a 
                href="/demos/store-scenarios"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                🏪 전체 Store 데모 컬렉션
              </a>
              <a 
                href="/demos/todo-list"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                ✅ Todo List Demo
              </a>
              <a 
                href="/demos/user-profile"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                👤 User Profile Demo
              </a>
            </div>
          </div>
        </div>
      </StoreScenarios.Provider>
    </PageWithLogMonitor>
  );
}