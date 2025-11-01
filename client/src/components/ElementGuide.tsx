import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ElementInfo {
  name: string;
  emoji: string;
  color: string;
  description: string;
  characteristics: string[];
  positiveTraits: string[];
  carePoints: string[];
}

const ELEMENTS: ElementInfo[] = [
  {
    name: '목(木)',
    emoji: '🌳',
    color: 'text-green-400',
    description: '나무처럼 성장하고 발전하는 에너지입니다. 봄의 기운을 담고 있어요.',
    characteristics: [
      '성장과 발전을 상징해요',
      '창의력과 상상력이 풍부해요',
      '새로운 것을 시작하는 힘이 있어요',
      '유연하고 적응력이 좋아요'
    ],
    positiveTraits: [
      '아이디어가 샘솟아요',
      '긍정적이고 진취적이에요',
      '사람들과 잘 어울려요'
    ],
    carePoints: [
      '너무 많으면 우유부단해질 수 있어요',
      '결정을 내리기 어려울 때가 있어요'
    ]
  },
  {
    name: '화(火)',
    emoji: '🔥',
    color: 'text-red-400',
    description: '불처럼 뜨겁고 활발한 에너지입니다. 여름의 열정을 담고 있어요.',
    characteristics: [
      '열정과 활력을 상징해요',
      '밝고 적극적인 성격이에요',
      '표현력이 뛰어나요',
      '사교적이고 활동적이에요'
    ],
    positiveTraits: [
      '리더십이 강해요',
      '사람들에게 에너지를 줘요',
      '도전을 즐겨요'
    ],
    carePoints: [
      '너무 많으면 충동적일 수 있어요',
      '감정 기복이 클 수 있어요'
    ]
  },
  {
    name: '토(土)',
    emoji: '⛰️',
    color: 'text-yellow-400',
    description: '땅처럼 안정적이고 든든한 에너지입니다. 계절의 전환기를 담당해요.',
    characteristics: [
      '안정과 신뢰를 상징해요',
      '현실적이고 실용적이에요',
      '책임감이 강해요',
      '포용력이 있어요'
    ],
    positiveTraits: [
      '믿음직스러워요',
      '끈기가 있어요',
      '중재를 잘해요'
    ],
    carePoints: [
      '너무 많으면 고집이 세질 수 있어요',
      '변화를 싫어할 수 있어요'
    ]
  },
  {
    name: '금(金)',
    emoji: '⚔️',
    color: 'text-gray-300',
    description: '쇠처럼 날카롭고 단단한 에너지입니다. 가을의 수확을 담고 있어요.',
    characteristics: [
      '정의와 원칙을 상징해요',
      '논리적이고 분석적이에요',
      '결단력이 있어요',
      '목표 지향적이에요'
    ],
    positiveTraits: [
      '판단력이 뛰어나요',
      '정리정돈을 잘해요',
      '의리가 있어요'
    ],
    carePoints: [
      '너무 많으면 완벽주의가 될 수 있어요',
      '융통성이 부족할 수 있어요'
    ]
  },
  {
    name: '수(水)',
    emoji: '💧',
    color: 'text-blue-400',
    description: '물처럼 흐르고 깊은 에너지입니다. 겨울의 지혜를 담고 있어요.',
    characteristics: [
      '지혜와 통찰을 상징해요',
      '사색적이고 깊이 있어요',
      '적응력이 뛰어나요',
      '감수성이 풍부해요'
    ],
    positiveTraits: [
      '배우는 걸 좋아해요',
      '상황 파악이 빨라요',
      '공감 능력이 좋아요'
    ],
    carePoints: [
      '너무 많으면 우울해질 수 있어요',
      '지나치게 생각이 많을 수 있어요'
    ]
  }
];

export default function ElementGuide() {
  const [expandedElement, setExpandedElement] = useState<string | null>(null);

  const toggleElement = (elementName: string) => {
    setExpandedElement(expandedElement === elementName ? null : elementName);
  };

  return (
    <div className="card bg-gradient-to-br from-purple-600/20 to-indigo-600/20">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>🌟</span>
        <span>오행(五行)이란?</span>
      </h3>
      
      <p className="text-white/80 mb-6 leading-relaxed">
        오행은 우주와 인간을 이루는 다섯 가지 기본 에너지예요. 
        나무(목), 불(화), 흙(토), 쇠(금), 물(수)로 이루어져 있으며, 
        서로 도와주고 조절하면서 균형을 이루고 있답니다.
      </p>

      <div className="space-y-3">
        {ELEMENTS.map((element) => (
          <div key={element.name} className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
            <button
              onClick={() => toggleElement(element.name)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{element.emoji}</span>
                <div className="text-left">
                  <h4 className={`font-bold text-lg ${element.color}`}>{element.name}</h4>
                  <p className="text-sm text-white/70">{element.description}</p>
                </div>
              </div>
              {expandedElement === element.name ? (
                <ChevronUp className="w-5 h-5 text-white/50" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white/50" />
              )}
            </button>

            {expandedElement === element.name && (
              <div className="p-4 pt-0 space-y-4 animate-slideDown">
                <div>
                  <h5 className="font-semibold text-white/90 mb-2">✨ 특징</h5>
                  <ul className="space-y-1">
                    {element.characteristics.map((char, idx) => (
                      <li key={idx} className="text-white/80 text-sm pl-4">
                        • {char}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-green-400 mb-2">💪 강점</h5>
                  <ul className="space-y-1">
                    {element.positiveTraits.map((trait, idx) => (
                      <li key={idx} className="text-white/80 text-sm pl-4">
                        • {trait}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-yellow-400 mb-2">⚠️ 주의할 점</h5>
                  <ul className="space-y-1">
                    {element.carePoints.map((point, idx) => (
                      <li key={idx} className="text-white/80 text-sm pl-4">
                        • {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
