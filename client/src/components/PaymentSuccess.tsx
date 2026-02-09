import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Coins, ArrowRight, Loader2 } from 'lucide-react';
import { usePointStore } from '../store/usePointStore';

interface PaymentSuccessProps {
  onGoHome: () => void;
}

export default function PaymentSuccess({ onGoHome }: PaymentSuccessProps) {
  const { fetchPoints, points } = usePointStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPoints = async () => {
      await fetchPoints();
      setIsLoading(false);
    };
    loadPoints();
  }, [fetchPoints]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 rounded-2xl p-8 max-w-md w-full border border-purple-500/30 shadow-2xl text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex p-4 bg-green-500/20 rounded-full mb-6"
        >
          <CheckCircle className="w-16 h-16 text-green-400" />
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-2">
          결제가 완료되었습니다
        </h2>
        <p className="text-purple-300 mb-6">
          포인트가 정상적으로 충전되었습니다.
        </p>

        <div className="flex items-center justify-center gap-2 mb-8 p-4 bg-white/5 rounded-xl border border-yellow-500/20">
          <Coins className="w-6 h-6 text-yellow-400" />
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
          ) : (
            <span className="text-2xl font-bold text-yellow-400">
              {points.toLocaleString()}P
            </span>
          )}
          <span className="text-sm text-purple-300">보유 중</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGoHome}
          className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 flex items-center justify-center gap-2 transition-all"
        >
          타로 보러 가기
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}
