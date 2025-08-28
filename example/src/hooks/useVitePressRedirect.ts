import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
    const redirectPath = urlParams.get('redirect');

    if (redirectPath) {
      console.log('🔄 Processing VitePress redirect:', redirectPath);
      console.log('📍 From:', window.location.href);
      
      // React Router를 통해 원래 경로로 이동
      navigate(redirectPath, { replace: true });
      
      console.log('✅ Redirected to:', redirectPath);
    }
  }, [location.search, navigate]);
}
