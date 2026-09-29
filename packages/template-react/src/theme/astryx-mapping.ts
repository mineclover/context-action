/**
 * Astryx Design System - Astryx Compatibility Mapping
 * 
 * 사내 표준 시맨틱 토큰(CompanySemantics)을 Astryx core의
 * 표준 CSS 변수 토큰명(`--color-*`)으로 사상하는 어댑터 함수입니다.
 */

import type { CompanySemantics } from './semantics';

export function toAstryxTokens(s: CompanySemantics): Record<string, string> {
  return {
    // 액션 / 브랜드 악센트
    '--color-accent': s.action.primary,
    '--color-on-accent': s.action.onPrimary,
    '--color-accent-hover': s.action.primaryHover,
    '--color-text-accent': s.action.primary,
    '--color-icon-accent': s.action.primary,

    // 표면 (Surface)
    '--color-background-body': s.surface.canvas,
    '--color-background-surface': s.surface.default,
    '--color-background-card': s.surface.raised,
    '--color-background-popover': s.surface.raised,
    '--color-background-muted': s.surface.subtle,
    '--color-overlay': s.surface.overlay,

    // 텍스트 (Typography)
    '--color-text-primary': s.content.primary,
    '--color-text-secondary': s.content.secondary,
    '--color-text-disabled': s.content.disabled,
    '--color-text-inverse': s.content.inverse,

    // 아이콘 (Iconography)
    '--color-icon-primary': s.content.primary,
    '--color-icon-secondary': s.content.secondary,
    '--color-icon-disabled': s.content.disabled,

    // 테두리 및 포커스
    '--color-border': s.border.default,
    '--color-border-subtle': s.border.subtle,
    '--color-border-emphasized': s.border.emphasized,
    '--color-focus-ring': s.border.focusRing,

    // 상태 (Status)
    '--color-success': s.status.success,
    '--color-warning': s.status.warning,
    '--color-error': s.status.error,
    '--color-info': s.status.info,
  };
}
