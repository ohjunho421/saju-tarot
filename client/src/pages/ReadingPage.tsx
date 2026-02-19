import { useState, useEffect } from 'react';
import type { BirthInfo, SajuAnalysis, SpreadType, IntegratedReading } from '../types';
import BirthInfoForm from '../components/BirthInfoForm';
import SajuResult from '../components/SajuResult';
import TarotReading from '../components/TarotReading';
import CardSelection from '../components/CardSelection';
import { sajuApi, authApi } from '../services/api';
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

    try {
      // 로그인한 사용자만 접근 가능하므로 AI API 사용
      const { aiApi } = await import('../services/api');
      
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
      
      // 결과 표시
      onComplete(reading);
    } catch (err) {
      setError(err instanceof Error ? err.message : '타로 리딩 중 오류가 발생했습니다.');
    } finally {
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
