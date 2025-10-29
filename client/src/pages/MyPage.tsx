import { useState, useEffect } from 'react';
import { User, Calendar, LogOut, BookOpen, Trash2 } from 'lucide-react';
import type { SajuAnalysis, BirthInfo } from '../types';
import { authApi, readingApi } from '../services/api';
import SajuResult from '../components/SajuResult';

interface MyPageProps {
  onLogout: () => void;
  onBack: () => void;
}

export default function MyPage({ onLogout, onBack }: MyPageProps) {
  const [user, setUser] = useState<any>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReading, setSelectedReading] = useState<any>(null);

  useEffect(() => {
    loadUserInfo();
    loadReadings();
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

  const loadReadings = async () => {
    try {
      const response = await readingApi.getUserReadings(10, 0);
      setReadings(response.readings || []);
    } catch (err) {
      console.error('리딩 내역 로드 실패:', err);
    }
  };

  const handleDeleteReading = async (id: string) => {
    if (!confirm('이 리딩 기록을 삭제하시겠습니까?')) return;
    
    try {
      await readingApi.deleteReading(id);
      setReadings(readings.filter(r => r.id !== id));
      if (selectedReading?.id === id) {
        setSelectedReading(null);
      }
    } catch (err) {
      alert('삭제에 실패했습니다');
      console.error(err);
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
              <h1 className="text-2xl font-bold">{user.name}님의 만세력</h1>
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
            <p className="text-white/60 text-sm mb-1">생시</p>
            <p className="text-lg font-semibold">{birthInfo.hour}시</p>
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

      {/* 사주 만세력 해석 */}
      {sajuAnalysis && <SajuResult analysis={sajuAnalysis} />}

      {/* 타로 리딩 내역 */}
      {readings.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            타로 리딩 내역
          </h2>
          <div className="space-y-3">
            {readings.map((reading) => (
              <div
                key={reading.id}
                className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setSelectedReading(selectedReading?.id === reading.id ? null : reading)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-white/60">
                        {new Date(reading.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="px-2 py-0.5 bg-primary-600/30 rounded text-xs">
                        {reading.spreadType === 'one-card' ? '원카드' :
                         reading.spreadType === 'three-card' ? '쓰리카드' :
                         reading.spreadType === 'celtic-cross' ? '켈트십자' : '사주맞춤'}
                      </span>
                    </div>
                    <p className="font-semibold mb-2">{reading.question}</p>
                    {selectedReading?.id === reading.id && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-sm text-white/80 whitespace-pre-wrap">
                          {reading.interpretation.substring(0, 300)}
                          {reading.interpretation.length > 300 && '...'}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReading(reading.id);
                    }}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 추가 정보 */}
      <div className="card bg-gradient-to-br from-primary-600/20 to-mystical-gold/20">
        <h2 className="text-xl font-bold mb-4">💡 만세력 활용 팁</h2>
        <div className="space-y-3 text-white/90">
          <p className="leading-relaxed">
            • 일간이 강하면 자신감이 있고 추진력이 있지만, 독단적일 수 있어요.
          </p>
          <p className="leading-relaxed">
            • 일간이 약하면 섬세하고 배려심이 깊지만, 우유부단할 수 있어요.
          </p>
          <p className="leading-relaxed">
            • 강한 오행은 당신의 장점이고, 약한 오행은 보완이 필요한 부분이에요.
          </p>
          <p className="leading-relaxed">
            • 타로 리딩에서 약한 오행과 관련된 카드가 나오면 특별히 주의깊게 보세요!
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
