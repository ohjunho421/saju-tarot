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
