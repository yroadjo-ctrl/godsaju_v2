declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromYmdHms(
      year: number, month: number, day: number,
      hour: number, minute: number, second: number,
    ): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getSecond(): number;
    toYmd(): string;
    toYmdHms(): string;
    getLunar(): Lunar;
  }

  export class LunarYear {
    static fromYear(year: number): LunarYear;
    getLeapMonth(): number;
  }

  export class Lunar {
    static fromYmd(
      year: number, month: number, day: number,
      hour?: number, minute?: number, second?: number,
    ): Lunar;
    static fromYmdHms(
      year: number, month: number, day: number,
      hour: number, minute: number, second: number,
    ): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getSecond(): number;
    getSolar(): Solar;
    getJieQiTable(): Record<string, Solar>;
  }
}
