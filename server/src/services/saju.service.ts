const { Solar, Lunar } = require('lunar-javascript');
import {
  BirthInfo,
  SajuChart,
  SajuPillar,
  Element,
  ElementBalance,
  SajuAnalysis,
  SalInfo,
  SalType,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES
} from '../models/saju.model';

export class SajuService {
  // 간지를 한글로 변환하는 헬퍼 함수
  private parseGanZhi(ganZhi: string): { stem: string; branch: string } {
    const ganZhiMap: Record<string, { stem: string; branch: string }> = {
      '甲子': { stem: '갑', branch: '자' }, '乙丑': { stem: '을', branch: '축' },
      '丙寅': { stem: '병', branch: '인' }, '丁卯': { stem: '정', branch: '묘' },
      '戊辰': { stem: '무', branch: '진' }, '己巳': { stem: '기', branch: '사' },
      '庚午': { stem: '경', branch: '오' }, '辛未': { stem: '신', branch: '미' },
      '壬申': { stem: '임', branch: '신' }, '癸酉': { stem: '계', branch: '유' },
      '甲戌': { stem: '갑', branch: '술' }, '乙亥': { stem: '을', branch: '해' },
      '丙子': { stem: '병', branch: '자' }, '丁丑': { stem: '정', branch: '축' },
      '戊寅': { stem: '무', branch: '인' }, '己卯': { stem: '기', branch: '묘' },
      '庚辰': { stem: '경', branch: '진' }, '辛巳': { stem: '신', branch: '사' },
      '壬午': { stem: '임', branch: '오' }, '癸未': { stem: '계', branch: '미' },
      '甲申': { stem: '갑', branch: '신' }, '乙酉': { stem: '을', branch: '유' },
      '丙戌': { stem: '병', branch: '술' }, '丁亥': { stem: '정', branch: '해' },
      '戊子': { stem: '무', branch: '자' }, '己丑': { stem: '기', branch: '축' },
      '庚寅': { stem: '경', branch: '인' }, '辛卯': { stem: '신', branch: '묘' },
      '壬辰': { stem: '임', branch: '진' }, '癸巳': { stem: '계', branch: '사' },
      '甲午': { stem: '갑', branch: '오' }, '乙未': { stem: '을', branch: '미' },
      '丙申': { stem: '병', branch: '신' }, '丁酉': { stem: '정', branch: '유' },
      '戊戌': { stem: '무', branch: '술' }, '己亥': { stem: '기', branch: '해' },
      '庚子': { stem: '경', branch: '자' }, '辛丑': { stem: '신', branch: '축' },
      '壬寅': { stem: '임', branch: '인' }, '癸卯': { stem: '계', branch: '묘' },
      '甲辰': { stem: '갑', branch: '진' }, '乙巳': { stem: '을', branch: '사' },
      '丙午': { stem: '병', branch: '오' }, '丁未': { stem: '정', branch: '미' },
      '戊申': { stem: '무', branch: '신' }, '己酉': { stem: '기', branch: '유' },
      '庚戌': { stem: '경', branch: '술' }, '辛亥': { stem: '신', branch: '해' },
      '壬子': { stem: '임', branch: '자' }, '癸丑': { stem: '계', branch: '축' },
      '甲寅': { stem: '갑', branch: '인' }, '乙卯': { stem: '을', branch: '묘' },
      '丙辰': { stem: '병', branch: '진' }, '丁巳': { stem: '정', branch: '사' },
      '戊午': { stem: '무', branch: '오' }, '己未': { stem: '기', branch: '미' },
      '庚申': { stem: '경', branch: '신' }, '辛酉': { stem: '신', branch: '유' },
      '壬戌': { stem: '임', branch: '술' }, '癸亥': { stem: '계', branch: '해' }
    };
    
    return ganZhiMap[ganZhi] || { stem: '갑', branch: '자' };
  }

  // lunar-javascript 라이브러리를 사용한 정확한 사주 계산
  private getPillarFromGanZhi(ganZhi: string): SajuPillar {
    const { stem, branch } = this.parseGanZhi(ganZhi);
    
    return {
      heavenlyStem: stem,
      earthlyBranch: branch,
      element: HEAVENLY_STEMS[stem as keyof typeof HEAVENLY_STEMS].element as Element
    };
  }

  // 오행 균형 계산
  private calculateElementBalance(chart: SajuChart): ElementBalance {
    const balance: ElementBalance = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    
    // 천간의 오행
    Object.values(chart).forEach(pillar => {
      const stemElement = HEAVENLY_STEMS[pillar.heavenlyStem as keyof typeof HEAVENLY_STEMS].element as Element;
      balance[stemElement] += 2; // 천간은 가중치 2
    });
    
    // 지지의 오행
    Object.values(chart).forEach(pillar => {
      const branchElement = EARTHLY_BRANCHES[pillar.earthlyBranch as keyof typeof EARTHLY_BRANCHES].element as Element;
      balance[branchElement] += 1; // 지지는 가중치 1
    });
    
    return balance;
  }

