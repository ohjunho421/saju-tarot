import { useState } from 'react';
import type { SpreadType, BirthInfo, MBTIType } from '../types';
import { MBTI_TYPES, MBTI_DESCRIPTIONS } from '../types';
import { Sparkles, Wand2, Loader2, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { aiApi } from '../services/api';

interface TarotReadingProps {
  onComplete: (spreadType: SpreadType, question?: string, includeAdviceCard?: boolean, partnerBirthInfo?: BirthInfo, partnerMbti?: MBTIType) => void;
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

  // 상대방 정보 입력 상태
  const [showPartnerInfo, setShowPartnerInfo] = useState(false);
  const [partnerMbti, setPartnerMbti] = useState<MBTIType | ''>('');
  const [partnerBirthInfo, setPartnerBirthInfo] = useState<{
    year: string;
    month: string;
    day: string;
    hour: string;
    hourUnknown: boolean;
    gender: 'male' | 'female';
    isLunar: boolean;
  }>({
    year: '',
    month: '',
    day: '',
    hour: '',
    hourUnknown: false,
    gender: 'female',
    isLunar: false,
  });

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
    },
    {
      type: 'compatibility' as SpreadType,
      name: '궁합 리딩',
      description: '두 사람의 에너지와 관계 흐름',
      cards: 4
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

  // 상대방 정보가 유효한지 확인 (최소: 년, 월, 일 입력)
  const isPartnerInfoValid = () => {
    if (!showPartnerInfo) return false;
    const y = parseInt(partnerBirthInfo.year);
    const m = parseInt(partnerBirthInfo.month);
    const d = parseInt(partnerBirthInfo.day);
    return y >= 1900 && y <= 2099 && m >= 1 && m <= 12 && d >= 1 && d <= 31;
  };

  // BirthInfo 객체로 변환
  const buildPartnerBirthInfo = (): BirthInfo | undefined => {
    if (!isPartnerInfoValid()) return undefined;
    return {
      year: parseInt(partnerBirthInfo.year),
      month: parseInt(partnerBirthInfo.month),
      day: parseInt(partnerBirthInfo.day),
      hour: partnerBirthInfo.hourUnknown ? undefined : (partnerBirthInfo.hour ? parseInt(partnerBirthInfo.hour) : undefined),
      isLunar: partnerBirthInfo.isLunar,
      gender: partnerBirthInfo.gender,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const partnerInfo = buildPartnerBirthInfo();
    onComplete(selectedSpread, question || undefined, includeAdviceCard, partnerInfo, partnerMbti || undefined);
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
          </div>

          {/* 상대방 정보 입력 (질문 바로 아래) */}
          <div className="border border-white/20 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPartnerInfo(!showPartnerInfo)}
              className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-pink-400" />
                <div className="text-left">
                  <span className="font-semibold">상대방 정보 입력</span>
                  <span className="text-sm text-white/50 ml-2">(선택사항)</span>
                  {isPartnerInfoValid() && (
                    <span className="ml-2 text-xs text-pink-400">✓ 입력됨</span>
                  )}
                </div>
              </div>
              {showPartnerInfo ? (
                <ChevronUp className="w-5 h-5 text-white/50" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white/50" />
              )}
            </button>

            {showPartnerInfo && (
              <div className="p-5 bg-white/5 space-y-4 border-t border-white/10">
                <p className="text-sm text-white/60">
                  상대방의 생년월일을 입력하면 사주 궁합을 분석해 해석에 반영합니다.
                </p>

                {/* 음력/양력 선택 */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPartnerBirthInfo(p => ({ ...p, isLunar: false }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !partnerBirthInfo.isLunar
                        ? 'bg-primary-600 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/15'
                    }`}
                  >
                    양력
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartnerBirthInfo(p => ({ ...p, isLunar: true }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      partnerBirthInfo.isLunar
                        ? 'bg-primary-600 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/15'
                    }`}
                  >
                    음력
                  </button>
                </div>

                {/* 생년월일 */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">년도</label>
                    <input
                      type="number"
                      value={partnerBirthInfo.year}
                      onChange={(e) => setPartnerBirthInfo(p => ({ ...p, year: e.target.value }))}
                      placeholder="예: 1995"
                      min={1900}
                      max={2099}
                      className="input-field text-sm py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">월</label>
                    <input
                      type="number"
                      value={partnerBirthInfo.month}
                      onChange={(e) => setPartnerBirthInfo(p => ({ ...p, month: e.target.value }))}
                      placeholder="1~12"
                      min={1}
                      max={12}
                      className="input-field text-sm py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">일</label>
                    <input
                      type="number"
                      value={partnerBirthInfo.day}
                      onChange={(e) => setPartnerBirthInfo(p => ({ ...p, day: e.target.value }))}
                      placeholder="1~31"
                      min={1}
                      max={31}
                      className="input-field text-sm py-2"
                    />
                  </div>
                </div>

                {/* 시간 입력 */}
                <div>
                  <label className="block text-xs text-white/60 mb-2">태어난 시간</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={partnerBirthInfo.hourUnknown ? '' : partnerBirthInfo.hour}
                      onChange={(e) => setPartnerBirthInfo(p => ({ ...p, hour: e.target.value, hourUnknown: false }))}
                      placeholder="0~23 (24시간)"
                      min={0}
                      max={23}
                      disabled={partnerBirthInfo.hourUnknown}
                      className={`input-field text-sm py-2 flex-1 ${partnerBirthInfo.hourUnknown ? 'opacity-40 cursor-not-allowed' : ''}`}
                    />
                    <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={partnerBirthInfo.hourUnknown}
                        onChange={(e) => setPartnerBirthInfo(p => ({ ...p, hourUnknown: e.target.checked, hour: '' }))}
                        className="w-4 h-4 rounded border-white/30 bg-white/10 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-white/70">모름</span>
                    </label>
                  </div>
                </div>

                {/* 성별 */}
                <div>
                  <label className="block text-xs text-white/60 mb-2">성별</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPartnerBirthInfo(p => ({ ...p, gender: 'male' }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        partnerBirthInfo.gender === 'male'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/15'
                      }`}
                    >
                      남성
                    </button>
                    <button
                      type="button"
                      onClick={() => setPartnerBirthInfo(p => ({ ...p, gender: 'female' }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        partnerBirthInfo.gender === 'female'
                          ? 'bg-pink-600 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/15'
                      }`}
                    >
                      여성
                    </button>
                  </div>
                </div>

                {/* MBTI 선택 */}
                <div>
                  <label className="block text-xs text-white/60 mb-2">MBTI <span className="text-white/40">(선택사항)</span></label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MBTI_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPartnerMbti(p => p === type ? '' : type)}
                        className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          partnerMbti === type
                            ? 'bg-primary-600 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/15'
                        }`}
                        title={MBTI_DESCRIPTIONS[type].name}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  {partnerMbti && (
                    <p className="text-xs text-primary-400 mt-1.5">
                      선택됨: {partnerMbti} ({MBTI_DESCRIPTIONS[partnerMbti].name} {MBTI_DESCRIPTIONS[partnerMbti].emoji})
                    </p>
                  )}
                </div>

                {isPartnerInfoValid() && (
                  <div className="flex items-center gap-2 text-sm text-pink-400 bg-pink-400/10 rounded-lg px-3 py-2">
                    <Heart className="w-4 h-4" />
                    <span>상대방 정보가 입력되었습니다. 궁합 분석이 포함됩니다.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI 스프레드 추천 */}
          <div>
            {/* AI 스프레드 추천 후킹 영역 - 항상 눈에 띄게 표시 */}
            {localStorage.getItem('token') && (
              <div className="p-4 bg-gradient-to-r from-primary-900/50 via-mystical-purple/30 to-primary-900/50 border-2 border-mystical-gold/50 rounded-xl">
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
          {selectedSpread === 'compatibility' && (
            <p>두 사람의 에너지와 관계를 네 장의 카드로 분석합니다. 나의 기운, 상대방의 기운, 두 사람의 관계, 앞으로의 흐름을 살펴봅니다. 상대방 정보를 입력하면 사주 궁합도 함께 분석됩니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
