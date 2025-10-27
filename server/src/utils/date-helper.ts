import { Solar, Lunar } from 'lunar-javascript';

export interface DateContext {
  solarDate: string;
  lunarDate: string;
  year: number;
  month: number;
  day: number;
  weekday: string;
  season: string;
  jieqi: string; // 절기
  zodiacSign: string; // 별자리
}

export class DateHelper {
  // 현재 날짜 컨텍스트 생성
  static getCurrentDateContext(): DateContext {
    const now = new Date();
    const solar = Solar.fromDate(now);
    const lunar = solar.getLunar();

    // lunar 객체가 제대로 생성되었는지 확인
    let lunarDateStr = '음력 정보 없음';
    let jieqiName = '정보없음';
    
    try {
      const isLeap = typeof lunar.isLeap === 'function' ? lunar.isLeap() : false;
      lunarDateStr = `음력 ${lunar.getYear()}년 ${lunar.getMonth()}월${isLeap ? '(윤)' : ''} ${lunar.getDay()}일`;
      
      const prevJieQi = lunar.getPrevJieQi();
      if (prevJieQi && typeof prevJieQi.getName === 'function') {
        jieqiName = prevJieQi.getName();
      }
    } catch (error) {
      console.error('음력 정보 생성 오류:', error);
    }

    return {
      solarDate: `${solar.getYear()}년 ${solar.getMonth()}월 ${solar.getDay()}일`,
      lunarDate: lunarDateStr,
      year: solar.getYear(),
      month: solar.getMonth(),
      day: solar.getDay(),
      weekday: this.getWeekdayKorean(now.getDay()),
      season: this.getSeason(solar.getMonth()),
      jieqi: jieqiName,
      zodiacSign: this.getZodiacSign(solar.getMonth(), solar.getDay())
    };
  }

  // 요일을 한국어로
  private static getWeekdayKorean(day: number): string {
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return weekdays[day];
  }

  // 계절 판단
  private static getSeason(month: number): string {
    if (month >= 3 && month <= 5) return '봄';
    if (month >= 6 && month <= 8) return '여름';
    if (month >= 9 && month <= 11) return '가을';
    return '겨울';
  }

  // 별자리 판단
  private static getZodiacSign(month: number, day: number): string {
    const signs = [
      { name: '염소자리', start: [12, 22], end: [1, 19] },
      { name: '물병자리', start: [1, 20], end: [2, 18] },
      { name: '물고기자리', start: [2, 19], end: [3, 20] },
      { name: '양자리', start: [3, 21], end: [4, 19] },
      { name: '황소자리', start: [4, 20], end: [5, 20] },
      { name: '쌍둥이자리', start: [5, 21], end: [6, 21] },
      { name: '게자리', start: [6, 22], end: [7, 22] },
      { name: '사자자리', start: [7, 23], end: [8, 22] },
      { name: '처녀자리', start: [8, 23], end: [9, 22] },
      { name: '천칭자리', start: [9, 23], end: [10, 22] },
      { name: '전갈자리', start: [10, 23], end: [11, 22] },
      { name: '사수자리', start: [11, 23], end: [12, 21] }
    ];

    for (const sign of signs) {
      const [startMonth, startDay] = sign.start;
      const [endMonth, endDay] = sign.end;

      if (startMonth === endMonth) {
        if (month === startMonth && day >= startDay && day <= endDay) {
          return sign.name;
        }
      } else {
        if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
          return sign.name;
        }
      }
    }

    return '염소자리';
  }

  // 시기 설명 생성
  static getTimingDescription(dateContext: DateContext): string {
    const descriptions: string[] = [];
    
    descriptions.push(`현재는 ${dateContext.season}철입니다.`);
    descriptions.push(`오늘은 ${dateContext.weekday}이고, ${dateContext.solarDate}입니다.`);
    descriptions.push(`음력으로는 ${dateContext.lunarDate}입니다.`);
    descriptions.push(`24절기상 ${dateContext.jieqi} 시기입니다.`);
    descriptions.push(`별자리는 ${dateContext.zodiacSign} 구간입니다.`);

    return descriptions.join(' ');
  }

  // 계절별 오행 기운
  static getSeasonalElement(season: string): string {
    switch (season) {
      case '봄': return '목(木) 기운이 왕성한 시기';
      case '여름': return '화(火) 기운이 왕성한 시기';
      case '가을': return '금(金) 기운이 왕성한 시기';
      case '겨울': return '수(水) 기운이 왕성한 시기';
      default: return '';
    }
  }
}