  // 성격 분석
  private analyzePersonality(dayMasterElement: Element, elementBalance: ElementBalance): {
    personality: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  } {
    const total = Object.values(elementBalance).reduce((sum, val) => sum + val, 0);
    const percentages: Record<Element, number> = {
      목: (elementBalance.목 / total) * 100,
      화: (elementBalance.화 / total) * 100,
      토: (elementBalance.토 / total) * 100,
      금: (elementBalance.금 / total) * 100,
      수: (elementBalance.수 / total) * 100
    };

    let personality = '';
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // 일간 기준 성격 분석
    switch (dayMasterElement) {
      case '목':
        personality = '성장과 발전을 추구하는 진취적인 성격입니다. 창의적이고 유연하며, 새로운 것에 대한 호기심이 많습니다.';
        strengths.push('창의성', '성장 의지', '유연성');
        if (percentages.목 > 30) weaknesses.push('우유부단함', '과도한 이상주의');
        if (percentages.목 < 15) recommendations.push('창의적 활동 증가');
        break;
      case '화':
        personality = '열정적이고 활동적인 성격입니다. 표현력이 풍부하고 사람들과의 교류를 즐깁니다.';
        strengths.push('열정', '표현력', '사교성');
        if (percentages.화 > 30) weaknesses.push('충동성', '감정 기복');
        if (percentages.화 < 15) recommendations.push('정서적 표현 증가');
        break;
      case '토':
        personality = '안정적이고 신뢰할 수 있는 성격입니다. 책임감이 강하고 현실적인 판단력을 가지고 있습니다.';
        strengths.push('안정성', '신뢰성', '책임감');
        if (percentages.토 > 30) weaknesses.push('고집', '변화에 대한 저항');
        if (percentages.토 < 15) recommendations.push('안정감 확보');
        break;
      case '금':
        personality = '원칙과 정의를 중시하는 성격입니다. 논리적이고 분석적이며, 목표 지향적입니다.';
        strengths.push('논리성', '결단력', '원칙');
        if (percentages.금 > 30) weaknesses.push('완벽주의', '융통성 부족');
        if (percentages.금 < 15) recommendations.push('체계적 사고 훈련');
        break;
      case '수':
        personality = '지혜롭고 통찰력이 있는 성격입니다. 적응력이 뛰어나고 깊이 있는 사고를 합니다.';
        strengths.push('지혜', '적응력', '통찰력');
        if (percentages.수 > 30) weaknesses.push('우울함', '과도한 사색');
        if (percentages.수 < 15) recommendations.push('명상과 성찰 시간');
        break;
    }

    // 오행 불균형 체크
    const strongElements = Object.entries(percentages)
      .filter(([_, pct]) => pct > 25)
      .map(([el, _]) => el as Element);
    
    const weakElements = Object.entries(percentages)
      .filter(([_, pct]) => pct < 15)
      .map(([el, _]) => el as Element);

    if (weakElements.length > 0) {
      recommendations.push(`부족한 ${weakElements.join(', ')} 기운을 보완하는 활동이 필요합니다.`);
    }

    return { personality, strengths, weaknesses, recommendations };
  }

