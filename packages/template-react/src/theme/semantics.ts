/**
 * Astryx Design System - Semantic Tokens
 * 
 * 역할을 부여한 시맨틱 디자인 토큰 정의 (Action, Surface, Content, Border, Status)
 */

import { brandPrimitives } from './primitives';

export interface CompanySemantics {
  action: {
    primary: string;
    onPrimary: string;
    primaryHover: string;
  };
  surface: {
    canvas: string;
    default: string;
    raised: string;
    subtle: string;
    overlay: string;
  };
  content: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  border: {
    default: string;
    subtle: string;
    emphasized: string;
    focusRing: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export const brandSemanticsLight: CompanySemantics = {
  action: {
    primary: brandPrimitives.color.brand[500],
    onPrimary: '#ffffff',
    primaryHover: brandPrimitives.color.brand[600],
  },
  surface: {
    canvas: brandPrimitives.color.neutral[50],
    default: '#ffffff',
    raised: '#ffffff',
    subtle: brandPrimitives.color.neutral[100],
    overlay: 'rgba(15, 23, 42, 0.5)',
  },
  content: {
    primary: brandPrimitives.color.neutral[900],
    secondary: brandPrimitives.color.neutral[500],
    disabled: brandPrimitives.color.neutral[400],
    inverse: '#ffffff',
  },
  border: {
    default: brandPrimitives.color.neutral[200],
    subtle: brandPrimitives.color.neutral[100],
    emphasized: brandPrimitives.color.neutral[300],
    focusRing: brandPrimitives.color.brand[500],
  },
  status: {
    success: brandPrimitives.color.success[500],
    warning: brandPrimitives.color.warning[500],
    error: brandPrimitives.color.error[500],
    info: brandPrimitives.color.info[500],
  },
};

export const brandSemanticsDark: CompanySemantics = {
  action: {
    primary: brandPrimitives.color.brand[500],
    onPrimary: '#ffffff',
    primaryHover: brandPrimitives.color.brand[600],
  },
  surface: {
    canvas: brandPrimitives.color.neutral[950],
    default: brandPrimitives.color.neutral[900],
    raised: brandPrimitives.color.neutral[800],
    subtle: brandPrimitives.color.neutral[800],
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    primary: brandPrimitives.color.neutral[50],
    secondary: brandPrimitives.color.neutral[400],
    disabled: brandPrimitives.color.neutral[500],
    inverse: brandPrimitives.color.neutral[900],
  },
  border: {
    default: brandPrimitives.color.neutral[700],
    subtle: brandPrimitives.color.neutral[800],
    emphasized: brandPrimitives.color.neutral[500],
    focusRing: brandPrimitives.color.brand[500],
  },
  status: {
    success: brandPrimitives.color.success[500],
    warning: brandPrimitives.color.warning[500],
    error: brandPrimitives.color.error[500],
    info: brandPrimitives.color.info[500],
  },
};
