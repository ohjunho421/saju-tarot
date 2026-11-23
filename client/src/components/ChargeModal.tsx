import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { paymentApi, type VerifyResult } from '../services/api';
import { formatPoints, usePointsStore } from '../stores/points';

interface ChargeModalProps {
  onShowPolicy: () => void;
}

interface PortOneResponse {
  code?: string;
  message?: string;
  paymentId?: string;
}

interface PortOneSdk {
  requestPayment: (request: Record<string, unknown>) => Promise<PortOneResponse | undefined>;
}

const SDK_URL = 'https://cdn.portone.io/v2/browser-sdk.js';
const VERIFY_RETRIES = 20;
const VERIFY_INTERVAL_MS = 3000;

function loadPortOne(): Promise<PortOneSdk> {
  const existing = (window as unknown as { PortOne?: PortOneSdk }).PortOne;
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.onload = () => {
      const sdk = (window as unknown as { PortOne?: PortOneSdk }).PortOne;
      if (sdk) resolve(sdk);
      else reject(new Error('결제창을 불러오지 못했습니다.'));
    };
    script.onerror = () => reject(new Error('결제창을 불러오지 못했습니다. 연결 상태를 확인해 주세요.'));
    document.head.appendChild(script);
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 결제 확인을 승인될 때까지 되풀이한다.
 * 결제는 됐는데 일시 오류로 "실패"를 띄우면 다시 결제하게 되므로, 확정된 실패가 아니면 계속 확인한다.
 */
export async function confirmPayment(paymentId: string): Promise<VerifyResult> {
  let last: VerifyResult = { status: 'pending' };
  for (let attempt = 0; attempt < VERIFY_RETRIES; attempt++) {
    last = await paymentApi.verify(paymentId);
    if (last.status === 'paid' || last.status === 'failed') return last;
    await sleep(VERIFY_INTERVAL_MS);
  }
  return last;
}

export default function ChargeModal({ onShowPolicy }: ChargeModalProps) {
  const { chargeOpen, chargeNotice, closeCharge, prices, points, setPoints, loadPrices } = usePointsStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  useEffect(() => {
    if (!chargeOpen) return;
    loadPrices();
    setError(null);
    setDone(null);
  }, [chargeOpen, loadPrices]);

  // Esc로 닫기 (결제 진행 중에는 닫지 않는다)
  useEffect(() => {
    if (!chargeOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) closeCharge();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chargeOpen, busy, closeCharge]);

  if (!chargeOpen) return null;

  const packages = prices?.chargePackages ?? [];
  const selected = packages.find((p) => p.id === selectedId) ?? packages[0] ?? null;

  const handlePay = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setError(null);
    try {
      const [prepared, portone] = await Promise.all([paymentApi.prepare(selected.id), loadPortOne()]);
      const response = await portone.requestPayment({
        storeId: prepared.storeId,
        channelKey: prepared.channelKey,
        paymentId: prepared.paymentId,
        orderName: prepared.orderName,
        totalAmount: prepared.amount,
        currency: 'KRW',
        payMethod: prepared.payMethod,
        // 휴대폰에서는 결제 후 이 주소로 돌아온다 — App이 paymentId를 읽어 이어서 확인한다
        redirectUrl: `${window.location.origin}${window.location.pathname}`,
      });

      // 결제창을 닫았거나 결제사가 거절한 경우
      if (response?.code !== undefined) {
        setError(response.message || '결제가 완료되지 않았습니다.');
        return;
      }

      const result = await confirmPayment(prepared.paymentId);
      if (result.status === 'paid') {
        setPoints(result.points);
        setDone(result.charged);
      } else if (result.status === 'failed') {
        setError(result.message);
      } else {
        setError('결제 확인이 늦어지고 있어요. 결제가 완료됐다면 잠시 후 포인트가 자동으로 들어옵니다.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '결제 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="charge-title"
    >
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 id="charge-title" className="text-2xl font-bold">포인트 충전</h2>
            {points !== null && (
              <p className="text-white/60 text-sm mt-1">
                지금 <span className="text-mystical-gold font-semibold">{formatPoints(points)}</span> 있어요
              </p>
            )}
          </div>
          <button
            onClick={closeCharge}
            disabled={busy}
            aria-label="닫기"
            className="text-white/60 hover:text-white disabled:opacity-30"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {done !== null ? (
          <div className="text-center py-4">
            <p className="text-lg font-semibold mb-1">{formatPoints(done)} 충전했어요</p>
            {points !== null && <p className="text-white/60 text-sm mb-6">지금 {formatPoints(points)} 있어요</p>}
            <button onClick={closeCharge} className="w-full btn-primary">
              리딩 계속하기
            </button>
          </div>
        ) : (
          <>
            {chargeNotice && (
              <div className="bg-mystical-gold/10 border border-mystical-gold/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-white/90 break-keep">{chargeNotice}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4" role="alert">
                <p className="text-red-200 text-sm break-keep">{error}</p>
              </div>
            )}

            {packages.length === 0 ? (
              <p className="text-white/60 text-sm py-6 text-center">충전 금액을 불러오는 중이에요.</p>
            ) : (
              <fieldset className="space-y-2 mb-5" disabled={busy}>
                <legend className="text-sm text-white/60 mb-2">충전할 금액</legend>
                {packages.map((pkg) => {
                  const active = selected?.id === pkg.id;
                  return (
                    <label
                      key={pkg.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                        active ? 'bg-primary-600/30 border-primary-500' : 'bg-white/5 border-white/20 hover:border-white/40'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="charge-package"
                          checked={active}
                          onChange={() => setSelectedId(pkg.id)}
                          className="w-4 h-4 accent-primary-500"
                        />
                        <span className="font-semibold text-mystical-gold">{formatPoints(pkg.points)}</span>
                      </span>
                      <span className="text-white/80">{pkg.amount.toLocaleString('ko-KR')}원</span>
                    </label>
                  );
                })}
              </fieldset>
            )}

            <button onClick={handlePay} disabled={busy || !selected} className="w-full btn-primary disabled:opacity-60 disabled:cursor-wait">
              {busy ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  결제 확인 중
                </span>
              ) : selected ? (
                `${selected.amount.toLocaleString('ko-KR')}원 결제하기`
              ) : (
                '결제하기'
              )}
            </button>

            <p className="text-xs text-white/50 mt-4 break-keep leading-relaxed">
              1포인트는 1원이에요. 쓰지 않은 충전 포인트는 결제일부터 7일 안에 환불받을 수 있습니다.{' '}
              <button type="button" onClick={onShowPolicy} className="underline hover:text-white/80">
                요금과 환불 안내 보기
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
