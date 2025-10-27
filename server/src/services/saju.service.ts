import { Solar, Lunar } from 'lunar-javascript';
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
  // 간지 계산 - 년주
  private getYearPillar(year: number): SajuPillar {
    const stemIndex = (year - 4) % 10;
    const branchIndex = (year - 4) % 12;
    
    const stems = Object.keys(HEAVENLY_STEMS);
    const branches = Object.keys(EARTHLY_BRANCHES);
    
    const stem = stems[stemIndex];
    const branch = branches[branchIndex];
    
    return {
      heavenlyStem: stem,
      earthlyBranch: branch,
      element: HEAVENLY_STEMS[stem as keyof typeof HEAVENLY_STEMS].element as Element
    };
  }

  // 간지 계산 - 월주
  private getMonthPillar(year: number, month: number): SajuPillar {
    // 월주 계산은 년간과 월에 따라 결정
    const yearStemIndex = (year - 4) % 10;
    const monthStemIndex = (yearStemIndex * 2 + month) % 10;
    const monthBranchIndex = (month + 1) % 12;
    
    const stems = Object.keys(HEAVENLY_STEMS);
    const branches = Object.keys(EARTHLY_BRANCHES);
    
    const stem = stems[monthStemIndex];
    const branch = branches[monthBranchIndex];
    
    return {
      heavenlyStem: stem,
      earthlyBranch: branch,
      element: HEAVENLY_STEMS[stem as keyof typeof HEAVENLY_STEMS].element as Element
    };
  }

  // 간지 계산 - 일주
  private getDayPillar(year: number, month: number, day: number): SajuPillar {
    // 일주는 절대 일수를 기준으로 60갑자 순환
    const baseDate = new Date(1900, 0, 1);
    const targetDate = new Date(year, month - 1, day);
    const daysDiff = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const stemIndex = (daysDiff + 36) % 10; // 1900년 1월 1일 = 경진
    const branchIndex = (daysDiff + 48) % 12;
    
    const stems = Object.keys(HEAVENLY_STEMS);
    const branches = Object.keys(EARTHLY_BRANCHES);
    
    const stem = stems[stemIndex];
    const branch = branches[branchIndex];
    
    return {
      heavenlyStem: stem,
      earthlyBranch: branch,
      element: HEAVENLY_STEMS[stem as keyof typeof HEAVENLY_STEMS].element as Element
    };
  }

  // 간지 계산 - 시주
  private getHourPillar(dayStems: string, hour: number): SajuPillar {
    const dayStemIndex = Object.keys(HEAVENLY_STEMS).indexOf(dayStems);
    const hourBranchIndex = Math.floor((hour + 1) / 2) % 12;
    const hourStemIndex = (dayStemIndex * 2 + hourBranchIndex) % 10;
    
    const stems = Object.keys(HEAVENLY_STEMS);
    const branches = Object.keys(EARTHLY_BRANCHES);
    
    const stem = stems[hourStemIndex];
    const branch = branches[hourBranchIndex];
    
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
    let year = birthInfo.year;
    let month = birthInfo.month;
    let day = birthInfo.day;

    // 음력을 양력으로 변환
    if (birthInfo.isLunar) {
      // lunar-javascript 라이브러리 사용
      const solarDate = Solar.fromYmd(year, month, day);
      const lunarDate = solarDate.getLunar();
      // 음력 입력을 그대로 사용 (추후 정확한 음력-양력 변환 구현 필요)
      // 현재는 음력 날짜를 양력으로 간주하여 처리
    }

    // 사주 사주 계산
    const yearPillar = this.getYearPillar(year);
    const monthPillar = this.getMonthPillar(year, month);
    const dayPillar = this.getDayPillar(year, month, day);
    const hourPillar = this.getHourPillar(dayPillar.heavenlyStem, birthInfo.hour);

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
