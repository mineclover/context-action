import React, { useState } from 'react';
import { useOrderData } from '../hooks/useOrderData';
import { useOrderActions } from '../actions/useOrderActions';
import { useThemeActionDispatch, useThemeStore } from '../../../theme/ThemeContext';
import { useStoreValue } from '@context-action/react';

/**
 * Tier 3: Presentation View
 * 
 * Astryx 디자인 시스템 CSS 변수를 전면 활용하며,
 * 뷰 내부의 모달 개폐 등 휘발성 상태는 컴포넌트 로컬 상태로 관리합니다 (Tier 3 Waiver 준수).
 */
export function OrderWorkspaceView() {
  const { draft, validationIssues, submission, activityLog, isSubmitting, isSuccess } = useOrderData();
  const { updateDraft, resetDraft, submitOrder, retrySubmission } = useOrderActions();

  // Astryx 테마 전환
  const themeStore = useThemeStore('currentTheme');
  const currentTheme = useStoreValue(themeStore);
  const themeDispatch = useThemeActionDispatch();

  // Tier 3: Volatile Presentation State (Waiver 대상: 로컬 useState로만 관리)
  const [isActivityOpen, setIsActivityOpen] = useState(true);

  const getFieldError = (field: string) => {
    return validationIssues.find((i) => i.field === field)?.message;
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px', width: '100%' }}>
      {/* Header with Astryx Theme Switcher */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--color-border-subtle)',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
            Context-Action + Astryx Starter
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Context-Layered Architecture & Astryx Theme Contract Integration
          </p>
        </div>

        <button
          onClick={() => themeDispatch('toggleTheme')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-background-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
        >
          {currentTheme.mode === 'light' ? '🌙 다크 모드' : '☀️ 라이트 모드'}
        </button>
      </header>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left Column: Form & Actions */}
        <section
          style={{
            backgroundColor: 'var(--color-background-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
              주문서 초안 (Tier 1 Domain Contract)
            </h2>
            <span
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: isSuccess
                  ? 'var(--color-success)'
                  : isSubmitting
                  ? 'var(--color-warning)'
                  : 'var(--color-background-muted)',
                color: isSuccess || isSubmitting ? '#ffffff' : 'var(--color-text-secondary)',
                fontWeight: '600',
              }}
            >
              FSM: {submission.phase.toUpperCase()}
            </span>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                상품 선택
              </label>
              <select
                value={draft.productId}
                disabled={isSubmitting}
                onChange={(e) => updateDraft({ productId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${getFieldError('productId') ? 'var(--color-error)' : 'var(--color-border)'}`,
                  backgroundColor: 'var(--color-background-body)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                }}
              >
                <option value="prod-astryx-001">Astryx UI Design System Kit (Pro)</option>
                <option value="prod-astryx-002">Context-Action Enterprise License</option>
                <option value="prod-astryx-003">TypeSpec Evidence CI Linter Platform</option>
              </select>
              {getFieldError('productId') && (
                <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '4px', display: 'block' }}>
                  {getFieldError('productId')}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                주문 수량
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={draft.quantity}
                disabled={isSubmitting}
                onChange={(e) => updateDraft({ quantity: parseInt(e.target.value, 10) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${getFieldError('quantity') ? 'var(--color-error)' : 'var(--color-border)'}`,
                  backgroundColor: 'var(--color-background-body)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                }}
              />
              {getFieldError('quantity') && (
                <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '4px', display: 'block' }}>
                  {getFieldError('quantity')}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                배송지 주소
              </label>
              <input
                type="text"
                value={draft.shippingAddress}
                disabled={isSubmitting}
                placeholder="도로명 주소 입력"
                onChange={(e) => updateDraft({ shippingAddress: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${getFieldError('shippingAddress') ? 'var(--color-error)' : 'var(--color-border)'}`,
                  backgroundColor: 'var(--color-background-body)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                }}
              />
              {getFieldError('shippingAddress') && (
                <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '4px', display: 'block' }}>
                  {getFieldError('shippingAddress')}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                결제 수단
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['credit_card', 'bank_transfer'].map((method) => (
                  <label
                    key={method}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px solid ${draft.paymentMethod === method ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      backgroundColor: draft.paymentMethod === method ? 'var(--color-background-muted)' : 'var(--color-background-body)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={draft.paymentMethod === method}
                      disabled={isSubmitting}
                      onChange={() => updateDraft({ paymentMethod: method })}
                    />
                    {method === 'credit_card' ? '신용카드' : '계좌이체'}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            <button
              onClick={submitOrder}
              disabled={isSubmitting}
              style={{
                flex: 2,
                padding: '12px',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-on-accent)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? '주문 처리 중...' : '주문서 제출'}
            </button>

            <button
              onClick={resetDraft}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'transparent',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              초기화
            </button>
          </div>

          {/* Result Alert Box */}
          {submission.orderId && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: 'var(--color-background-muted)',
                color: 'var(--color-text-primary)',
                borderRadius: '8px',
                borderLeft: '4px solid var(--color-success)',
              }}
            >
              <div style={{ fontWeight: '600', color: 'var(--color-success)', fontSize: '15px' }}>
                🎉 주문 체결 완료!
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                발급된 주문번호: <strong style={{ color: 'var(--color-text-primary)' }}>{submission.orderId}</strong>
              </div>
              <button
                onClick={retrySubmission}
                style={{
                  marginTop: '10px',
                  padding: '8px 14px',
                  backgroundColor: 'var(--color-background-surface)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                새 주문 작성하기
              </button>
            </div>
          )}
        </section>

        {/* Right Column: Activity Log */}
        <aside
          style={{
            backgroundColor: 'var(--color-background-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
              실시간 활동 로그
            </h3>
            <button
              onClick={() => setIsActivityOpen(!isActivityOpen)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: '2px 6px',
              }}
            >
              {isActivityOpen ? '접기' : '펼치기'}
            </button>
          </div>

          {isActivityOpen && (
            <div
              style={{
                flex: 1,
                backgroundColor: 'var(--color-background-body)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                fontFamily: 'var(--font-family-code, monospace)',
                overflowY: 'auto',
                maxHeight: '340px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {activityLog.map((log, index) => (
                <div key={index} style={{ color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>
                  {log}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
