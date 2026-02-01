import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Plus } from 'lucide-react';
import { usePointStore } from '../store/usePointStore';

interface PointBadgeProps {
  onChargeClick: () => void;
  showChargeButton?: boolean;
}

export default function PointBadge({ onChargeClick, showChargeButton = true }: PointBadgeProps) {
  const { points, fetchPoints } = usePointStore();

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full"
      >
        <Coins className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-semibold text-yellow-400">
          {points.toLocaleString()}P
        </span>
      </motion.div>
      
      {showChargeButton && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onChargeClick}
          className="p-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-full transition-colors"
          title="포인트 충전"
        >
          <Plus className="w-4 h-4 text-yellow-400" />
        </motion.button>
      )}
    </div>
  );
}
