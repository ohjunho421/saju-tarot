import { useEffect, useState } from 'react';
import { authApi } from '../services/api';
import { prepareKakaoBind } from '../services/kakaoRedirect';

// 카카오 로그인 디자인 가이드: 노란 바탕(#FEE500), 85% 검정 글자, 말풍선 심볼
export default function KakaoLoginButton() {
  const [starting, setStarting] = useState(false);
  const [failed, setFailed] = useState(false);

  // 카카오 화면에서 뒤로 가기로 돌아오면(페이지 캐시 복원) 버튼을 다시 누를 수 있게 한다
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
      const bindHash = await prepareKakaoBind();
      window.location.href = authApi.kakaoStartUrl(window.location.origin, bindHash);
    } catch {
      // 저장소를 막아 둔 브라우저(일부 사생활 보호 모드) 등
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
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-[15px] font-semibold text-black/85 transition-[filter] duration-200 hover:brightness-95 active:translate-y-px disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FEE500] cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="text-black">
          <ellipse cx="9" cy="8" rx="8" ry="6.6" fill="currentColor" />
          <path d="M4.6 12.4 3.6 16.4 8.2 13.6Z" fill="currentColor" />
        </svg>
        {starting ? '카카오로 이동하는 중…' : '카카오로 시작하기'}
      </button>
      {failed && (
        <p className="mt-2 text-center text-xs text-red-300" role="alert">
          이 브라우저에서는 카카오 로그인을 시작하지 못했어요. 이메일로 로그인해 주세요.
        </p>
      )}
    </>
  );
}