  // 살(煞) 분석
  private analyzeSal(chart: SajuChart): SalInfo[] {
    const salList: SalInfo[] = [];
    const allBranches: string[] = [
      chart.year.earthlyBranch,
      chart.month.earthlyBranch,
      chart.day.earthlyBranch,
      ...(chart.hour ? [chart.hour.earthlyBranch] : [])
    ];
    const yearBranch = chart.year.earthlyBranch;
    const dayBranch = chart.day.earthlyBranch;
    const dayStem = chart.day.heavenlyStem;

    // === 도화살(桃花煞) ===
    // 삼합 기준: 인오술→묘, 사유축→오, 신자진→유, 해묘미→자
    const doHwaMap: Record<string, string> = {
      '인': '묘', '오': '묘', '술': '묘',
      '사': '오', '유': '오', '축': '오',
      '신': '유', '자': '유', '진': '유',
      '해': '자', '묘': '자', '미': '자'
    };
    for (const basis of [yearBranch, dayBranch]) {
      const target = doHwaMap[basis];
      if (target && allBranches.includes(target) && target !== basis) {
        const basisLabel = basis === yearBranch ? '년지' : '일지';
        if (!salList.find(s => s.name === '도화살')) {
          salList.push({
            name: '도화살',
            description: '이성에 대한 매력과 인연이 강한 살입니다. 연애운과 대인관계에 큰 영향을 미칩니다.',
            effect: '이성에게 매력적이고 사교성이 뛰어나지만, 바람기나 구설수에 주의가 필요합니다. 감정에 휘둘리기 쉬운 면이 있어요.',
            isPositive: false,
            location: `${basisLabel}(${basis}) 기준 → ${target}에서 발견`
          });
        }
      }
    }

    // === 역마살(驛馬煞) ===
    // 삼합 기준: 인오술→신, 사유축→해, 신자진→인, 해묘미→사
    const yeokMaMap: Record<string, string> = {
      '인': '신', '오': '신', '술': '신',
      '사': '해', '유': '해', '축': '해',
      '신': '인', '자': '인', '진': '인',
      '해': '사', '묘': '사', '미': '사'
    };
    for (const basis of [yearBranch, dayBranch]) {
      const target = yeokMaMap[basis];
      if (target && allBranches.includes(target) && target !== basis) {
        const basisLabel = basis === yearBranch ? '년지' : '일지';
        if (!salList.find(s => s.name === '역마살')) {
          salList.push({
            name: '역마살',
            description: '이동과 변화의 기운이 강한 살입니다. 여행, 이사, 이직 등 움직임이 많습니다.',
            effect: '활동적이고 변화를 추구하지만, 한 곳에 정착하기 어렵고 안정감이 부족할 수 있습니다. 해외 인연이나 출장이 잦을 수 있어요.',
            isPositive: false,
            location: `${basisLabel}(${basis}) 기준 → ${target}에서 발견`
          });
        }
      }
    }

    // === 화개살(華蓋煞) ===
    // 삼합 기준: 인오술→술, 사유축→축, 신자진→진, 해묘미→미
    const hwaGaeMap: Record<string, string> = {
      '인': '술', '오': '술', '술': '술',
      '사': '축', '유': '축', '축': '축',
      '신': '진', '자': '진', '진': '진',
      '해': '미', '묘': '미', '미': '미'
    };
    for (const basis of [yearBranch, dayBranch]) {
      const target = hwaGaeMap[basis];
      if (target && allBranches.includes(target) && target !== basis) {
        const basisLabel = basis === yearBranch ? '년지' : '일지';
        if (!salList.find(s => s.name === '화개살')) {
          salList.push({
            name: '화개살',
            description: '예술적 감각과 종교적 영성이 강한 살입니다. 학문과 예술에 뛰어난 재능을 보입니다.',
            effect: '창의력과 영적 감수성이 뛰어나지만, 고독하거나 현실과 동떨어진 생각에 빠질 수 있습니다. 혼자만의 시간을 중요시해요.',
            isPositive: false,
            location: `${basisLabel}(${basis}) 기준 → ${target}에서 발견`
          });
        }
      }
    }

    // === 겁살(劫殺) ===
    // 삼합 기준: 인오술→해, 사유축→인, 신자진→사, 해묘미→신
    const geobSalMap: Record<string, string> = {
      '인': '해', '오': '해', '술': '해',
      '사': '인', '유': '인', '축': '인',
      '신': '사', '자': '사', '진': '사',
      '해': '신', '묘': '신', '미': '신'
    };
    for (const basis of [yearBranch, dayBranch]) {
      const target = geobSalMap[basis];
      if (target && allBranches.includes(target) && target !== basis) {
        const basisLabel = basis === yearBranch ? '년지' : '일지';
        if (!salList.find(s => s.name === '겁살')) {
          salList.push({
            name: '겁살',
            description: '재물과 인연에서 경쟁과 손실이 발생할 수 있는 살입니다.',
            effect: '경쟁심이 강하고 승부욕이 있지만, 재물 손실이나 사기를 당할 위험이 있습니다. 투자나 보증에 신중해야 해요.',
            isPositive: false,
            location: `${basisLabel}(${basis}) 기준 → ${target}에서 발견`
          });
        }
      }
    }

    // === 망신살(亡身煞) ===
    // 삼합 기준: 인오술→유, 사유축→자, 신자진→묘, 해묘미→오
    const mangShinMap: Record<string, string> = {
      '인': '유', '오': '유', '술': '유',
      '사': '자', '유': '자', '축': '자',
      '신': '묘', '자': '묘', '진': '묘',
      '해': '오', '묘': '오', '미': '오'
    };
    for (const basis of [yearBranch, dayBranch]) {
      const target = mangShinMap[basis];
      if (target && allBranches.includes(target) && target !== basis) {
        const basisLabel = basis === yearBranch ? '년지' : '일지';
        if (!salList.find(s => s.name === '망신살')) {
          salList.push({
            name: '망신살',
            description: '명예와 체면에 손상이 올 수 있는 살입니다. 구설수나 평판 하락에 주의가 필요합니다.',
            effect: '자존심이 강하고 체면을 중시하지만, 뜻하지 않은 실수나 구설로 명예가 손상될 수 있습니다. 말과 행동에 신중해야 해요.',
            isPositive: false,
            location: `${basisLabel}(${basis}) 기준 → ${target}에서 발견`
          });
        }
      }
    }

    // === 백호살(白虎煞) ===
    // 특정 일주(천간+지지 조합) 기준
    const baekHoIlju = ['무진', '정축', '병술', '을미', '갑진', '계축', '임술'];
    const currentIlju = chart.day.heavenlyStem + chart.day.earthlyBranch;
    if (baekHoIlju.includes(currentIlju)) {
      salList.push({
        name: '백호살',
        description: '사고나 부상의 위험이 있는 강력한 살입니다. 수술, 교통사고 등에 주의가 필요합니다.',
        effect: '강한 추진력과 결단력이 있지만, 급격한 변화나 사고를 겪을 수 있습니다. 건강 관리와 안전에 특별히 신경 써야 해요.',
        isPositive: false,
        location: `일주(${currentIlju})에서 발견`
      });
    }

    // === 천을귀인(天乙貴人) === (길신)
    const cheonEulMap: Record<string, string[]> = {
      '갑': ['축', '미'], '무': ['축', '미'],
      '을': ['자', '신'], '기': ['자', '신'],
      '병': ['해', '유'], '정': ['해', '유'],
      '경': ['축', '미'], '신': ['인', '오'],
      '임': ['묘', '사'], '계': ['묘', '사']
    };
    const guiinTargets = cheonEulMap[dayStem];
    if (guiinTargets) {
      const found = allBranches.filter(b => guiinTargets.includes(b));
      if (found.length > 0) {
        salList.push({
          name: '천을귀인',
          description: '가장 강력한 길신(吉神)입니다. 어려울 때 귀인의 도움을 받을 수 있습니다.',
          effect: '위기 상황에서 도움을 주는 사람이 나타나고, 대인관계가 원만합니다. 사회적으로 인정받기 쉽고 운이 좋은 편이에요.',
          isPositive: true,
          location: `일간(${dayStem}) 기준 → ${found.join(', ')}에서 발견`
        });
      }
    }

    // === 귀문관살(鬼門關煞) ===
    const guiMunPairs: [string, string][] = [
      ['자', '유'], ['유', '오'], ['오', '묘'], ['묘', '자'],
      ['축', '술'], ['술', '미'], ['미', '진'], ['진', '축'],
      ['인', '해'], ['해', '신'], ['신', '사'], ['사', '인']
    ];
    // 일지-월지 또는 일지-시지 조합 체크
    const checkPairs: [string, string, string][] = [
      [dayBranch, chart.month.earthlyBranch, '일지-월지'],
    ];
    if (chart.hour) {
      checkPairs.push([dayBranch, chart.hour.earthlyBranch, '일지-시지']);
    }
    for (const [a, b, label] of checkPairs) {
      const hasGuiMun = guiMunPairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
      if (hasGuiMun && !salList.find(s => s.name === '귀문관살')) {
        salList.push({
          name: '귀문관살',
          description: '정신적 예민함과 영적 감수성이 강한 살입니다. 직감이 뛰어나지만 불안감도 클 수 있습니다.',
          effect: '직감과 통찰력이 뛰어나지만, 정신적 스트레스나 불안, 악몽에 시달릴 수 있습니다. 명상이나 심리 안정이 중요해요.',
          isPositive: false,
          location: `${label}(${a}-${b})에서 발견`
        });
      }
    }

    // === 양인살(羊刃煞) ===
    const yangInMap: Record<string, string> = {
      '갑': '묘', '을': '인', '병': '오', '정': '사',
      '무': '오', '기': '사', '경': '유', '신': '신',
      '임': '자', '계': '해'
    };
    const yangInTarget = yangInMap[dayStem];
    if (yangInTarget && allBranches.includes(yangInTarget)) {
      salList.push({
        name: '양인살',
        description: '강한 기운과 결단력을 가진 살입니다. 칼날처럼 날카로운 성격을 나타냅니다.',
        effect: '추진력과 결단력이 매우 강하지만, 과격하거나 독단적일 수 있습니다. 대인관계에서 충돌이 생기기 쉬우니 유연함이 필요해요.',
        isPositive: false,
        location: `일간(${dayStem}) 기준 → ${yangInTarget}에서 발견`
      });
    }

    // === 장성살(將星煞) === (길신)
    // 삼합 기준 왕지: 인오술→오, 사유축→유, 신자진→자, 해묘미→묘
    const jangSeongMap: Record<string, string> = {
      '인': '오', '오': '오', '술': '오',
      '사': '유', '유': '유', '축': '유',
      '신': '자', '자': '자', '진': '자',
      '해': '묘', '묘': '묘', '미': '묘'
    };
    for (const basis of [yearBranch, dayBranch]) {
      const target = jangSeongMap[basis];
      if (target && allBranches.includes(target) && target !== basis) {
        if (!salList.find(s => s.name === '장성살')) {
          salList.push({
            name: '장성살',
            description: '권위와 리더십의 별입니다. 삼합의 왕지(旺地)에서 발생하며, 조직을 이끄는 힘을 가집니다.',
            effect: '리더십이 뛰어나고 자존심이 강합니다. 조직에서 높은 자리에 오르기 쉽지만, 지나치면 독선적이 될 수 있어요.',
            isPositive: true,
            location: `${basis === yearBranch ? '년지' : '일지'}(${basis}) 기준 → ${target}에서 발견`
          });
        }
      }
    }

    // === 반안살(攀鞍煞) === (길신)
    // 삼합 기준: 인오술→미, 사유축→술, 신자진→축, 해묘미→진
    const banAnMap: Record<string, string> = {
      '인': '미', '오': '미', '술': '미',
      '사': '술', '유': '술', '축': '술',
      '신': '축', '자': '축', '진': '축',
      '해': '진', '묘': '진', '미': '진'
    };
    for (const basis of [yearBranch, dayBranch]) {
      const target = banAnMap[basis];
      if (target && allBranches.includes(target) && target !== basis) {
        if (!salList.find(s => s.name === '반안살')) {
          salList.push({
            name: '반안살',
            description: '안장(鞍)에 오르는 기운으로, 윗사람의 도움과 사회적 체면을 나타냅니다.',
            effect: '외모나 체면을 중시하고 윗사람의 도움을 잘 받습니다. 사회적 지위 상승에 유리하지만, 과도하면 허영심이 될 수 있어요.',
            isPositive: true,
            location: `${basis === yearBranch ? '년지' : '일지'}(${basis}) 기준 → ${target}에서 발견`
          });
        }
      }
    }

    // === 천살(天煞) ===
    // 삼합 기준: 인오술→술, 사유축→축, 신자진→진, 해묘미→미 의 앞 지지
    // 인오술→유, 사유축→자, 신자진→묘, 해묘미→오
    const cheonSalMap: Record<string, string> = {
      '인': '유', '오': '유', '술': '유',
      '사': '자', '유': '자', '축': '자',
      '신': '묘', '자': '묘', '진': '묘',
      '해': '오', '묘': '오', '미': '오'
    };
    for (const basis of [yearBranch, dayBranch]) {
      const target = cheonSalMap[basis];
      if (target && allBranches.includes(target) && target !== basis) {
        if (!salList.find(s => s.name === '천살')) {
          salList.push({
            name: '천살',
            description: '하늘에서 내리는 재앙의 기운입니다. 갑작스러운 천재지변이나 예기치 못한 사고를 암시합니다.',
            effect: '갑작스러운 재난이나 사고에 노출될 수 있습니다. 자연재해, 갑작스러운 환경 변화에 대비하는 자세가 필요해요.',
            isPositive: false,
            location: `${basis === yearBranch ? '년지' : '일지'}(${basis}) 기준 → ${target}에서 발견`
          });
        }
      }
    }

    // === 지살(地煞) ===
    // 삼합 기준 생지: 인오술→인, 사유축→사, 신자진→신, 해묘미→해
    const jiSalMap: Record<string, string> = {
      '인': '인', '오': '인', '술': '인',
      '사': '사', '유': '사', '축': '사',
      '신': '신', '자': '신', '진': '신',
      '해': '해', '묘': '해', '미': '해'
    };
    for (const basis of [yearBranch, dayBranch]) {
      const target = jiSalMap[basis];
      if (target && allBranches.includes(target) && target !== basis) {
        if (!salList.find(s => s.name === '지살')) {
          salList.push({
            name: '지살',
            description: '땅에서 오는 고독과 외로움의 기운입니다. 생이별이나 홀로 지내는 시간이 많아질 수 있습니다.',
            effect: '고독감을 느끼기 쉽고 가족과 떨어져 지내는 경우가 많습니다. 독립심이 강하지만 외로움을 잘 달래는 방법이 필요해요.',
            isPositive: false,
            location: `${basis === yearBranch ? '년지' : '일지'}(${basis}) 기준 → ${target}에서 발견`
          });
        }
      }
    }

    // === 년살(年煞) ===
    // 삼합 기준: 인오술→묘, 사유축→오, 신자진→유, 해묘미→자 (도화살과 동일 위치이나 년지 기준 특화)
    // 실제로는 도화살의 다른 이름이기도 하므로, 여기서는 '연살'로서 색정/이성문제 특화
    // 인오술→묘, 사유축→오, 신자진→유, 해묘미→자
    const nyeonSalMap: Record<string, string> = {
      '인': '묘', '오': '묘', '술': '묘',
      '사': '오', '유': '오', '축': '오',
      '신': '유', '자': '유', '진': '유',
      '해': '자', '묘': '자', '미': '자'
    };
    // 년지 기준으로만 체크하고, 월지/시지에 있을 때 발동
    const nyeonTarget = nyeonSalMap[yearBranch];
    if (nyeonTarget) {
      const monthBranch = chart.month.earthlyBranch;
      const hourBranch = chart.hour?.earthlyBranch;
      if ((monthBranch === nyeonTarget || hourBranch === nyeonTarget) && !salList.find(s => s.name === '년살')) {
        salList.push({
          name: '년살',
          description: '색정과 이성 문제에 관련된 살입니다. 도화살과 비슷하나 가정 내 이성 문제에 더 초점이 맞춰져 있습니다.',
          effect: '이성 관계에서 복잡한 상황이 생기기 쉽습니다. 가정 내 갈등이나 외도 문제에 주의가 필요해요.',
          isPositive: false,
          location: `년지(${yearBranch}) 기준 → ${nyeonTarget}에서 발견`
        });
      }
    }

    // === 월살(月煞) ===
    // 삼합 기준: 인오술→축, 사유축→진, 신자진→미, 해묘미→술
    const wolSalMap: Record<string, string> = {
      '인': '축', '오': '축', '술': '축',
      '사': '진', '유': '진', '축': '진',
      '신': '미', '자': '미', '진': '미',
      '해': '술', '묘': '술', '미': '술'
    };
    for (const basis of [yearBranch, dayBranch]) {
      const target = wolSalMap[basis];
      if (target && allBranches.includes(target) && target !== basis) {
        if (!salList.find(s => s.name === '월살')) {
          salList.push({
            name: '월살',
            description: '고초와 장애의 기운입니다. 일이 잘 풀리지 않고 장애물이 많이 나타날 수 있습니다.',
            effect: '일의 진행이 더디고 예상치 못한 장애물을 만나기 쉽습니다. 인내심을 가지고 꾸준히 노력하는 것이 중요해요.',
            isPositive: false,
            location: `${basis === yearBranch ? '년지' : '일지'}(${basis}) 기준 → ${target}에서 발견`
          });
        }
      }
    }

    // === 재살(災煞) ===
    // 삼합 기준: 인오술→자, 사유축→묘, 신자진→오, 해묘미→유
    const jaeSalMap: Record<string, string> = {
      '인': '자', '오': '자', '술': '자',
      '사': '묘', '유': '묘', '축': '묘',
      '신': '오', '자': '오', '진': '오',
      '해': '유', '묘': '유', '미': '유'
    };
    for (const basis of [yearBranch, dayBranch]) {
      const target = jaeSalMap[basis];
      if (target && allBranches.includes(target) && target !== basis) {
        if (!salList.find(s => s.name === '재살')) {
          salList.push({
            name: '재살',
            description: '12신살 중 가장 강력한 흉살입니다. 혈광(血光)과 관재(官災)의 위험을 나타냅니다.',
            effect: '사고, 소송, 관재수 등 큰 재앙에 노출될 수 있습니다. 법적 문제나 신체적 위험에 특히 주의해야 해요.',
            isPositive: false,
            location: `${basis === yearBranch ? '년지' : '일지'}(${basis}) 기준 → ${target}에서 발견`
          });
        }
      }
    }

    // === 육해살(六害煞) ===
    // 육해(六害) 조합: 자-미, 축-오, 인-사, 묘-진, 신-해, 유-술
    const yukHaePairs: [string, string][] = [
      ['자', '미'], ['축', '오'], ['인', '사'],
      ['묘', '진'], ['신', '해'], ['유', '술']
    ];
    const yukHaeCheck: [string, string, string][] = [
      [dayBranch, chart.month.earthlyBranch, '일지-월지'],
      [dayBranch, yearBranch, '일지-년지'],
    ];
    if (chart.hour) {
      yukHaeCheck.push([dayBranch, chart.hour.earthlyBranch, '일지-시지']);
    }
    for (const [a, b, label] of yukHaeCheck) {
      const hasYukHae = yukHaePairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
      if (hasYukHae && !salList.find(s => s.name === '육해살')) {
        salList.push({
          name: '육해살',
          description: '서로 해(害)하는 관계로, 가까운 사람과의 갈등이나 배신을 나타냅니다.',
          effect: '가족, 친구, 동료 등 가까운 사람과의 관계에서 갈등이 생기기 쉽습니다. 신뢰 관계에 금이 갈 수 있으니 소통에 신경 쓰세요.',
          isPositive: false,
          location: `${label}(${a}-${b})에서 발견`
        });
      }
    }

    // === 천덕귀인(天德貴人) === (길신)
    // 월지 기준: 인→정, 묘→신, 진→임, 사→신, 오→갑, 미→계, 신→임, 유→경, 술→병, 해→을, 자→기, 축→경
    const cheonDeokMap: Record<string, string> = {
      '인': '정', '묘': '신', '진': '임', '사': '신',
      '오': '갑', '미': '계', '신': '임', '유': '경',
      '술': '병', '해': '을', '자': '기', '축': '경'
    };
    const monthBranch = chart.month.earthlyBranch;
    const allStems = [
      chart.year.heavenlyStem, chart.month.heavenlyStem,
      chart.day.heavenlyStem, ...(chart.hour ? [chart.hour.heavenlyStem] : [])
    ];
    const cheonDeokTarget = cheonDeokMap[monthBranch];
    if (cheonDeokTarget && allStems.includes(cheonDeokTarget)) {
      salList.push({
        name: '천덕귀인',
        description: '하늘의 덕(德)을 받는 최고의 길신 중 하나입니다. 재앙을 복으로 바꾸는 힘이 있습니다.',
        effect: '큰 위기에서도 자연스럽게 빠져나올 수 있고, 주변의 도움을 많이 받습니다. 흉살이 있어도 천덕귀인이 있으면 그 흉함이 크게 줄어들어요.',
        isPositive: true,
        location: `월지(${monthBranch}) 기준 → 천간 ${cheonDeokTarget}에서 발견`
      });
    }

    // === 월덕귀인(月德貴人) === (길신)
    // 월지 기준: 인오술→병, 사유축→경, 신자진→임, 해묘미→갑
    const wolDeokMap: Record<string, string> = {
      '인': '병', '오': '병', '술': '병',
      '사': '경', '유': '경', '축': '경',
      '신': '임', '자': '임', '진': '임',
      '해': '갑', '묘': '갑', '미': '갑'
    };
    const wolDeokTarget = wolDeokMap[monthBranch];
    if (wolDeokTarget && allStems.includes(wolDeokTarget)) {
      salList.push({
        name: '월덕귀인',
        description: '달의 덕(德)을 받는 길신입니다. 온화한 성품과 덕망을 나타냅니다.',
        effect: '성격이 온화하고 덕이 있어 주변 사람들에게 존경받습니다. 어려운 일이 생겨도 자연스럽게 해결되는 경우가 많아요.',
        isPositive: true,
        location: `월지(${monthBranch}) 기준 → 천간 ${wolDeokTarget}에서 발견`
      });
    }

    // === 문창귀인(文昌貴人) === (길신)
    // 일간 기준: 갑→사, 을→오, 병→신, 정→유, 무→신, 기→유, 경→해, 신→자, 임→인, 계→묘
    const munChangMap: Record<string, string> = {
      '갑': '사', '을': '오', '병': '신', '정': '유', '무': '신',
      '기': '유', '경': '해', '신': '자', '임': '인', '계': '묘'
    };
    const munChangTarget = munChangMap[dayStem];
    if (munChangTarget && allBranches.includes(munChangTarget)) {
      salList.push({
        name: '문창귀인',
        description: '문필(文筆)과 학문의 별입니다. 글쓰기, 시험, 학업에서 뛰어난 재능을 발휘합니다.',
        effect: '학업 성취도가 높고 시험운이 좋습니다. 글쓰기, 연구, 교육 분야에서 두각을 나타내며, 자격증이나 시험에 유리해요.',
        isPositive: true,
        location: `일간(${dayStem}) 기준 → ${munChangTarget}에서 발견`
      });
    }

    // === 학당귀인(學堂貴人) === (길신)
    // 일간 기준: 갑→해, 을→해, 병→인, 정→인, 무→인, 기→사, 경→사, 신→신, 임→신, 계→해 (장생지 기준)
    const hakDangMap: Record<string, string> = {
      '갑': '해', '을': '오', '병': '인', '정': '유',
      '무': '사', '기': '오', '경': '사', '신': '자',
      '임': '신', '계': '묘'
    };
    const hakDangTarget = hakDangMap[dayStem];
    if (hakDangTarget && allBranches.includes(hakDangTarget)) {
      salList.push({
        name: '학당귀인',
        description: '배움의 전당(學堂)을 뜻하는 길신입니다. 학문에 대한 열정과 집중력이 뛰어납니다.',
        effect: '공부에 대한 집중력이 높고 지적 호기심이 강합니다. 평생 배움을 즐기며, 전문 분야에서 깊은 지식을 쌓을 수 있어요.',
        isPositive: true,
        location: `일간(${dayStem}) 기준 → ${hakDangTarget}에서 발견`
      });
    }

    // === 원진살(怨嗔煞) ===
    // 년지/일지 기준 원진 관계: 자-미, 축-오, 인-유, 묘-신, 진-해, 사-술 (서로 원진)
    const wonJinPairs: [string, string][] = [
      ['자', '미'], ['축', '오'], ['인', '유'],
      ['묘', '신'], ['진', '해'], ['사', '술']
    ];
    // 년지-일지 간 원진 체크
    const hasWonJin = wonJinPairs.some(([x, y]) =>
      (yearBranch === x && dayBranch === y) || (yearBranch === y && dayBranch === x)
    );
    if (hasWonJin) {
      salList.push({
        name: '원진살',
        description: '원망(怨)과 성냄(嗔)의 기운으로, 서로 미워하면서도 떨어질 수 없는 관계를 나타냅니다.',
        effect: '가까운 사람(배우자, 가족)과 애증의 관계가 되기 쉽습니다. 좋을 때는 매우 좋지만 나쁠 때는 극도로 나빠지는 관계 패턴이 있어요.',
        isPositive: false,
        location: `년지(${yearBranch})-일지(${dayBranch}) 원진 관계`
      });
    }

    // === 공망(空亡) ===
    // 일주(일간+일지)의 순(旬) 기준으로 공망 지지 2개 결정
    // 갑자순→술해, 갑술순→신유, 갑신순→오미, 갑오순→진사, 갑진순→인묘, 갑인순→자축
    const stemIdx: Record<string, number> = {
      '갑': 0, '을': 1, '병': 2, '정': 3, '무': 4,
      '기': 5, '경': 6, '신': 7, '임': 8, '계': 9
    };
    const branchIdx: Record<string, number> = {
      '자': 0, '축': 1, '인': 2, '묘': 3, '진': 4, '사': 5,
      '오': 6, '미': 7, '신': 8, '유': 9, '술': 10, '해': 11
    };
    const branchNames = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
    const si = stemIdx[dayStem];
    const bi = branchIdx[dayBranch];
    if (si !== undefined && bi !== undefined) {
      // 순의 시작점: 일간 인덱스만큼 지지에서 뒤로 가면 갑(甲)이 시작하는 지지
      const startBranch = (bi - si + 12) % 12; // 순의 시작 지지 인덱스
      // 공망은 순에 포함되지 않는 마지막 2개 지지
      const gongMang1 = branchNames[(startBranch + 10) % 12];
      const gongMang2 = branchNames[(startBranch + 11) % 12];
      const gongMangInChart = allBranches.filter(b => b === gongMang1 || b === gongMang2);
      if (gongMangInChart.length > 0) {
        salList.push({
          name: '공망',
          description: '비어있는(空) 상태로 사라진다(亡)는 뜻입니다. 해당 지지의 기운이 무력화되어 헛수고가 될 수 있습니다.',
          effect: '노력한 만큼 결과가 따라오지 않거나, 기대했던 일이 무산될 수 있습니다. 다만 수행이나 종교, 예술 분야에서는 오히려 좋은 작용을 하기도 해요.',
          isPositive: false,
          location: `일주(${dayStem}${dayBranch}) 기준 → 공망 지지: ${gongMang1}, ${gongMang2} (사주 내 ${gongMangInChart.join(', ')}에서 발견)`
        });
      }
    }

    return salList;
  }

