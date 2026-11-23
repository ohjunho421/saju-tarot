import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import { pointsApi, type PointTransaction } from '../services/api';
import { formatPoints, usePointsStore } from '../stores/points';

const VISIBLE_ROWS = 5;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

// 마이페이지의 포인트 잔액·내역
export default function PointsCard() {
  const points = usePointsStore((state) => state.points);
  const openCharge = usePointsStore((state) => state.openCharge);
  const [history, setHistory] = useState<PointTransaction[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  // 잔액이 바뀌면(충전·리딩) 내역도 다시 불러온다
  useEffect(() => {
    let cancelled = false;
    pointsApi
      .getHistory()
      .then((rows) => {
        if (!cancelled) setHistory(rows);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [points]);

  const rows = history ? (showAll ? history : history.slice(0, VISIBLE_ROWS)) : [];

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Coins className="w-5 h-5 text-mystical-gold" />
            내 포인트
          </h2>
          <p className="text-3xl font-bold text-mystical-gold mt-2">{points !== null ? formatPoints(points) : '-'}</p>
        </div>
        <button onClick={() => openCharge()} className="btn-secondary">
          충전하기
        </button>
      </div>

      {history === null ? (
        <p className="text-white/50 text-sm">내역을 불러오는 중이에요.</p>
      ) : history.length === 0 ? (
        <p className="text-white/50 text-sm">아직 포인트를 쓰거나 충전한 적이 없어요.</p>
      ) : (
        <>
          <ul className="divide-y divide-white/[0.06]">
            {rows.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate">{row.description}</p>
                  <p className="text-white/40 text-xs">{formatDate(row.createdAt)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={row.amount >= 0 ? 'text-mystical-gold font-semibold' : 'text-white/80'}>
                    {row.amount >= 0 ? '+' : '-'}
                    {formatPoints(Math.abs(row.amount))}
                  </p>
                  <p className="text-white/40 text-xs">잔액 {formatPoints(row.balance)}</p>
                </div>
              </li>
            ))}
          </ul>
          {history.length > VISIBLE_ROWS && (
            <button onClick={() => setShowAll(!showAll)} className="mt-3 text-sm text-white/60 hover:text-white underline">
              {showAll ? '접기' : `내역 ${history.length}건 모두 보기`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
