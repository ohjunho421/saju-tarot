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

  const handleStartReading = () => {
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
      <header className="py-6 px-4 border-b border-white/20">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-mystical-gold via-primary-400 to-mystical-bronze bg-clip-text text-transparent">
              사주 만세력 타로
            </h1>
            <p className="text-white/70 mt-2">동양 철학과 서양 신비학의 만남</p>
          </div>
          
          {/* 로그인/로그아웃 버튼 */}
          <div className="absolute right-4 top-6">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep('mypage')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">마이페이지</span>
                </button>
                <button
                  onClick={() => setCurrentStep('history')}
                  className="flex items-center gap-2 px-4 py-2 bg-mystical-gold/20 hover:bg-mystical-gold/30 rounded-lg transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">히스토리</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">로그아웃</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span className="text-sm">로그인</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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

      <footer className="py-6 text-center text-white/50 text-sm border-t border-white/20 mt-12">
        <p>© 2025 사주 만세력 타로. 모든 권리 보유.</p>
        <p className="mt-2">* 본 서비스는 엔터테인먼트 목적으로 제공됩니다.</p>
        {isLoggedIn && (
          <p className="mt-2 text-mystical-gold">
            ✨ AI 기반 해석이 활성화되었습니다
          </p>
        )}
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