  // 메인 사주 분석 함수
  public analyzeSaju(birthInfo: BirthInfo): SajuAnalysis {
    let yearPillar: SajuPillar;
    let monthPillar: SajuPillar;
    let dayPillar: SajuPillar;
    let hourPillar: SajuPillar | undefined;
    
    try {
      let solar: any;
      const hour = birthInfo.hour ?? 12; // 시간이 없으면 12시 사용 (계산용)
      
      if (birthInfo.isLunar) {
        // 음력을 양력으로 변환 (윤달 자동 인식)
        let lunar: any;
        
        // 사용자가 명시적으로 윤달을 선택한 경우
        if (birthInfo.isLeapMonth === true) {
          lunar = Lunar.fromYmd(birthInfo.year, birthInfo.month, birthInfo.day, hour, 0, 0, true);
        } 
        // 사용자가 평달을 명시적으로 선택했거나 선택 안 한 경우
        else {
          try {
            // 먼저 평달로 시도
            lunar = Lunar.fromYmd(birthInfo.year, birthInfo.month, birthInfo.day, hour, 0, 0, false);
          } catch (error) {
            // 평달에 해당 날짜가 없으면 윤달로 시도 (자동 인식)
            try {
              console.log(`평달에 ${birthInfo.year}년 ${birthInfo.month}월 ${birthInfo.day}일이 없어 윤달로 자동 인식`);
              lunar = Lunar.fromYmd(birthInfo.year, birthInfo.month, birthInfo.day, hour, 0, 0, true);
            } catch (leapError) {
              // 윤달에도 없으면 원래 에러 발생
              throw error;
            }
          }
        }
        
        solar = lunar.getSolar();
      } else {
        // 양력 그대로 사용
        solar = Solar.fromYmdHms(birthInfo.year, birthInfo.month, birthInfo.day, hour, 0, 0);
      }
      
      // lunar-javascript 라이브러리로 정확한 사주 계산
      const lunar = solar.getLunar();
      const eightChar = lunar.getEightChar();
      
      // 사주 계산
      yearPillar = this.getPillarFromGanZhi(eightChar.getYear());
      monthPillar = this.getPillarFromGanZhi(eightChar.getMonth());
      dayPillar = this.getPillarFromGanZhi(eightChar.getDay());
      
      // 시간 정보가 있을 때만 시주 계산
      if (birthInfo.hour !== undefined && birthInfo.hour !== null) {
        hourPillar = this.getPillarFromGanZhi(eightChar.getTime());
      }
    } catch (error) {
      console.error('lunar-javascript 라이브러리 오류:', error);
      throw new Error('사주 계산 중 오류가 발생했습니다. 관리자에게 문의하세요.');
    }

    const chart: SajuChart = {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      ...(hourPillar && { hour: hourPillar }) // 시주가 있을 때만 포함
    };

    // 오행 균형
    const elementBalance = this.calculateElementBalance(chart);

    // 일간 (Day Master)
    const dayMaster = dayPillar.heavenlyStem;
    const dayMasterElement = HEAVENLY_STEMS[dayMaster as keyof typeof HEAVENLY_STEMS].element as Element;

    // 강한/약한 오행
    const sortedElements = Object.entries(elementBalance)
      .sort(([, a], [, b]) => b - a);
    
    const strongElements = sortedElements.slice(0, 2).map(([el]) => el as Element);
    const weakElements = sortedElements.slice(-2).map(([el]) => el as Element);

    // 성격 분석
    const personalityAnalysis = this.analyzePersonality(dayMasterElement, elementBalance);

    // 살(煞) 분석
    const sal = this.analyzeSal(chart);

    return {
      birthInfo,
      chart,
      elementBalance,
      dayMaster,
      dayMasterElement,
      strongElements,
      weakElements,
      ...personalityAnalysis,
      sal
    };
  }
}
