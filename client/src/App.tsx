import { useState, useEffect } from 'react';
import axios from 'axios';
import type { IntegratedReading } from './types';
import HomePage from './pages/HomePage';
import ReadingPage from './pages/ReadingPage';
import IntegratedResult from './components/IntegratedResult';
import AuthModal from './components/AuthModal';
import MyPage from './pages/MyPage';
import HistoryPage from './pages/HistoryPage';
import KakaoSignupPage from './pages/KakaoSignupPage';
import PolicyPage from './pages/PolicyPage';
import LegalPage from './pages/LegalPage';
import { PRIVACY, TERMS } from './data/legal';
import ChargeModal, { confirmPayment } from './components/ChargeModal';
import { authApi, type KakaoSignupProfile } from './services/api';
import { takeKakaoRedirect, kakaoErrorMessage } from './services/kakaoRedirect';
import { formatPoints, usePointsStore } from './stores/points';
import { BUSINESS_LINES } from './data/business';
import { LogIn, LogOut, User, BookOpen, Coins } from 'lucide-react';

type Step = 'home' | 'reading' | 'result' | 'mypage' | 'history' | 'kakaoSignup' | 'policy' | 'terms' | 'privacy';

// 약관·방침·요금 안내는 주소로 바로 열 수 있다 (/?page=terms | privacy | policy)
// — 가입 창의 새 탭 링크와 결제사 심사 때 안내할 주소로 쓴다
function initialStep(): Step {
  const page = new URLSearchParams(window.location.search).get('page');
  return page === 'terms' || page === 'privacy' || page === 'policy' ? page : 'home';
}

