import { useState, useEffect } from 'react';
import type { IntegratedReading } from './types';
import HomePage from './pages/HomePage';
import ReadingPage from './pages/ReadingPage';
import IntegratedResult from './components/IntegratedResult';
import AuthModal from './components/AuthModal';
import MyPage from './pages/MyPage';
import HistoryPage from './pages/HistoryPage';
import { authApi } from './services/api';
import { LogIn, LogOut, User, BookOpen } from 'lucide-react';

function App() {
  const [currentStep, setCurrentStep] = useState<'home' | 'reading' | 'result' | 'mypage' | 'history'>('home');
  const [reading, setReading] = useState<IntegratedReading | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // 페이지 로드 시 로그인 상태 확인
    const checkLoginStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = await authApi.getMe();
          setIsLoggedIn(true);
          setUserName(user.name);
        } catch (error) {
          // 토큰이 유효하지 않으면 로그아웃
          authApi.logout();
          setIsLoggedIn(false);
        }
      }
    };
    checkLoginStatus();
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
    setReading(result);
    setCurrentStep('result');
  };

  const handleReset = () => {
    setCurrentStep('home');
    setReading(null);
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    try {
      const user = await authApi.getMe();
      setIsLoggedIn(true);
      setUserName(user.name);
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setIsLoggedIn(false);
    setUserName('');
    setCurrentStep('home');
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
                사주타로
              </h1>
            </button>

            {/* 네비게이션 */}
            <div className="flex items-center gap-1.5 md:gap-2">
              {isLoggedIn ? (
                <>
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

      </main>

      <footer className="py-8 text-center text-white/30 text-xs border-t border-white/[0.06] mt-16">
        <p>&copy; 2025 사주타로 &middot; 엔터테인먼트 목적으로 제공됩니다</p>
      </footer>

      {/* 로그인/회원가입 모달 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

    </div>
  );
}

export default App;
