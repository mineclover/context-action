import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }
  return false;
}

/**
 * Validate internal redirect paths from query parameters to prevent open redirects.
 */
export function sanitizeInternalRedirectPath(
  rawPath: string | null
): string | null {
  if (!rawPath) return null;

  const trimmed = rawPath.trim();
  if (
    trimmed.length === 0 ||
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    hasControlCharacter(trimmed)
  ) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, 'http://localhost');
    if (parsed.origin !== 'http://localhost') {
      return null;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

/**
 * VitePress에서 전달된 리디렉션 경로를 처리하는 훅
 *
 * VitePress에서 /example/* 경로로 접근할 때 SPA로 리디렉션하면서
 * 원래 경로 정보를 쿼리 파라미터로 전달하는 경우를 처리합니다.
 */
export function useVitePressRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const safePath = sanitizeInternalRedirectPath(urlParams.get('redirect'));

    if (safePath) {
      navigate(safePath, { replace: true });
    }
  }, [location.search, navigate]);
}
