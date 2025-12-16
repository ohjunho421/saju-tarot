import { useState } from 'react';
import type { SpreadType } from '../types';
import { Sparkles, Wand2, Loader2 } from 'lucide-react';
import { aiApi } from '../services/api';

interface TarotReadingProps {
  onComplete: (spreadType: SpreadType, question?: string, includeAdviceCard?: boolean) => void;
}

export default function TarotReading({ onComplete }: TarotReadingProps) {
  const [selectedSpread, setSelectedSpread] = useState<SpreadType>('one-card');
  const [question, setQuestion] = useState('');
  const [includeAdviceCard, setIncludeAdviceCard] = useState(true); // 조언 카드 기본 활성화
  const [aiRecommendation, setAiRecommendation] = useState<{
    analysis: string;
    recommendedSpread: SpreadType;
    reason: string;
  } | null>(null);
  const [analyzingQuestion, setAnalyzingQuestion] = useState(false);

  const spreads = [
    {
      type: 'one-card' as SpreadType,
      name: '원 카드',
      description: '간단한 질문에 대한 답',
      cards: 1
    },
    {
      type: 'three-card' as SpreadType,
      name: '쓰리 카드',
      description: '과거-현재-미래',
      cards: 3
    },
    {
      type: 'six-months' as SpreadType,
      name: '6개월 흐름',
      description: '향후 6개월의 월별 흐름',
      cards: 6
    },
    {
      type: 'celtic-cross' as SpreadType,
      name: '켈트 십자가',
      description: '종합적인 상황 분석',
      cards: 10
    },
    {
      type: 'saju-custom' as SpreadType,
      name: '사주 맞춤형',
      description: '오행별 카드 배치',
      cards: 5
    }
  ];

  // AI 질문 분석
  const analyzeQuestionWithAI = async () => {
    if (!question || question.length < 5) return;
    
    const token = localStorage.getItem('token');
    if (!token) return; // 로그인하지 않은 경우 AI 분석 스킵

    setAnalyzingQuestion(true);
    try {
      const recommendation = await aiApi.analyzeQuestion(question);
      setAiRecommendation(recommendation);
      setSelectedSpread(recommendation.recommendedSpread);
    } catch (error) {
      console.error('AI 질문 분석 실패:', error);
      // 실패해도 계속 진행
    } finally {
      setAnalyzingQuestion(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(selectedSpread, question || undefined, includeAdviceCard);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <Sparkles className="w-12 h-12 text-mystical-gold mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">타로 리딩</h2>
          <p className="text-white/70">스프레드를 선택하고 질문을 입력해주세요</p>
          <div className="mt-4 text-sm text-mystical-gold">
            📅 {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 질문 입력 */}
          <div>
            <label className="block mb-3 text-lg font-semibold">
              질문 (선택사항)
            </label>
            <textarea
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setAiRecommendation(null); // 질문 변경 시 추천 초기화
              }}
              placeholder="예: 올해 나의 재물운은 어떨까요?"
              className="input-field min-h-24 resize-none"
              maxLength={200}
            />
            <p className="text-xs text-white/50 mt-2">
              * 구체적인 질문일수록 더 명확한 답을 얻을 수 있습니다
            </p>
            
            {/* AI 스프레드 추천 후킹 영역 - 항상 눈에 띄게 표시 */}
            {localStorage.getItem('token') && (
              <div className="mt-4 p-4 bg-gradient-to-r from-primary-900/50 via-mystical-purple/30 to-primary-900/50 border-2 border-mystical-gold/50 rounded-xl">
                <div className="text-center mb-3">
                  <span className="inline-flex items-center gap-2 text-mystical-gold font-bold text-lg">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    AI 스프레드 추천
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </span>
                  <p className="text-white/70 text-sm mt-1">
                    질문을 입력하면 AI가 최적의 스프레드를 추천해드려요!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={analyzeQuestionWithAI}
                  disabled={analyzingQuestion || question.length < 5}
                  className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl transition-all transform ${
                    question.length >= 5 
                      ? 'bg-gradient-to-r from-mystical-gold via-yellow-500 to-mystical-gold bg-[length:200%_100%] animate-shimmer shadow-lg shadow-mystical-gold/30 hover:shadow-mystical-gold/50 hover:scale-[1.02]' 
                      : 'bg-mystical-gold/20 border border-mystical-gold/30 hover:bg-mystical-gold/30'
                  }`}
                >
                  {analyzingQuestion ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-dark-900" />
                      <span className="text-lg font-bold text-dark-900">AI가 분석하고 있어요...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className={`w-6 h-6 ${question.length >= 5 ? 'text-dark-900' : 'text-mystical-gold'}`} />
                      <span className={`text-lg font-bold ${question.length >= 5 ? 'text-dark-900' : 'text-mystical-gold'}`}>
                        ✨ AI 스프레드 추천받기
                      </span>
                    </>
                  )}
                </button>
                {question.length < 5 && (
                  <p className="text-center text-xs text-white/50 mt-2">
                    💡 질문을 5자 이상 입력하면 버튼이 활성화됩니다
                  </p>
                )}
              </div>
            )}
          </div>

          {/* AI 추천 결과 */}
          {aiRecommendation && (
            <div className="bg-gradient-to-r from-mystical-gold/20 to-primary-600/20 border border-mystical-gold/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-mystical-gold flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-mystical-gold mb-2">AI 추천</h4>
                  <p className="text-sm text-white/90 mb-2">{aiRecommendation.analysis}</p>
                  <div className="bg-white/10 rounded-lg p-3 mt-2">
                    <p className="text-sm font-semibold mb-1">
                      추천 스프레드: {spreads.find(s => s.type === aiRecommendation.recommendedSpread)?.name}
                    </p>
                    <p className="text-xs text-white/70">{aiRecommendation.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 스프레드 선택 */}
          <div>
            <label className="block mb-4 text-lg font-semibold">
              스프레드 선택
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              {spreads.map((spread) => (
                <button
                  key={spread.type}
                  type="button"
                  onClick={() => setSelectedSpread(spread.type)}
                  className={`text-left p-6 rounded-lg border-2 transition-all ${
                    selectedSpread === spread.type
                      ? 'bg-primary-600/30 border-primary-500'
                      : 'bg-white/5 border-white/20 hover:border-white/40'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{spread.name}</h3>
                    <span className="px-3 py-1 bg-mystical-gold/20 text-mystical-gold rounded-full text-sm">
                      {spread.cards}장
                    </span>
                  </div>
                  <p className="text-white/70">{spread.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 조언 카드 옵션 */}
          <div className="bg-mystical-gold/10 border border-mystical-gold/30 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAdviceCard}
                onChange={(e) => setIncludeAdviceCard(e.target.checked)}
                className="w-5 h-5 rounded border-mystical-gold/50 bg-white/10 text-mystical-gold focus:ring-mystical-gold"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-mystical-gold" />
                  <span className="font-semibold">조언 카드 추가</span>
                </div>
                <p className="text-sm text-white/70 mt-1">
                  해석 후 추가로 한 장의 조언 카드를 뽑아 실천 방안을 제시합니다
                </p>
              </div>
            </label>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="w-full btn-primary text-lg py-4"
          >
            카드 뽑기 {includeAdviceCard && '+ 조언 카드'}
          </button>
        </form>
      </div>

      {/* 스프레드 설명 */}
      <div className="mt-6 card">
        <h3 className="font-semibold mb-4">선택한 스프레드: {spreads.find(s => s.type === selectedSpread)?.name}</h3>
        <div className="text-white/70 space-y-2">
          {selectedSpread === 'one-card' && (
            <p>가장 간단한 스프레드로, 하나의 카드를 통해 현재 상황이나 질문에 대한 직접적인 답을 얻습니다.</p>
          )}
          {selectedSpread === 'three-card' && (
            <p>세 장의 카드로 과거-현재-미래의 흐름을 파악합니다. 상황의 원인과 현재, 그리고 앞으로의 전개를 볼 수 있습니다.</p>
          )}
          {selectedSpread === 'six-months' && (
            <p>향후 6개월 동안의 월별 흐름을 살펴봅니다. "언제 어떻게 될까?"와 같은 시기 관련 질문에 적합하며, 매달의 주요 에너지와 조언을 확인할 수 있습니다.</p>
          )}
          {selectedSpread === 'celtic-cross' && (
            <p>가장 복잡하고 상세한 스프레드입니다. 현재 상황, 장애물, 목표, 과거와 미래, 주변 영향 등을 종합적으로 분석합니다.</p>
          )}
          {selectedSpread === 'saju-custom' && (
            <p>사주의 오행(목화토금수)에 맞춰 특별히 고안된 스프레드입니다. 각 오행의 기운이 현재 어떻게 작용하고 있는지 확인합니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
