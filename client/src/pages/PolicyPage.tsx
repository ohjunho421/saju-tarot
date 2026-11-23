import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { formatPoints, usePointsStore } from '../stores/points';
import { BUSINESS, BUSINESS_LINES } from '../data/business';
import type { SpreadType } from '../types';

interface PolicyPageProps {
  onBack: () => void;
}

// 가격표에 보여 줄 리딩 이름 (TarotReading의 스프레드 이름과 같게)
const SPREAD_NAMES: Record<SpreadType, string> = {
  'one-card': '원 카드',
  'yes-no': '예/아니오',
  'daily-fortune': '오늘의 운세',
  'two-card': '투 카드 (A vs B)',
  'three-card': '쓰리 카드',
  'problem-solution': '문제와 해결',
  'six-months': '6개월 흐름',
  'celtic-cross': '켈트 십자가',
  'saju-custom': '사주 맞춤형',
  custom: '맞춤 배치',
  compatibility: '궁합 리딩',
};

export default function PolicyPage({ onBack }: PolicyPageProps) {
  const { prices, loadPrices } = usePointsStore();

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  const paidRows = prices
    ? (Object.entries(prices.spreadPrices) as [SpreadType, number][]).sort((a, b) => a[1] - b[1])
    : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white text-sm">
        <ArrowLeft className="w-4 h-4" />
        돌아가기
      </button>

      <div className="card">
        <h1 className="text-2xl font-bold mb-2">요금과 환불 안내</h1>
        <p className="text-white/70 break-keep">
          별사탕은 포인트로 리딩을 봅니다. 1포인트는 1원이고, 필요한 만큼 충전해서 씁니다.
        </p>
        {prices && !prices.paidMode && (
          <p className="mt-3 text-sm text-mystical-gold break-keep">
            유료 리딩과 포인트 충전은 준비 중입니다. 열리기 전까지는 모든 리딩을 무료로 볼 수 있어요.
          </p>
        )}
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">리딩 요금</h2>
        {!prices ? (
          <p className="text-white/60 text-sm">요금표를 불러오는 중이에요.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/50 border-b border-white/10">
                <th className="py-2 font-normal">리딩</th>
                <th className="py-2 font-normal text-right">요금</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {prices.dailyFreeSpreads.map((type) => (
                <tr key={type}>
                  <td className="py-2.5">{SPREAD_NAMES[type] ?? type}</td>
                  <td className="py-2.5 text-right">
                    하루 한 번 무료
                    <span className="text-white/50"> · 같은 날 다시 보면 {formatPoints(prices.extraDailyPrice)}</span>
                  </td>
                </tr>
              ))}
              {paidRows.map(([type, price]) => (
                <tr key={type}>
                  <td className="py-2.5">{SPREAD_NAMES[type] ?? type}</td>
                  <td className="py-2.5 text-right text-mystical-gold">{formatPoints(price)}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2.5">상대 정보를 넣은 궁합 리딩</td>
                <td className="py-2.5 text-right text-mystical-gold">{formatPoints(prices.compatibilityPrice)}</td>
              </tr>
            </tbody>
          </table>
        )}
        <ul className="text-white/60 text-sm mt-4 space-y-1 list-disc pl-5 break-keep">
          <li>사주 분석, 조언 카드 추가, 리딩 뒤 이어지는 대화는 무료입니다.</li>
          <li>가입하면 {prices ? formatPoints(prices.signupBonus) : '포인트'}를 드립니다.</li>
          <li>포인트는 리딩을 요청할 때 차감됩니다. 리딩을 만들지 못하면 차감한 포인트를 바로 돌려드립니다.</li>
        </ul>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">충전</h2>
        {prices && (
          <p className="text-white/80 text-sm mb-3">
            {prices.chargePackages.map((p) => `${p.amount.toLocaleString('ko-KR')}원`).join(', ')} 단위로 충전합니다.
            결제한 금액만큼 포인트가 들어옵니다.
          </p>
        )}
        <p className="text-white/60 text-sm break-keep">
          결제는 포트원 결제창에서 진행하며, 별사탕은 카드번호 등 결제수단 정보를 저장하지 않습니다.
        </p>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">환불</h2>
        <ul className="text-white/80 text-sm space-y-2 list-disc pl-5 break-keep">
          <li>충전한 뒤 한 번도 쓰지 않은 결제 건은 결제일부터 7일 안에 전액 환불받을 수 있습니다.</li>
          <li>일부를 쓴 결제 건은 남은 충전 포인트만큼 환불합니다.</li>
          <li>이미 본 리딩은 제공이 끝난 디지털 콘텐츠라 환불되지 않습니다.</li>
          <li>가입 축하 포인트처럼 무료로 받은 포인트는 환불 대상이 아닙니다.</li>
          <li>환불은 결제한 수단으로 돌려드리며, 카드사에 따라 영업일 기준 3~7일이 걸릴 수 있습니다.</li>
        </ul>
        <p className="text-white/60 text-sm mt-4 break-keep">
          환불을 원하면 가입한 이메일과 결제일을 적어
          {BUSINESS.email ? (
            <>
              {' '}아래 주소로 보내 주세요.{' '}
              <a href={`mailto:${BUSINESS.email}`} className="underline hover:text-white">
                {BUSINESS.email}
              </a>
            </>
          ) : (
            ' 고객센터로 보내 주세요.'
          )}
        </p>
      </div>

      {BUSINESS_LINES.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">사업자 정보</h2>
          <ul className="text-white/70 text-sm space-y-1">
            {BUSINESS_LINES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-white/40 text-xs text-center break-keep">
        별사탕의 리딩은 엔터테인먼트 목적으로 제공되며, 의료·법률·투자 판단을 대신하지 않습니다.
      </p>
    </div>
  );
}
