import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Sparkles, CreditCard, Gift, Loader2 } from 'lucide-react';
import { usePointStore } from '../store/usePointStore';
import type { PointPackage } from '../types';

interface PointChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredPoints?: number;
  spreadType?: string;
}

// 레몬스퀴지 variant ID 매핑
const VARIANT_IDS: Record<string, string> = {
  basic: '1224533',      // 기본 패키지 ₩5,000
  standard: '1224547',   // 스탠다드 패키지 ₩10,000
  premium: '1224539',    // 프리미엄 패키지 ₩27,000
  vip: '1224553',        // VIP 패키지 ₩42,500
};

export default function PointChargeModal({
  isOpen,
  onClose,
  requiredPoints,
  spreadType,
}: PointChargeModalProps) {
  const { points, packages, isLoading, fetchPackages, createCheckout } = usePointStore();
  const [selectedPackage, setSelectedPackage] = useState<PointPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && packages.length === 0) {
      fetchPackages();
    }
  }, [isOpen, packages.length, fetchPackages]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    try {
      const variantId = VARIANT_IDS[selectedPackage.id];
      const checkoutUrl = await createCheckout(selectedPackage.id, variantId);
      
      if (checkoutUrl) {
        // 레몬스퀴지 결제 페이지로 이동
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('결제 처리 실패:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const shortage = requiredPoints ? Math.max(0, requiredPoints - points) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-purple-500/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Coins className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">포인트 충전</h2>
                  <p className="text-sm text-purple-300">
                    현재 보유: <span className="text-yellow-400 font-semibold">{points.toLocaleString()}P</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 부족 포인트 안내 */}
            {shortage > 0 && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                <p className="text-red-300 text-sm">
                  <span className="font-semibold">{spreadType}</span> 해석을 보려면{' '}
                  <span className="text-yellow-400 font-bold">{shortage.toLocaleString()}P</span>가 더 필요합니다.
                </p>
              </div>
            )}

            {/* 패키지 목록 */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {packages.map((pkg) => (
                  <motion.button
                    key={pkg.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPackage?.id === pkg.id
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-purple-500/30 bg-white/5 hover:border-purple-400/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          pkg.bonus > 0 ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30' : 'bg-purple-500/20'
                        }`}>
                          {pkg.bonus > 0 ? (
                            <Gift className="w-5 h-5 text-yellow-400" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{pkg.name}</h3>
                          <p className="text-sm text-purple-300">{pkg.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-yellow-400">
                          {pkg.points.toLocaleString()}P
                        </p>
                        <p className="text-sm text-gray-400">
                          ₩{pkg.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {pkg.bonus > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                        <Gift className="w-3 h-3" />
                        <span>+{pkg.bonus.toLocaleString()}P 보너스!</span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {/* 결제 버튼 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePurchase}
              disabled={!selectedPackage || isProcessing}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                selectedPackage && !isProcessing
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-400 hover:to-orange-400'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {selectedPackage
                    ? `₩${selectedPackage.price.toLocaleString()} 결제하기`
                    : '패키지를 선택하세요'}
                </>
              )}
            </motion.button>

            {/* 안내 문구 */}
            <p className="mt-4 text-xs text-center text-gray-400">
              결제는 Lemon Squeezy를 통해 안전하게 처리됩니다.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