function App() {
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [reading, setReading] = useState<IntegratedReading | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [kakaoSignup, setKakaoSignup] = useState<{ ticket: string; bind: string; profile: KakaoSignupProfile } | null>(null);
  const points = usePointsStore((state) => state.points);
  const paid = usePointsStore((state) => state.paid);
  const { refresh: refreshPoints, loadPrices, openCharge, closeCharge, setPoints, reset: resetPoints } = usePointsStore.getState();

  useEffect(() => {
    // 페이지 로드 시 로그인 상태 확인
    const checkLoginStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = await authApi.getMe();
          setIsLoggedIn(true);
          setUserName(user.name);
          refreshPoints();
        } catch (error) {
          // 토큰이 유효하지 않으면 로그아웃
          authApi.logout();
          setIsLoggedIn(false);
        }
      }
    };
    checkLoginStatus();
    loadPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 휴대폰 결제는 결제창이 다른 페이지로 갔다가 ?paymentId=... 를 달고 돌아온다 — 여기서 이어서 확인한다
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('paymentId');
    if (!paymentId) return;
    const failedMessage = params.get('code') ? params.get('message') || '결제가 완료되지 않았습니다.' : null;
    window.history.replaceState(null, '', window.location.pathname);
    if (!localStorage.getItem('token')) return;
    if (failedMessage) {
      openCharge(failedMessage);
      return;
    }
    confirmPayment(paymentId).then((result) => {
      if (result.status === 'paid') {
        setPoints(result.points);
        openCharge(`${formatPoints(result.charged)} 충전했어요.`);
      } else if (result.status === 'failed') {
        openCharge(result.message);
      } else {
        openCharge('결제 확인이 늦어지고 있어요. 결제가 완료됐다면 잠시 후 포인트가 자동으로 들어옵니다.');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 카카오 로그인에서 돌아왔을 때: 기존 회원은 로그인, 새 회원은 생년월일 확인 화면으로
  useEffect(() => {
    const redirect = takeKakaoRedirect();
    if (!redirect) return;
    if (redirect.kind === 'error') {
      setAuthNotice(kakaoErrorMessage(redirect.reason));
      setShowAuthModal(true);
      return;
    }
    authApi
      .kakaoSession(redirect.ticket, redirect.bind)
      .then((result) => {
        if (result.type === 'login') {
          handleAuthSuccess();
          return;
        }
        setKakaoSignup({ ticket: redirect.ticket, bind: redirect.bind, profile: result.profile });
        setCurrentStep('kakaoSignup');
      })
      .catch((error) => {
        // 서버 안내(이미 가입한 계정 등)가 있으면 그대로, 없으면 시간 초과 안내
        const serverMessage = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
        setAuthNotice(typeof serverMessage === 'string' ? serverMessage : kakaoErrorMessage('expired'));
        setShowAuthModal(true);
      });
  }, []);

  // 페이지 이동 시 맨 위로 스크롤
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleStartReading = () => {
    // 로그인 체크
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    setCurrentStep('reading');
  };

  const handleReadingComplete = (result: IntegratedReading) => {
    // 리딩 응답에 차감 후 잔액이 실려 온다. 무료 리딩 사용 여부까지 맞추려고 다시 불러온다
    if (typeof result.points === 'number') setPoints(result.points);
    refreshPoints();
    setReading(result);
    setCurrentStep('result');
  };

  const handleReset = () => {
    if (window.location.search.includes('page=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setCurrentStep('home');
    setReading(null);
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    setAuthNotice('');
    try {
      const user = await authApi.getMe();
      setIsLoggedIn(true);
      setUserName(user.name);
      refreshPoints();
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  // 가입을 마치면 저장된 생년월일로 바로 리딩을 시작한다
  const handleKakaoSignupDone = async () => {
    await handleAuthSuccess();
    setKakaoSignup(null);
    setCurrentStep('reading');
  };

  const handleKakaoSignupCancel = () => {
    setKakaoSignup(null);
    setCurrentStep('home');
  };

  const handleLogout = () => {
    authApi.logout();
    setIsLoggedIn(false);
    setUserName('');
    resetPoints();
    setCurrentStep('home');
  };

  const handleShowPolicy = () => {
    closeCharge();
    setCurrentStep('policy');
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-mystical-dark/80 border-b border-white/[0.06]">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            {/* 로고 */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-mystical-gold to-primary-400 bg-clip-text text-transparent whitespace-nowrap">
                별사탕
              </h1>
            </button>

            {/* 네비게이션 */}
            <div className="flex items-center gap-1.5 md:gap-2">
              {isLoggedIn ? (
                <>
                  {paid && (
                  <button
                    onClick={() => openCharge()}
                    aria-label={points !== null ? `포인트 ${formatPoints(points)}, 충전하기` : '포인트 충전하기'}
                    className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 text-mystical-gold hover:bg-mystical-gold/10 border border-mystical-gold/30 rounded-lg transition-all text-xs md:text-sm font-semibold"
                  >
                    <Coins className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>{points !== null ? formatPoints(points) : '충전'}</span>
                  </button>
                  )}
                  <button
                    onClick={() => setCurrentStep('mypage')}
                    className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all text-xs md:text-sm"
                  >
                    <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">{userName || '마이'}</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep('history')}
                    className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all text-xs md:text-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">기록</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 text-white/40 hover:text-red-400 hover:bg-red-500/[0.06] rounded-lg transition-all text-xs md:text-sm"
                  >
                    <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden md:inline">로그아웃</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg transition-all text-sm font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  <span>로그인</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        {currentStep === 'home' && (
          <HomePage onStart={handleStartReading} />
        )}
        
        {currentStep === 'reading' && (
          <ReadingPage 
            onComplete={handleReadingComplete}
            onBack={handleReset}
          />
        )}

        {currentStep === 'result' && reading && (
          <IntegratedResult 
            reading={reading}
            onReset={handleReset}
          />
        )}

        {currentStep === 'mypage' && isLoggedIn && (
          <MyPage 
            onLogout={handleLogout}
            onBack={handleReset}
          />
        )}

        {currentStep === 'history' && isLoggedIn && (
          <HistoryPage
            onBack={handleReset}
          />
        )}

        {currentStep === 'kakaoSignup' && kakaoSignup && (
          <KakaoSignupPage
            ticket={kakaoSignup.ticket}
            bind={kakaoSignup.bind}
            profile={kakaoSignup.profile}
            onDone={handleKakaoSignupDone}
            onCancel={handleKakaoSignupCancel}
          />
        )}

        {currentStep === 'policy' && (
          <PolicyPage onBack={handleReset} />
        )}

        {currentStep === 'terms' && (
          <LegalPage document={TERMS} onBack={handleReset} />
        )}

        {currentStep === 'privacy' && (
          <LegalPage document={PRIVACY} onBack={handleReset} />
        )}

      </main>

      <footer className="py-8 text-center text-white/30 text-xs border-t border-white/[0.06] mt-16">
        <p>&copy; 2025 별사탕 &middot; 엔터테인먼트 목적으로 제공됩니다</p>
        <nav className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1" aria-label="약관과 안내">
          <button onClick={() => setCurrentStep('terms')} className="underline hover:text-white/60">
            이용약관
          </button>
          <button onClick={() => setCurrentStep('privacy')} className="underline hover:text-white/60 font-semibold">
            개인정보처리방침
          </button>
          <button onClick={() => setCurrentStep('policy')} className="underline hover:text-white/60">
            요금과 환불 안내
          </button>
        </nav>
        {BUSINESS_LINES.length > 0 && (
          <p className="mt-3 max-w-3xl mx-auto px-4 leading-relaxed break-keep">{BUSINESS_LINES.join(' | ')}</p>
        )}
      </footer>

      {/* 로그인/회원가입 모달 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setAuthNotice('');
        }}
        onSuccess={handleAuthSuccess}
        notice={authNotice}
      />

      {/* 포인트 충전 */}
      <ChargeModal onShowPolicy={handleShowPolicy} />

    </div>
  );
}

export default App;
