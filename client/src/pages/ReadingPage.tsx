import { useState, useEffect, useRef, useCallback } from 'react';
import type { BirthInfo, SajuAnalysis, SpreadType, IntegratedReading } from '../types';
import BirthInfoForm from '../components/BirthInfoForm';
import SajuResult from '../components/SajuResult';
import TarotReading from '../components/TarotReading';
import CardSelection from '../components/CardSelection';
import { sajuApi, authApi, aiApi } from '../services/api';
import { Loader2 } from 'lucide-react';

interface ReadingPageProps {
  onComplete: (reading: IntegratedReading) => void;
  onBack: () => void;
}

export default function ReadingPage({ onComplete, onBack }: ReadingPageProps) {
  const [step, setStep] = useState<'birth' | 'saju' | 'tarot' | 'cardSelection'>('birth');
  const [sajuAnalysis, setSajuAnalysis] = useState<SajuAnalysis | null>(null);
  const [selectedSpread, setSelectedSpread] = useState<SpreadType | null>(null);
  const [question, setQuestion] = useState<string>('');
  const [includeAdviceCard, setIncludeAdviceCard] = useState<boolean>(false);
  const [partnerBirthInfo, setPartnerBirthInfo] = useState<BirthInfo | undefined>(undefined);
  const [partnerMbti, setPartnerMbti] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingReadingRef = useRef(false);

  // AI 해석 중 화면 잠금 방지 (Wake Lock API)
  useEffect(() => {
    if (!loading || !('wakeLock' in navigator)) return;
    let wakeLock: WakeLockSentinel | null = null;
    navigator.wakeLock.request('screen').then((lock) => {
      wakeLock = lock;
    }).catch(() => {});
    return () => {
      wakeLock?.release();
    };
  }, [loading]);

  // 화면 복귀 시 진행 중이던 리딩 결과 복구
  const recoverPendingReading = useCallback(async () => {
    const pending = localStorage.getItem('pendingReading');
    if (!pending) return;

    try {
      const { timestamp, question: pendingQ, spreadType: pendingST } = JSON.parse(pending);
      // 5분 이내 요청만 복구 시도
      if (Date.now() - timestamp > 5 * 60 * 1000) {
        localStorage.removeItem('pendingReading');
        return;
      }

      // 서버에서 최신 리딩 조회
      const result = await aiApi.getMyReadings(1, 1);
      if (result?.readings?.length > 0) {
        const latest = result.readings[0];
        const readingTime = new Date(latest.createdAt).getTime();
        // 요청 시점 이후에 생성된 리딩이며 질문/스프레드가 일치하면 복구
        if (
          readingTime >= timestamp - 5000 &&
          latest.spreadType === pendingST &&
          (latest.question === pendingQ || (!latest.question && !pendingQ))
        ) {
          localStorage.removeItem('pendingReading');
          // 전체 리딩 상세 조회
          const fullReading = await aiApi.getReadingById(latest.id);
          if (fullReading) {
            setLoading(false);
            pendingReadingRef.current = false;
            onComplete(fullReading);
            return;
          }
        }
      }
    } catch (err) {
      console.error('리딩 복구 실패:', err);
    }
  }, [onComplete]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pendingReadingRef.current) {
        // 화면 복귀 후 잠시 대기 (서버가 처리 완료할 시간)
        setTimeout(() => recoverPendingReading(), 2000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [recoverPendingReading]);

  // 앱 로드 시 이전에 완료되지 못한 리딩 복구 시도
  useEffect(() => {
    const pending = localStorage.getItem('pendingReading');
    if (pending) {
      setLoading(true);
      pendingReadingRef.current = true;
      recoverPendingReading().then(() => {
        if (pendingReadingRef.current) {
          // 복구 실패 - pending 정리하고 정상 플로우로
          localStorage.removeItem('pendingReading');
          pendingReadingRef.current = false;
          setLoading(false);
        }
      });
    }
  }, [recoverPendingReading]);

  // 로그인한 사용자 정보 자동 로드
  useEffect(() => {
    const loadUserInfo = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // 비로그인 사용자는 접근 불가
        setError('로그인이 필요한 서비스입니다. 홈으로 돌아가서 로그인해주세요.');
        setTimeout(() => {
          onBack();
        }, 2000);
        return;
      }
      
      try {
        const user = await authApi.getMe();
        if (user.birthInfo && user.sajuAnalysis) {
          setSajuAnalysis(user.sajuAnalysis as SajuAnalysis);
          setStep('tarot'); // 생년월일 입력과 사주 분석 모두 스킵하고 바로 타로 리딩으로
        }
        // 사용자 정보가 없어도 계속 진행 (생년월일 입력부터 시작)
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        // 에러가 나도 토큰이 있으면 진행 허용 (생년월일 입력부터)
      }
    };
    loadUserInfo();
  }, [onBack]);

  const handleBirthInfoSubmit = async (info: BirthInfo) => {
    setLoading(true);
    setError(null);
    
    try {
      const analysis = await sajuApi.analyze(info);
      setSajuAnalysis(analysis);
      setStep('saju');
    } catch (err) {
      setError(err instanceof Error ? err.message : '사주 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToTarot = () => {
    setStep('tarot');
  };

  const handleTarotComplete = async (spreadType: SpreadType, userQuestion?: string, includeAdvice?: boolean, partnerInfo?: BirthInfo, mbti?: string) => {
    console.log('🎴 handleTarotComplete 호출:', { spreadType, userQuestion, includeAdvice, hasPartner: !!partnerInfo, partnerMbti: mbti });

    // State를 먼저 모두 설정한 후 다음 렌더링에서 step 변경
    setSelectedSpread(spreadType);
    setQuestion(userQuestion || '');
    setIncludeAdviceCard(includeAdvice || false);
    setPartnerBirthInfo(partnerInfo);
    setPartnerMbti(mbti);

    // setTimeout을 사용하여 state 업데이트 후 step 전환 보장
    setTimeout(() => {
      console.log('📍 cardSelection 단계로 전환');
      setStep('cardSelection');
    }, 0);
  };

  const handleCardSelectionComplete = async (selectedCards: { cardIndex: number; isReversed: boolean }[]) => {
    if (!selectedSpread || !sajuAnalysis) return;

    // 사용자가 카드를 모두 선택 완료 - 이제 AI 해석 시작
    setLoading(true);
    setError(null);
    pendingReadingRef.current = true;

    // 화면 꺼짐 대비: 진행 중인 리딩 정보를 localStorage에 저장
    localStorage.setItem('pendingReading', JSON.stringify({
      timestamp: Date.now(),
      question,
      spreadType: selectedSpread,
    }));

    try {
      // 사주 분석과 조언 카드 포함 여부를 함께 전달 (역방향 정보 포함)
      const reading = await aiApi.getAIReading(
        question,
        selectedSpread,
        sajuAnalysis,
        selectedCards,
        includeAdviceCard,
        partnerBirthInfo,
        partnerMbti
      );

      // 정상 완료 - pending 정리
      localStorage.removeItem('pendingReading');
      pendingReadingRef.current = false;
      onComplete(reading);
    } catch (err) {
      // 네트워크 에러(화면 꺼짐으로 인한)인 경우 복구 시도
      if (pendingReadingRef.current) {
        // 3초 후 서버에서 결과 복구 시도
        setTimeout(async () => {
          try {
            await recoverPendingReading();
          } catch {
            // 복구 실패 시 에러 표시
          }
          if (pendingReadingRef.current) {
            pendingReadingRef.current = false;
            setError('타로 리딩 중 연결이 끊어졌습니다. 다시 시도해주세요.');
            setLoading(false);
          }
        }, 3000);
        return;
      }
      setError(err instanceof Error ? err.message : '타로 리딩 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  if (loading) {
    const loadingMessage = step === 'birth' 
      ? '사주를 분석하고 있습니다...' 
      : '✨ 선택하신 카드를 해석하고 있습니다...';
    
    const subMessage = step === 'birth'
      ? '잠시만 기다려주세요'
      : 'AI가 선택한 카드의 의미를 깊이 분석하고 있습니다';
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-16 h-16 text-primary-400 animate-spin mb-4" />
        <p className="text-xl text-white/80">{loadingMessage}</p>
        <p className="text-white/60 mt-2">{subMessage}</p>
        {step !== 'birth' && (
          <p className="text-white/40 text-sm mt-4">화면이 꺼져도 결과는 자동으로 복구됩니다</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto card text-center">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-4">오류가 발생했습니다</h2>
        <p className="text-white/80 mb-6">{error}</p>
        <div className="flex gap-4 justify-center">
          <button onClick={onBack} className="btn-secondary">
            처음으로
          </button>
          <button
            onClick={() => {
              setError(null);
              if (step === 'tarot') {
                setStep('saju');
              } else {
                setStep('birth');
              }
            }}
            className="btn-primary"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 진행 표시 */}
      <div className="mb-6 md:mb-8 px-4">
        <div className="flex justify-center items-center gap-2 md:gap-4">
          <div className={`flex items-center gap-1 md:gap-2 ${step === 'birth' ? 'text-primary-400' : 'text-white/50'}`}>
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-sm md:text-base ${
              step !== 'birth' ? 'bg-primary-600' : 'bg-white/20'
            }`}>
              {step !== 'birth' ? '✓' : '1'}
            </div>
            <span className="text-xs md:text-base">생년월일시</span>
          </div>
          <div className="w-8 md:w-16 h-1 bg-white/20 rounded" />
          <div className={`flex items-center gap-1 md:gap-2 ${step === 'saju' ? 'text-primary-400' : step === 'tarot' ? 'text-white/50' : 'text-white/30'}`}>
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-sm md:text-base ${
              step === 'tarot' ? 'bg-primary-600' : step === 'saju' ? 'bg-white/20' : 'bg-white/10'
            }`}>
              {step === 'tarot' ? '✓' : '2'}
            </div>
            <span className="text-xs md:text-base">사주 분석</span>
          </div>
          <div className="w-8 md:w-16 h-1 bg-white/20 rounded" />
          <div className={`flex items-center gap-1 md:gap-2 ${step === 'tarot' ? 'text-primary-400' : 'text-white/30'}`}>
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-sm md:text-base ${
              step === 'tarot' ? 'bg-white/20' : 'bg-white/10'
            }`}>
              3
            </div>
            <span className="text-xs md:text-base">타로 리딩</span>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      {step === 'birth' && (
        <BirthInfoForm onSubmit={handleBirthInfoSubmit} />
      )}

      {step === 'saju' && sajuAnalysis && (
        <div>
          <SajuResult analysis={sajuAnalysis} />
          <div className="text-center mt-8">
            <button onClick={handleContinueToTarot} className="btn-primary text-lg px-12 py-4">
              타로 리딩 시작
            </button>
          </div>
        </div>
      )}

      {step === 'tarot' && (
        <TarotReading onComplete={handleTarotComplete} />
      )}

      {step === 'cardSelection' && (() => {
        console.log('🔍 cardSelection 렌더링 조건:', { 
          step, 
          selectedSpread, 
          shouldRender: !!selectedSpread 
        });
        
        if (!selectedSpread) {
          return (
            <div className="text-center text-white">
              ⚠️ selectedSpread가 null입니다. 다시 시도해주세요.
            </div>
          );
        }
        
        return (
          <CardSelection 
            spreadType={selectedSpread}
            question={question}
            includeAdviceCard={includeAdviceCard}
            onComplete={handleCardSelectionComplete}
          />
        );
      })()}

      {/* 뒤로가기 버튼 */}
      <div className="text-center mt-8">
        <button
          onClick={() => {
            if (step === 'birth') {
              onBack();
            } else if (step === 'saju') {
              setStep('birth');
            } else {
              setStep('saju');
            }
          }}
          className="text-white/60 hover:text-white transition-colors"
        >
          ← 이전으로
        </button>
      </div>
    </div>
  );
}
