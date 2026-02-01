import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Coins, Loader2, AlertCircle } from 'lucide-react';
import { usePointStore } from '../store/usePointStore';
import PointChargeModal from './PointChargeModal';

// 스프레드별 필요 포인트
const SPREAD_POINTS: Record<string, number> = {
  'one-card': 1000,
  'three-card': 3000,
  'five-card': 5000,
  'celtic-cross': 10000,
  'saju-custom': 5000,
  'two-card': 2000,
  'six-months': 6000,
  'yes-no': 2000,
  'problem-solution': 4000,
};

// 스프레드 한글 이름
const SPREAD_NAMES: Record<string, string> = {
  'one-card': '원카드',
  'three-card': '쓰리카드',
  'five-card': '파이브카드',
  'celtic-cross': '켈틱크로스',
  'saju-custom': '사주 커스텀',
  'two-card': '투카드',
  'six-months': '6개월 운세',
  'yes-no': '예스/노',
  'problem-solution': '문제-해결',
};

interface ReadingPaywallProps {
  spreadType: string;
  readingId?: string;
  children: React.ReactNode;
  onUnlock?: () => void;
}

export default function ReadingPaywall({
  spreadType,
  readingId,
  children,
  onUnlock,
}: ReadingPaywallProps) {
  const { points, fetchPoints, usePoints, isLoading } = usePointStore();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredPoints = SPREAD_POINTS[spreadType] || 3000;
  const spreadName = SPREAD_NAMES[spreadType] || spreadType;
  const hasEnoughPoints = points >= requiredPoints;

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  const handleUnlock = async () => {
    if (!hasEnoughPoints) {
      setShowChargeModal(true);
      return;
    }

    setError(null);
    const success = await usePoints(spreadType, readingId);
    
    if (success) {
      setIsUnlocked(true);
      onUnlock?.();
    } else {
      setError('포인트 차감에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 이미 잠금 해제된 경우 바로 컨텐츠 표시
  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="relative">
        {/* 블러 처리된 미리보기 */}
        <div className="relative overflow-hidden rounded-xl">
          <div className="blur-md pointer-events-none select-none opacity-50">
            {children}
          </div>
          
          {/* 잠금 오버레이 */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-purple-900/80 to-purple-900/95">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-8 max-w-md"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse'
                }}
                className="inline-flex p-4 bg-yellow-500/20 rounded-full mb-4"
              >
                <Lock className="w-10 h-10 text-yellow-400" />
              </motion.div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                해석 결과 잠금
              </h3>
              
              <p className="text-purple-300 mb-4">
                <span className="font-semibold text-white">{spreadName}</span> 해석을 보려면{' '}
                <span className="text-yellow-400 font-bold">{requiredPoints.toLocaleString()}P</span>가 필요합니다.
              </p>

              <div className="flex items-center justify-center gap-2 mb-4 text-sm">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">
                  보유 포인트: <span className={hasEnoughPoints ? 'text-green-400' : 'text-red-400'}>
                    {points.toLocaleString()}P
                  </span>
                </span>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUnlock}
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    hasEnoughPoints
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-400 hover:to-orange-400'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      처리 중...
                    </>
                  ) : hasEnoughPoints ? (
                    <>
                      <Unlock className="w-5 h-5" />
                      {requiredPoints.toLocaleString()}P로 잠금 해제
                    </>
                  ) : (
                    <>
                      <Coins className="w-5 h-5" />
                      포인트 충전하기
                    </>
                  )}
                </motion.button>

                {hasEnoughPoints && (
                  <button
                    onClick={() => setShowChargeModal(true)}
                    className="text-sm text-purple-300 hover:text-purple-200 underline"
                  >
                    더 많은 포인트 충전하기
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <PointChargeModal
        isOpen={showChargeModal}
        onClose={() => setShowChargeModal(false)}
        requiredPoints={requiredPoints}
        spreadType={spreadName}
      />
    </>
  );
}
