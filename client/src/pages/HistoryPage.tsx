import { useState, useEffect } from 'react';
import { BookOpen, Trash2, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import EasyReadingView from '../components/EasyReadingView';

const CARD_DETAILS_SEPARATOR = '===CARD_DETAILS===';

const SPREAD_LABELS: Record<string, string> = {
  'one-card': '원카드',
  'two-card': '투카드',
  'three-card': '쓰리카드',
  'celtic-cross': '켈트 십자',
  'saju-custom': '사주 맞춤',
  'six-months': '6개월 흐름',
  'yes-no': '예/아니오',
  'problem-solution': '문제-해결',
  'compatibility': '궁합',
  'daily-fortune': '오늘의 운세',
};

interface HistoryPageProps {
  onBack: () => void;
}

export default function HistoryPage({ onBack }: HistoryPageProps) {
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadReadings();
  }, []);

  const loadReadings = async () => {
    try {
      // localStorage에서 히스토리 불러오기
      const savedHistory = localStorage.getItem('tarot_history');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        setReadings(history);
      } else {
        setReadings([]);
      }
    } catch (err: any) {
      setError('히스토리를 불러올 수 없습니다');
      console.error('히스토리 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReading = (id: string) => {
    if (!confirm('이 리딩 기록을 삭제하시겠습니까?')) return;
    
    try {
      const newReadings = readings.filter(r => r.id !== id);
      setReadings(newReadings);
      localStorage.setItem('tarot_history', JSON.stringify(newReadings));
      if (expandedId === id) {
        setExpandedId(null);
      }
    } catch (err) {
      alert('삭제에 실패했습니다');
      console.error(err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getSpreadTypeLabel = (spreadType: string) => SPREAD_LABELS[spreadType] || spreadType;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-white/60">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto card text-center">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-4">오류가 발생했습니다</h2>
        <p className="text-white/80 mb-6">{error}</p>
        <button onClick={onBack} className="btn-primary">
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="card">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-8 h-8 text-mystical-gold" />
          <h1 className="text-3xl font-bold">타로 리딩 히스토리</h1>
        </div>
        <p className="text-white/60">
          총 {readings.length}개의 리딩 기록이 있습니다
        </p>
      </div>

      {/* 리딩 목록 */}
      {readings.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">아직 리딩 기록이 없습니다</h3>
          <p className="text-white/60 mb-6">
            타로 리딩을 시작하면 여기에 기록이 저장됩니다
          </p>
          <button onClick={onBack} className="btn-primary">
            타로 보러 가기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {readings.map((reading) => (
            <div
              key={reading.id}
              className="card hover:bg-white/5 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* 날짜와 태그 */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Calendar className="w-4 h-4" />
                      {new Date(reading.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <span className="px-3 py-1 bg-primary-600/30 rounded-full text-xs font-semibold">
                      {getSpreadTypeLabel(reading.spreadType)}
                    </span>
                    {reading.aiProvider && (
                      <span className="px-3 py-1 bg-mystical-gold/20 text-mystical-gold rounded-full text-xs font-semibold">
                        ✨ AI 해석
                      </span>
                    )}
                  </div>

                  {/* 질문 */}
                  <h3 className="text-lg font-bold mb-3">
                    {reading.question || '질문 없음'}
                  </h3>

                  {/* 펼치기/접기 버튼 */}
                  <button
                    onClick={() => toggleExpand(reading.id)}
                    className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    {expandedId === reading.id ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        접기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        해석 보기
                      </>
                    )}
                  </button>

                  {/* 상세 내용 */}
                  {expandedId === reading.id && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                      {(() => {
                        const [summary, details] = String(reading.interpretation || '').split(CARD_DETAILS_SEPARATOR);
                        return (
                          <>
                            <div>
                              <h4 className="font-semibold text-mystical-gold mb-2">📖 핵심 요약</h4>
                              <p className="text-white/80 whitespace-pre-wrap leading-relaxed break-keep">
                                {summary.trim()}
                              </p>
                            </div>

                            {Array.isArray(reading.drawnCards) && reading.drawnCards.length > 0 && (
                              <EasyReadingView
                                drawnCards={reading.drawnCards}
                                easyReading={reading.easyReading}
                                spreadType={reading.spreadType}
                              />
                            )}

                            {details?.trim() && (
                              <div>
                                <h4 className="font-semibold text-mystical-gold mb-2">🔮 카드가 말해주는 이야기</h4>
                                <p className="text-white/80 whitespace-pre-wrap leading-relaxed break-keep">
                                  {details.trim()}
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}

                      {reading.elementalHarmony && (
                        <div>
                          <h4 className="font-semibold text-mystical-gold mb-2">🌟 오행 조화</h4>
                          <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                            {reading.elementalHarmony}
                          </p>
                        </div>
                      )}

                      {reading.personalizedAdvice && (
                        <div>
                          <h4 className="font-semibold text-mystical-gold mb-2">💡 맞춤 조언</h4>
                          <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                            {reading.personalizedAdvice}
                          </p>
                        </div>
                      )}

                      {reading.adviceCardInterpretation && (
                        <div>
                          <h4 className="font-semibold text-mystical-gold mb-2">🎴 조언 카드</h4>
                          <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                            {reading.adviceCardInterpretation}
                          </p>
                        </div>
                      )}

                      {reading.compatibilityReading && (
                        <div>
                          <h4 className="font-semibold text-pink-400 mb-2">💑 궁합 분석</h4>
                          <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                            {reading.compatibilityReading}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => handleDeleteReading(reading.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0"
                  title="삭제"
                >
                  <Trash2 className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 뒤로가기 버튼 */}
      <div className="text-center">
        <button
          onClick={onBack}
          className="text-white/60 hover:text-white transition-colors"
        >
          ← 메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}
