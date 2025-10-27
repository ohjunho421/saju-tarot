declare module 'lunar-javascript' {
  export class Solar {
    static fromDate(date: Date): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getLunar(): Lunar;
  }

  export class Lunar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    isLeap(): boolean;
    getPrevJieQi(): JieQi | null;
    getNextJieQi(): JieQi | null;
  }

  export class JieQi {
    getName(): string;
  }
}
