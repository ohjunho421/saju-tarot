import { useEffect, useState } from 'react';
import { authApi } from '../services/api';
import { prepareSocialBind } from '../services/kakaoRedirect';

// 구글 로그인 브랜드 가이드: 흰 바탕, #1F1F1F 글자, #747775 테두리, 4색 G 로고
export default function GoogleLoginButton() {
  const [starting, setStarting] = useState(false);
  const [failed, setFailed] = useState(false);

  // 구글 화면에서 뒤로 가기로 돌아오면(페이지 캐시 복원) 버튼을 다시 누를 수 있게 한다
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setStarting(false);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const handleClick = async () => {
    setStarting(true);
    setFailed(false);
    try {
      const bindHash = await prepareSocialBind('google');
      window.location.href = authApi.socialStartUrl('google', window.location.origin, bindHash);
    } catch {
      setStarting(false);
      setFailed(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={starting}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#747775] bg-white py-3 text-[15px] font-semibold text-[#1F1F1F] transition-colors duration-200 hover:bg-[#F2F2F2] active:translate-y-px disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        {starting ? 'Google로 이동하는 중…' : 'Google로 시작하기'}
      </button>
      {failed && (
        <p className="mt-2 text-center text-xs text-red-300" role="alert">
          이 브라우저에서는 구글 로그인을 시작하지 못했어요. 이메일로 로그인해 주세요.
        </p>
      )}
    </>
  );
}
