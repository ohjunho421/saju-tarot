import type { SajuAnalysis } from '../types';
import { TrendingUp, TrendingDown, Shield } from 'lucide-react';
import ElementGuide from './ElementGuide';

interface SajuResultProps {
  analysis: SajuAnalysis;
}

export default function SajuResult({ analysis }: SajuResultProps) {
  const { chart, dayMaster, dayMasterElement, elementBalance, personality, strengths, weaknesses, strongElements, weakElements } = analysis;

  // 오행 색상
  const elementColors: Record<string, string> = {
    '목': 'text-green-400',
    '화': 'text-red-400',
    '토': 'text-yellow-400',
    '금': 'text-gray-300',
    '수': 'text-blue-400'
  };

  const total = Object.values(elementBalance).reduce((sum, val) => sum + val, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 px-4">
      {/* 사주 차트 */}
      <div className="card">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">사주 만세력</h2>
        
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {/* 년주 → 월주 → 일주 → 시주 순서로 표시 */}
          {[
            { key: 'year', label: '년주', data: chart.year },
            { key: 'month', label: '월주', data: chart.month },
            { key: 'day', label: '일주', data: chart.day },
            ...(chart.hour ? [{ key: 'hour', label: '시주', data: chart.hour }] : [])
          ].map(({ key, label, data }) => (
            <div key={key} className="text-center bg-white/5 rounded-lg p-2 md:p-4">
              <p className="text-xs md:text-sm text-white/60 mb-1 md:mb-2">
                {label}
              </p>
              <div className="text-2xl md:text-3xl font-bold mb-1">
                {data.heavenlyStem}
              </div>
              <div className="text-xl md:text-2xl mb-1 md:mb-2">
                {data.earthlyBranch}
              </div>
              <div className={`text-xs md:text-sm ${elementColors[data.element]}`}>
                {data.element}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 md:mt-6 text-center">
          <p className="text-base md:text-lg">
            <span className="text-white/70">일간(Day Master):</span>{' '}
            <span className="text-xl md:text-2xl font-bold text-mystical-gold">{dayMaster}</span>{' '}
            <span className={`text-lg md:text-xl ${elementColors[dayMasterElement]}`}>({dayMasterElement})</span>
          </p>
        </div>
      </div>

      {/* 오행 균형 */}
      <div className="card">
        <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">오행 균형</h3>
        
        <div className="space-y-3">
          {Object.entries(elementBalance).map(([element, value]) => {
            const percentage = (value / total) * 100;
            return (
              <div key={element}>
                <div className="flex justify-between mb-1">
                  <span className={elementColors[element]}>{element} (木火土金水)</span>
                  <span>{value} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      element === '목' ? 'bg-green-500' :
                      element === '화' ? 'bg-red-500' :
                      element === '토' ? 'bg-yellow-500' :
                      element === '금' ? 'bg-gray-400' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h4 className="font-semibold">강한 오행</h4>
            </div>
            <div className="flex gap-2">
              {strongElements.map(el => (
                <span key={el} className={`px-3 py-1 rounded-full bg-white/10 ${elementColors[el]}`}>
                  {el}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <h4 className="font-semibold">약한 오행</h4>
            </div>
            <div className="flex gap-2">
              {weakElements.map(el => (
                <span key={el} className={`px-3 py-1 rounded-full bg-white/10 ${elementColors[el]}`}>
                  {el}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 성격 분석 */}
      <div className="card">
        <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">성격 분석</h3>
        <p className="text-base md:text-lg leading-relaxed mb-4 md:mb-6">{personality}</p>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <h4 className="font-semibold mb-3 text-green-400">강점</h4>
            <ul className="space-y-2">
              {strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {weaknesses.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-yellow-400">주의할 점</h4>
              <ul className="space-y-2">
                {weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">⚠</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 살(煞) 분석 */}
      {analysis.sal && analysis.sal.length > 0 && (
        <div className="card">
          <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            신살(神煞) 분석
          </h3>
          <p className="text-white/60 text-sm mb-4">
            사주 팔자에서 발견된 신살입니다. 신살은 사주의 지지(地支)와 천간(天干) 조합에서 나타나는 특별한 기운으로, 길신(吉神)은 좋은 기운을, 흉살(凶煞)은 주의가 필요한 기운을 나타냅니다.
          </p>
          <div className="space-y-4">
            {analysis.sal.map((sal, idx) => {
              const salDetails: Record<string, { hanja: string; origin: string; emoji: string; keywords: string[]; realLife: string; advice: string }> = {
                '도화살': {
                  hanja: '桃花煞',
                  origin: '복숭아꽃(桃花)처럼 아름답고 매혹적인 기운을 뜻합니다. 삼합(三合)의 목욕지(沐浴地)에서 발생하며, 이성을 끌어당기는 강한 매력의 별입니다.',
                  emoji: '🌸',
                  keywords: ['이성 매력', '사교성', '예술적 감각', '연애운', '인기'],
                  realLife: '이성에게 인기가 많고 첫인상이 좋습니다. 연예인, 서비스업, 영업직에서 빛을 발합니다. 다만 이성 문제로 구설수가 생기거나, 감정에 쉽게 흔들릴 수 있어요.',
                  advice: '매력을 긍정적으로 활용하되, 이성 관계에서 경계를 명확히 하세요. 예술이나 창작 활동으로 에너지를 승화시키면 좋습니다.'
                },
                '역마살': {
                  hanja: '驛馬煞',
                  origin: '역참(驛站)의 말(馬)처럼 쉬지 않고 달리는 기운입니다. 삼합의 충(沖) 위치에서 발생하며, 끊임없는 이동과 변화를 상징합니다.',
                  emoji: '🐎',
                  keywords: ['이동', '변화', '해외운', '활동성', '여행'],
                  realLife: '이사, 전근, 해외 출장이 잦고 한 곳에 오래 머물기 어렵습니다. 무역, 항공, 여행업, 외교관 등 이동이 많은 직업에 적합합니다. 반면 가정의 안정감이 부족할 수 있어요.',
                  advice: '변화를 두려워하지 말고 적극 활용하세요. 다만 중요한 결정은 충분히 정착한 후에 내리는 것이 좋습니다.'
                },
                '화개살': {
                  hanja: '華蓋煞',
                  origin: '화려한 덮개(華蓋), 즉 임금의 일산(日傘)을 뜻합니다. 삼합의 고지(庫地)에서 발생하며, 학문과 종교, 예술에 대한 깊은 관심을 나타냅니다.',
                  emoji: '🎭',
                  keywords: ['예술', '종교', '학문', '고독', '영성'],
                  realLife: '예술적 재능이 뛰어나고 철학적 사고가 깊습니다. 작가, 예술가, 종교인, 학자에게 많이 나타납니다. 내면 세계가 풍부하지만 현실과 괴리감을 느끼거나 외로움을 탈 수 있어요.',
                  advice: '혼자만의 시간을 소중히 하되, 사회적 관계도 균형 있게 유지하세요. 창작 활동이나 명상이 큰 도움이 됩니다.'
                },
                '겁살': {
                  hanja: '劫煞',
                  origin: '겁탈(劫奪)의 기운으로, 12신살 중 하나입니다. 삼합의 절지(絶地)에서 발생하며, 재물이나 인연이 빼앗길 수 있는 위험을 경고합니다.',
                  emoji: '⚔️',
                  keywords: ['경쟁', '재물 손실', '승부욕', '사기 주의', '도전'],
                  realLife: '경쟁 상황에서 강한 승부욕을 보이지만, 투자 실패나 사기를 당할 위험이 있습니다. 보증을 서거나 큰 돈을 빌려주는 것에 특히 주의가 필요해요.',
                  advice: '금전 거래에서 신중하고, 보증은 절대 피하세요. 승부욕을 건설적인 방향(운동, 사업)으로 활용하면 오히려 큰 성과를 낼 수 있습니다.'
                },
                '망신살': {
                  hanja: '亡身煞',
                  origin: '몸(身)을 잃는다(亡)는 뜻으로, 12신살 중 하나입니다. 체면과 명예에 손상이 오는 기운을 나타냅니다.',
                  emoji: '😰',
                  keywords: ['구설수', '명예 손상', '실수', '체면', '평판'],
                  realLife: '뜻하지 않은 실수나 말실수로 평판이 떨어질 수 있습니다. SNS나 공개 석상에서의 발언에 특히 주의가 필요하고, 비밀이 드러나기 쉬운 기운이에요.',
                  advice: '말과 행동을 한 번 더 생각하고 실행하세요. 중요한 자리에서는 감정적 발언을 삼가고, 비밀은 철저히 관리하세요.'
                },
                '백호살': {
                  hanja: '白虎煞',
                  origin: '백호(白虎)는 서쪽을 지키는 신수(神獸)로, 날카롭고 파괴적인 기운을 상징합니다. 특정 일주(日柱) 조합에서 발생하는 강력한 살입니다.',
                  emoji: '🐯',
                  keywords: ['사고', '수술', '부상', '급변', '결단력'],
                  realLife: '교통사고, 수술, 부상 등 신체적 위험에 노출되기 쉽습니다. 반면 위기 상황에서 강한 결단력과 추진력을 발휘하기도 합니다. 군인, 외과의사, 경찰 등에서 오히려 빛을 발해요.',
                  advice: '건강 검진을 정기적으로 받고, 위험한 활동에서는 안전 수칙을 철저히 지키세요. 강한 에너지를 운동이나 직업적 도전으로 승화시키세요.'
                },
                '천을귀인': {
                  hanja: '天乙貴人',
                  origin: '하늘(天)의 으뜸(乙) 귀한 사람(貴人)이라는 뜻으로, 사주에서 가장 강력한 길신(吉神)입니다. 일간(日干)을 기준으로 특정 지지에서 발생합니다.',
                  emoji: '🌟',
                  keywords: ['귀인', '행운', '위기 극복', '인덕', '사회적 인정'],
                  realLife: '어려운 상황에서 반드시 도와주는 사람이 나타납니다. 대인관계가 원만하고 사회적으로 인정받기 쉬워요. 취업, 승진, 사업에서 귀인의 도움을 받는 경우가 많습니다.',
                  advice: '주변 사람들과의 관계를 소중히 하세요. 귀인은 가까운 곳에 있을 수 있습니다. 감사하는 마음을 잊지 마세요.'
                },
                '귀문관살': {
                  hanja: '鬼門關煞',
                  origin: '귀신(鬼)의 문(門)이 열리는 관문(關)이라는 뜻입니다. 일지와 월지/시지의 특정 조합에서 발생하며, 영적 감수성과 정신적 예민함을 나타냅니다.',
                  emoji: '👁️',
                  keywords: ['직감', '영감', '불안', '예민함', '심리'],
                  realLife: '직감이 매우 뛰어나고 사람의 속마음을 잘 읽습니다. 심리상담사, 종교인, 예술가에게 많이 나타납니다. 다만 악몽, 불안, 우울 등 정신적 어려움을 겪기 쉬워요.',
                  advice: '명상, 요가, 심리 상담 등으로 정신 건강을 관리하세요. 직감을 믿되, 불안에 휩쓸리지 않도록 객관적 시각도 유지하세요.'
                },
                '양인살': {
                  hanja: '羊刃煞',
                  origin: '양(羊)의 칼날(刃)이라는 뜻으로, 일간의 기운이 극도로 강해지는 지점에서 발생합니다. 칼날처럼 날카롭고 강렬한 에너지를 상징합니다.',
                  emoji: '🗡️',
                  keywords: ['결단력', '추진력', '독단', '과격', '카리스마'],
                  realLife: '리더십과 추진력이 매우 강하고 카리스마가 있습니다. CEO, 군인, 운동선수 등에서 성공하는 경우가 많아요. 다만 독단적이거나 과격한 면이 있어 대인관계에서 충돌이 잦을 수 있습니다.',
                  advice: '강한 에너지를 건설적으로 사용하세요. 다른 사람의 의견도 경청하고, 유연함을 기르는 것이 성공의 열쇠입니다.'
                },
                '장성살': {
                  hanja: '將星煞',
                  origin: '장수(將帥)의 별(星)이라는 뜻으로, 삼합의 왕지(旺地)에서 발생합니다. 군대의 대장처럼 조직을 이끄는 권위와 위엄의 기운입니다.',
                  emoji: '⭐',
                  keywords: ['리더십', '권위', '자존심', '조직력', '승진'],
                  realLife: '조직에서 리더 역할을 맡기 쉽고, 자연스럽게 사람들이 따릅니다. 공무원, 군인, 관리직에서 승진이 빠른 편이에요. 다만 자존심이 지나치면 독선으로 비칠 수 있습니다.',
                  advice: '리더십을 발휘하되 겸손함을 잃지 마세요. 팀원들의 의견을 존중하면 더 큰 성과를 이룰 수 있습니다.'
                },
                '반안살': {
                  hanja: '攀鞍煞',
                  origin: '안장(鞍)에 오른다(攀)는 뜻으로, 말 위에 올라타는 것처럼 사회적 지위가 상승하는 기운입니다. 삼합의 관대지(冠帶地)에서 발생합니다.',
                  emoji: '🏇',
                  keywords: ['체면', '사회적 지위', '윗사람 도움', '외모', '품위'],
                  realLife: '외모를 가꾸는 것을 좋아하고 체면을 중시합니다. 윗사람이나 귀인의 도움으로 사회적 지위가 올라가는 경우가 많아요. 패션, 뷰티, 외교 분야에 적합합니다.',
                  advice: '외적인 것뿐 아니라 내면의 실력도 함께 키우세요. 진정한 품위는 겉과 속이 일치할 때 빛납니다.'
                },
                '천살': {
                  hanja: '天煞',
                  origin: '하늘(天)에서 내리는 재앙(煞)이라는 뜻입니다. 갑작스러운 천재지변이나 예기치 못한 환경 변화를 상징합니다.',
                  emoji: '⛈️',
                  keywords: ['천재지변', '갑작스러운 변화', '사고', '환경 변화', '불가항력'],
                  realLife: '자연재해, 갑작스러운 사고, 예측 불가능한 환경 변화에 노출되기 쉽습니다. 여행 중 사고나 갑작스러운 기상 변화에 주의가 필요해요.',
                  advice: '보험 가입, 비상 대비 등 안전망을 미리 준비하세요. 위험한 날씨나 상황에서는 무리하지 마세요.'
                },
                '지살': {
                  hanja: '地煞',
                  origin: '땅(地)에서 오는 재앙(煞)이라는 뜻입니다. 삼합의 생지(生地)에서 발생하며, 고독과 이별의 기운을 나타냅니다.',
                  emoji: '🌍',
                  keywords: ['고독', '이별', '독립', '타향살이', '자립'],
                  realLife: '가족과 떨어져 살거나 타향에서 생활하는 경우가 많습니다. 독립심이 강하고 혼자서도 잘 해내지만, 외로움을 느끼기 쉬워요.',
                  advice: '혼자만의 시간을 즐기되, 주변 사람들과의 연결도 소중히 하세요. 정기적으로 가족이나 친구와 소통하는 습관이 중요합니다.'
                },
                '년살': {
                  hanja: '年煞',
                  origin: '해(年)마다 반복되는 색정(色情)의 기운입니다. 도화살과 유사하나, 가정 내 이성 문제에 더 초점이 맞춰져 있습니다.',
                  emoji: '💔',
                  keywords: ['색정', '이성 문제', '가정 갈등', '외도', '감정 기복'],
                  realLife: '이성 관계가 복잡해지기 쉽고, 가정 내에서 이성 문제로 갈등이 생길 수 있습니다. 감정적으로 흔들리기 쉬운 시기가 반복될 수 있어요.',
                  advice: '감정에 휘둘리지 않도록 이성적 판단을 유지하세요. 배우자나 파트너와의 신뢰를 쌓는 것이 가장 중요합니다.'
                },
                '월살': {
                  hanja: '月煞',
                  origin: '달(月)의 재앙(煞)이라는 뜻으로, 일의 진행을 방해하는 장애물의 기운입니다. 고초와 어려움을 상징합니다.',
                  emoji: '🌙',
                  keywords: ['장애물', '고초', '지연', '인내', '시련'],
                  realLife: '일이 잘 풀리지 않고 예상치 못한 장애물을 자주 만납니다. 계획대로 되지 않는 상황이 반복될 수 있어요. 건강 문제로 고생할 수도 있습니다.',
                  advice: '인내심을 가지고 꾸준히 노력하세요. 장애물은 성장의 기회이기도 합니다. 건강 관리에도 신경 쓰세요.'
                },
                '재살': {
                  hanja: '災煞',
                  origin: '재앙(災)의 살(煞)로, 12신살 중 가장 강력한 흉살입니다. 혈광(血光)과 관재(官災)를 상징하며, 큰 위험을 경고합니다.',
                  emoji: '🚨',
                  keywords: ['관재수', '소송', '사고', '혈광', '위험'],
                  realLife: '법적 분쟁, 소송, 교통사고, 수술 등 큰 재앙에 노출될 위험이 있습니다. 관공서와 관련된 문제가 생기기 쉬워요.',
                  advice: '법적 문제에 휘말리지 않도록 주의하고, 계약서는 꼼꼼히 확인하세요. 위험한 활동은 자제하고 안전을 최우선으로 하세요.'
                },
                '육해살': {
                  hanja: '六害煞',
                  origin: '여섯(六) 가지 해(害)로운 관계라는 뜻입니다. 육합(六合)의 반대 개념으로, 가까운 사이에서 갈등과 배신이 일어나는 기운입니다.',
                  emoji: '💢',
                  keywords: ['갈등', '배신', '불화', '가까운 사람', '신뢰 손상'],
                  realLife: '가족, 친구, 동료 등 가까운 사람과의 관계에서 갈등이 생기기 쉽습니다. 믿었던 사람에게 배신당하거나 오해가 생길 수 있어요.',
                  advice: '가까운 사람일수록 예의를 지키고 소통을 게을리하지 마세요. 기대를 낮추고 상대방의 입장에서 생각하는 연습이 필요합니다.'
                },
                '천덕귀인': {
                  hanja: '天德貴人',
                  origin: '하늘(天)의 덕(德)을 받는 귀한 사람(貴人)이라는 뜻입니다. 월지(月支)를 기준으로 판별하며, 재앙을 복으로 바꾸는 최고의 길신 중 하나입니다.',
                  emoji: '🙏',
                  keywords: ['재앙 해소', '복', '귀인', '보호', '흉살 감소'],
                  realLife: '큰 위기에서도 자연스럽게 빠져나올 수 있고, 다른 흉살의 영향을 크게 줄여줍니다. 사고가 나도 크게 다치지 않거나, 위기가 오히려 전화위복이 되는 경우가 많아요.',
                  advice: '천덕귀인의 보호를 믿되 방심하지 마세요. 덕을 쌓는 삶을 살면 귀인의 기운이 더욱 강해집니다.'
                },
                '월덕귀인': {
                  hanja: '月德貴人',
                  origin: '달(月)의 덕(德)을 받는 귀한 사람(貴人)이라는 뜻입니다. 월지의 삼합 기준으로 판별하며, 온화한 성품과 덕망을 나타냅니다.',
                  emoji: '🌕',
                  keywords: ['덕망', '온화', '존경', '자연 해결', '인복'],
                  realLife: '성격이 온화하고 덕이 있어 주변 사람들에게 존경받습니다. 어려운 일이 생겨도 자연스럽게 해결되는 경우가 많고, 인복이 좋아요.',
                  advice: '타고난 덕을 나누세요. 봉사활동이나 주변을 돕는 일이 운을 더욱 좋게 만듭니다.'
                },
                '문창귀인': {
                  hanja: '文昌貴人',
                  origin: '문장(文章)이 창성(昌盛)한다는 뜻으로, 학문과 글쓰기의 별입니다. 일간(日干)을 기준으로 특정 지지에서 발생합니다.',
                  emoji: '📚',
                  keywords: ['학문', '시험운', '글쓰기', '자격증', '교육'],
                  realLife: '학업 성취도가 높고 시험운이 좋습니다. 글쓰기, 연구, 교육 분야에서 두각을 나타내며, 자격증 시험이나 공무원 시험에 유리해요.',
                  advice: '학문적 재능을 적극 활용하세요. 자격증 취득, 논문 작성, 강의 등 지적 활동에서 큰 성과를 거둘 수 있습니다.'
                },
                '학당귀인': {
                  hanja: '學堂貴人',
                  origin: '배움의 전당(學堂)을 뜻하는 길신입니다. 일간의 장생지(長生地)와 관련되며, 평생 학습의 기운을 나타냅니다.',
                  emoji: '🎓',
                  keywords: ['학습', '집중력', '지적 호기심', '전문성', '연구'],
                  realLife: '공부에 대한 집중력이 높고 지적 호기심이 강합니다. 평생 배움을 즐기며, 전문 분야에서 깊은 지식을 쌓아 인정받을 수 있어요.',
                  advice: '관심 분야의 공부를 꾸준히 이어가세요. 깊이 있는 전문성이 인생의 큰 무기가 됩니다.'
                },
                '원진살': {
                  hanja: '怨嗔煞',
                  origin: '원망(怨)하고 성냄(嗔)의 기운입니다. 년지와 일지가 특정 조합일 때 발생하며, 애증(愛憎)의 관계를 나타냅니다.',
                  emoji: '😤',
                  keywords: ['애증', '갈등', '배우자 문제', '밀당', '감정 기복'],
                  realLife: '가까운 사람(특히 배우자)과 사랑과 미움이 교차하는 관계가 됩니다. 좋을 때는 매우 좋지만, 나쁠 때는 극도로 나빠지는 롤러코스터 같은 관계 패턴이에요.',
                  advice: '감정의 기복을 인식하고 조절하는 연습이 필요합니다. 갈등 상황에서는 한 발 물러서서 냉정하게 판단하세요.'
                },
                '공망': {
                  hanja: '空亡',
                  origin: '비어있다(空)는 것과 사라진다(亡)는 뜻의 조합입니다. 일주(日柱)가 속한 순(旬)에서 빠진 두 지지가 사주에 있을 때 발생합니다.',
                  emoji: '🕳️',
                  keywords: ['헛수고', '무력화', '허무', '수행', '영적 성장'],
                  realLife: '노력한 만큼 결과가 따라오지 않거나, 기대했던 일이 무산될 수 있습니다. 물질적 성취보다는 정신적 성장에 유리하며, 종교인이나 예술가에게는 오히려 좋은 작용을 해요.',
                  advice: '물질적 욕심을 내려놓고 정신적 성장에 집중하면 오히려 좋은 결과를 얻을 수 있습니다. 명상이나 봉사활동이 도움이 됩니다.'
                }
              };
              const detail = salDetails[sal.name];
              return (
                <div
                  key={idx}
                  className={`rounded-xl overflow-hidden border-2 ${
                    sal.isPositive
                      ? 'border-green-500/30'
                      : 'border-orange-500/30'
                  }`}
                >
                  {/* 헤더 */}
                  <div className={`px-4 py-3 ${
                    sal.isPositive
                      ? 'bg-green-500/20'
                      : 'bg-orange-500/20'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{detail?.emoji || (sal.isPositive ? '✨' : '⚠️')}</span>
                      <div>
                        <h4 className="font-bold text-base md:text-lg flex items-center gap-2">
                          {sal.name}
                          {detail && <span className="text-white/40 text-sm font-normal">({detail.hanja})</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            sal.isPositive
                              ? 'bg-green-500/30 text-green-400'
                              : 'bg-orange-500/30 text-orange-400'
                          }`}>
                            {sal.isPositive ? '길신' : '흉살'}
                          </span>
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* 본문 */}
                  <div className={`p-4 space-y-3 ${
                    sal.isPositive ? 'bg-green-500/5' : 'bg-orange-500/5'
                  }`}>
                    {/* 정의 */}
                    {detail && (
                      <div>
                        <p className="text-xs text-white/40 mb-1 font-semibold">정의</p>
                        <p className="text-white/80 text-sm leading-relaxed">{detail.origin}</p>
                      </div>
                    )}

                    {/* 키워드 */}
                    {detail && (
                      <div className="flex flex-wrap gap-1.5">
                        {detail.keywords.map((kw, ki) => (
                          <span key={ki} className={`text-xs px-2 py-1 rounded-full ${
                            sal.isPositive
                              ? 'bg-green-500/15 text-green-300'
                              : 'bg-orange-500/15 text-orange-300'
                          }`}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 실생활 영향 */}
                    {detail && (
                      <div>
                        <p className="text-xs text-white/40 mb-1 font-semibold">실생활 영향</p>
                        <p className="text-white/70 text-sm leading-relaxed">{detail.realLife}</p>
                      </div>
                    )}

                    {/* 조언 */}
                    {detail && (
                      <div className={`rounded-lg p-3 ${
                        sal.isPositive ? 'bg-green-500/10' : 'bg-orange-500/10'
                      }`}>
                        <p className="text-xs text-white/40 mb-1 font-semibold">💡 조언</p>
                        <p className="text-white/80 text-sm leading-relaxed">{detail.advice}</p>
                      </div>
                    )}

                    {/* 발견 위치 */}
                    <p className="text-white/30 text-xs">{sal.location}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {analysis.sal.filter(s => !s.isPositive).length === 0 && (
            <p className="text-green-400 text-sm mt-3">
              ✨ 흉살이 없고 길신만 있어 전반적으로 좋은 기운을 가지고 계세요!
            </p>
          )}
        </div>
      )}

      {/* 오행 가이드 */}
      <ElementGuide />
    </div>
  );
}
