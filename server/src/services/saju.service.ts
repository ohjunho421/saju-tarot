const { Solar, Lunar } = require('lunar-javascript');
import {
  BirthInfo,
  SajuChart,
  SajuPillar,
  Element,
  ElementBalance,
  SajuAnalysis,
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

  // 메인 사주 분석 함수
  public analyzeSaju(birthInfo: BirthInfo): SajuAnalysis {
    let yearPillar: SajuPillar;
    let monthPillar: SajuPillar;
    let dayPillar: SajuPillar;
    let hourPillar: SajuPillar;
    
    try {
      let solar: any;
      
      if (birthInfo.isLunar) {
        // 음력을 양력으로 변환
        const lunar: any = Lunar.fromYmd(birthInfo.year, birthInfo.month, birthInfo.day);
        solar = lunar.getSolar();
      } else {
        // 양력 그대로 사용
        solar = Solar.fromYmdHms(birthInfo.year, birthInfo.month, birthInfo.day, birthInfo.hour, 0, 0);
      }
      
      // lunar-javascript 라이브러리로 정확한 사주 계산
      const lunar = solar.getLunar();
      const eightChar = lunar.getEightChar();
      
      // 사주 사주 계산
      yearPillar = this.getPillarFromGanZhi(eightChar.getYear());
      monthPillar = this.getPillarFromGanZhi(eightChar.getMonth());
      dayPillar = this.getPillarFromGanZhi(eightChar.getDay());
      hourPillar = this.getPillarFromGanZhi(eightChar.getTime());
    } catch (error) {
      console.error('lunar-javascript 라이브러리 오류:', error);
      throw new Error('사주 계산 중 오류가 발생했습니다. 관리자에게 문의하세요.');
    }

    const chart: SajuChart = {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar
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

    return {
      birthInfo,
      chart,
      elementBalance,
      dayMaster,
      dayMasterElement,
      strongElements,
      weakElements,
      ...personalityAnalysis
    };
  }
}
