import { useState, useEffect } from 'react';
import { User, Calendar, LogOut, Brain, X } from 'lucide-react';
import type { SajuAnalysis, BirthInfo, MBTIType } from '../types';
import { MBTI_TYPES, MBTI_DESCRIPTIONS } from '../types';
import { authApi } from '../services/api';
import SajuResult from '../components/SajuResult';

interface MyPageProps {
  onLogout: () => void;
  onBack: () => void;
}

export default function MyPage({ onLogout, onBack }: MyPageProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMbtiSelector, setShowMbtiSelector] = useState(false);
  const [mbtiLoading, setMbtiLoading] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (err) {
      setError('사용자 정보를 불러올 수 없습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMbtiChange = async (mbti: MBTIType | null) => {
    setMbtiLoading(true);
    try {
      const result = await authApi.updateMbti(mbti);
      if (result.success) {
        setUser(result.data);
        setShowMbtiSelector(false);
      }
    } catch (err) {
      console.error('MBTI 업데이트 실패:', err);
    } finally {
      setMbtiLoading(false);
    }
  };

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

  if (error || !user) {
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

  const birthInfo = user.birthInfo as BirthInfo;
  const sajuAnalysis = user.sajuAnalysis as SajuAnalysis;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-mystical-gold rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs">사주 만세력</p>
              <h1 className="text-2xl font-bold">{user.name}님의 타고난 성향</h1>
              <p className="text-white/60 text-sm">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </div>

      {/* 생년월일 정보 */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          생년월일시
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <p className="text-white/60 text-sm mb-1">생년월일</p>
            <p className="text-lg font-semibold">
              {birthInfo.year}년 {birthInfo.month}월 {birthInfo.day}일
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <p className="text-white/60 text-sm mb-1">태어난 시간</p>
            <p className="text-lg font-semibold">
              {typeof birthInfo.hour === 'number' ? `${birthInfo.hour}시` : '모름'}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <p className="text-white/60 text-sm mb-1">음력/양력</p>
            <p className="text-lg font-semibold">{birthInfo.isLunar ? '음력' : '양력'}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <p className="text-white/60 text-sm mb-1">성별</p>
            <p className="text-lg font-semibold">{birthInfo.gender === 'male' ? '남성' : '여성'}</p>
          </div>
        </div>
      </div>

      {/* MBTI 설정 */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          MBTI 성격 유형
        </h2>
        
        {user.mbti ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-3xl">
                {MBTI_DESCRIPTIONS[user.mbti as MBTIType]?.emoji}
              </div>
              <div>
                <p className="text-2xl font-bold">{user.mbti}</p>
                <p className="text-white/60">{MBTI_DESCRIPTIONS[user.mbti as MBTIType]?.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMbtiSelector(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
              >
                변경
              </button>
              <button
                onClick={() => handleMbtiChange(null)}
                disabled={mbtiLoading}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
              >
                삭제
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-white/60 mb-4">
              MBTI를 설정하면 타로 리딩에서 내 성격 유형에 맞춘 조언을 받을 수 있어요.
            </p>
            <button
              onClick={() => setShowMbtiSelector(true)}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <Brain className="w-4 h-4" />
              MBTI 설정하기
            </button>
          </div>
        )}

      </div>

      {/* MBTI 선택 모달 - 카드 밖에 위치 */}
      {showMbtiSelector && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-xl font-bold">MBTI 선택</h3>
              <button
                onClick={() => setShowMbtiSelector(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MBTI_TYPES.map((mbti) => (
                  <button
                    key={mbti}
                    onClick={() => handleMbtiChange(mbti)}
                    disabled={mbtiLoading}
                    className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                      user.mbti === mbti
                        ? 'border-primary-400 bg-primary-400/20'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div className="text-2xl mb-1">{MBTI_DESCRIPTIONS[mbti].emoji}</div>
                    <div className="font-bold">{mbti}</div>
                    <div className="text-xs text-white/60">{MBTI_DESCRIPTIONS[mbti].name}</div>
                  </button>
                ))}
              </div>
            </div>
            {mbtiLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 사주 만세력 해석 */}
      {sajuAnalysis && <SajuResult analysis={sajuAnalysis} />}

      {/* 추가 정보 */}
      <div className="card bg-gradient-to-br from-primary-600/20 to-mystical-gold/20">
        <h2 className="text-xl font-bold mb-4">💡 활용 팁</h2>
        <div className="space-y-3 text-white/90">
          <p className="leading-relaxed break-keep">
            • 많은 기운은 내가 잘 쓰는 무기예요. 일이나 관계에서 자신 있게 써 보세요.
          </p>
          <p className="leading-relaxed break-keep">
            • 부족한 기운은 단점이 아니라 채우면 좋은 부분이에요. 위 "한눈에 보는 나"의 생활 팁 중 하나만 골라 해 보세요.
          </p>
          <p className="leading-relaxed break-keep">
            • 신살은 정해진 운명이 아니라 경향이에요. 조심할 기운은 "이 부분만 신경 쓰면 된다" 정도로 보면 돼요.
          </p>
          <p className="leading-relaxed break-keep">
            • 타로 리딩은 이 사주 정보를 함께 읽어 해석해요. 부족한 기운과 관련된 카드가 나오면 조금 더 눈여겨보세요.
          </p>
          <p className="leading-relaxed break-keep">
            • MBTI를 설정하면 리딩에서 내 성격 유형에 맞춘 조언도 받을 수 있어요.
          </p>
        </div>
      </div>

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
