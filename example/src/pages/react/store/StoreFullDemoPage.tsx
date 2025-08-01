import { StoreProvider } from '@context-action/react';
import CounterDemo from './demo/CounterDemo';
import ThemeDemo from './demo/ThemeDemo';
import UserDemo from './demo/UserDemo';
import CartDemo from './demo/CartDemo';
import ComputedStoreDemo from './demo/ComputedStoreDemo';
import PersistedStoreDemo from './demo/PersistedStoreDemo';
import StoreLifecycleDemo from './demo/StoreLifecycleDemo';
import MetadataDemo from './demo/MetadataDemo';
import StoreRegistryViewer from './demo/StoreRegistryViewer';

export function StoreFullDemoPage() {
  return (
    <StoreProvider>
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
              🏪 Store System - Full Demo
            </h1>
            <span style={{
              marginLeft: '12px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: '#fce4ec',
              color: '#c2185b',
              borderRadius: '12px'
            }}>
              고급
            </span>
          </div>
          <p style={{ 
            fontSize: '16px', 
            color: '#64748b', 
            lineHeight: '1.6',
            marginBottom: '20px'
          }}>
            8가지 실제 애플리케이션 시나리오로 Store 시스템의 모든 기능을 체험해보세요.
          </p>

          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #0ea5e9',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '16px', marginRight: '8px' }}>🎯</span>
              <strong style={{ color: '#0369a1', fontSize: '14px' }}>
                실제 프로덕션 패턴
              </strong>
            </div>
            <p style={{ 
              color: '#0369a1', 
              fontSize: '13px', 
              margin: 0,
              lineHeight: '1.5'
            }}>
              각 데모는 실제 애플리케이션에서 사용할 수 있는 패턴들을 보여줍니다. 
              오른쪽 레지스트리 뷰어에서 모든 스토어의 상태를 실시간으로 확인할 수 있습니다.
            </p>
          </div>

          <div style={{
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
              🧪 이 데모에서 배우는 핵심 개념
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '16px',
              fontSize: '14px'
            }}>
              <div>
                <strong style={{ color: '#0f172a' }}>StoreRegistry:</strong>
                <div style={{ color: '#64748b', marginTop: '4px' }}>
                  중앙화된 스토어 관리와 메타데이터
                </div>
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>Persistence:</strong>
                <div style={{ color: '#64748b', marginTop: '4px' }}>
                  LocalStorage 통합과 크로스탭 동기화
                </div>
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>Computed Values:</strong>
                <div style={{ color: '#64748b', marginTop: '4px' }}>
                  다중 스토어 의존성과 파생 값
                </div>
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>Lifecycle Management:</strong>
                <div style={{ color: '#64748b', marginTop: '4px' }}>
                  동적 스토어 생성과 자동 정리
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 350px',
          gap: '32px',
          marginBottom: '32px'
        }}>
          <div>
            <section style={{ marginBottom: '40px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '24px',
                paddingBottom: '12px',
                borderBottom: '2px solid #e2e8f0'
              }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  🎮 핵심 기능 데모
                </h2>
              </div>
              <p style={{ 
                color: '#64748b', 
                fontSize: '14px', 
                marginBottom: '24px',
                lineHeight: '1.5'
              }}>
                기본적인 스토어 사용 패턴들을 실제 애플리케이션 시나리오로 구현했습니다.
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                <CounterDemo />
                <ThemeDemo />
                <UserDemo />
                <CartDemo />
              </div>
            </section>

            <section>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '24px',
                paddingBottom: '12px',
                borderBottom: '2px solid #e2e8f0'
              }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  🚀 고급 기능 데모
                </h2>
              </div>
              <p style={{ 
                color: '#64748b', 
                fontSize: '14px', 
                marginBottom: '24px',
                lineHeight: '1.5'
              }}>
                복잡한 상태 관리와 고급 패턴들을 보여주는 전문가 수준의 데모입니다.
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                <ComputedStoreDemo />
                <PersistedStoreDemo />
                <StoreLifecycleDemo />
                <MetadataDemo />
              </div>
            </section>
          </div>

          <aside style={{
            position: 'sticky',
            top: '20px',
            height: 'fit-content'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                padding: '20px 20px 16px',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    📊 실시간 레지스트리
                  </h3>
                </div>
                <p style={{ 
                  color: '#64748b', 
                  fontSize: '13px', 
                  margin: '8px 0 0',
                  lineHeight: '1.4'
                }}>
                  모든 스토어의 상태와 메타데이터를 실시간으로 확인
                </p>
              </div>
              <StoreRegistryViewer />
            </div>
          </aside>
        </div>

        {/* 동작 원리 설명 */}
        <div style={{
          padding: '32px',
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ 
            margin: '0 0 24px 0', 
            fontSize: '24px', 
            fontWeight: '700',
            color: '#1e293b'
          }}>
            🔍 Store 시스템 아키텍처 분석
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* 핵심 기능 시나리오 */}
            <div style={{
              padding: '24px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#1e293b'
              }}>
                🎮 핵심 기능별 구현 패턴
              </h3>
              
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>🔢</span>
                    <strong>Counter Store</strong>
                  </div>
                  <div style={{ color: '#64748b', paddingLeft: '24px' }}>
                    NumericStore + 히스토리 추적으로 undo/redo 기능 구현
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>🎨</span>
                    <strong>Theme Store</strong>
                  </div>
                  <div style={{ color: '#64748b', paddingLeft: '24px' }}>
                    localStorage 연동으로 테마 설정 영속화
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>👤</span>
                    <strong>User Store</strong>
                  </div>
                  <div style={{ color: '#64748b', paddingLeft: '24px' }}>
                    인증 상태와 프로필 관리, 세션 유지
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>🛒</span>
                    <strong>Shopping Cart</strong>
                  </div>
                  <div style={{ color: '#64748b', paddingLeft: '24px' }}>
                    복잡한 객체 상태와 자동 계산 로직
                  </div>
                </div>
              </div>
            </div>

            {/* 고급 기능 패턴 */}
            <div style={{
              padding: '24px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#1e293b'
              }}>
                🚀 고급 기능별 구현 패턴
              </h3>
              
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>📊</span>
                    <strong>Computed Stores</strong>
                  </div>
                  <div style={{ color: '#64748b', paddingLeft: '24px' }}>
                    다중 스토어 의존성과 자동 파생 값 계산
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>💾</span>
                    <strong>Persistence</strong>
                  </div>
                  <div style={{ color: '#64748b', paddingLeft: '24px' }}>
                    LocalStorage 통합과 크로스탭 동기화
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>🔄</span>
                    <strong>Lifecycle</strong>
                  </div>
                  <div style={{ color: '#64748b', paddingLeft: '24px' }}>
                    동적 스토어 생성과 자동 가비지 컬렉션
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>🏷️</span>
                    <strong>Metadata</strong>
                  </div>
                  <div style={{ color: '#64748b', paddingLeft: '24px' }}>
                    WeakMap 기반 메타데이터로 메모리 효율성 확보
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 아키텍처 특징 */}
          <div style={{
            padding: '24px',
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            border: '1px solid #fbbf24'
          }}>
            <h4 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#92400e'
            }}>
              🏗️ 엔터프라이즈급 아키텍처 특징
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              color: '#92400e',
              fontSize: '14px'
            }}>
              <div>
                <strong>중앙화된 관리:</strong>
                <div style={{ marginTop: '4px' }}>
                  StoreRegistry로 모든 스토어를 통합 관리
                </div>
              </div>
              <div>
                <strong>메모리 효율성:</strong>
                <div style={{ marginTop: '4px' }}>
                  WeakMap 메타데이터로 자동 가비지 컬렉션
                </div>
              </div>
              <div>
                <strong>실시간 모니터링:</strong>
                <div style={{ marginTop: '4px' }}>
                  모든 스토어 상태를 실시간으로 추적
                </div>
              </div>
              <div>
                <strong>영속성 지원:</strong>
                <div style={{ marginTop: '4px' }}>
                  LocalStorage와 크로스탭 동기화
                </div>
              </div>
              <div>
                <strong>계산된 값:</strong>
                <div style={{ marginTop: '4px' }}>
                  다중 스토어 의존성 자동 해결
                </div>
              </div>
              <div>
                <strong>동적 생명주기:</strong>
                <div style={{ marginTop: '4px' }}>
                  런타임 스토어 생성/삭제와 자동 정리
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreProvider>
  );
}