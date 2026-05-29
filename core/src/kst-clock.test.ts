import { describe, expect, it } from 'vitest';
import { Solar } from 'lunar-javascript';
import { getEffectiveCalendarYearForLichun } from './yun-transit.ts';
import { getEffectiveYunCalendarYearMonth } from '../../client/src/utils/yun-period';
import {
  instantToKstParts,
  kstWallClockToDate,
  kstWallClockToInstant,
} from './kst-clock.ts';
import { lookupJieForYear } from './jieqi-lunar.ts';

const JIEQI_LIST = [
  '小寒', '大寒', '立春', '雨水', '驚蟄', '春分',
  '清明', '穀雨', '立夏', '小滿', '芒種', '夏至',
  '小暑', '大暑', '立秋', '處暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
] as const;

/** 수정 전: lunar +1h, 로컬 TZ Date (한국 PC 동작) */
function legacySolarTermToKstDate(ymdHms: string): Date {
  const [y, m, d, h, min, s] = ymdHms.split(/[-: ]/).map(Number);
  const date = new Date(y, m - 1, d, h, min, s ?? 0);
  date.setHours(date.getHours() + 1);
  return date;
}

const JIEQI_FALLBACK: Record<number, string> = {
  4: '惊蛰',
  7: '谷雨',
  9: '小满',
  10: '芒种',
  15: '处暑',
};

function legacyLookupJieForYear(targetYear: number, jieIndex: number): Date | null {
  for (const tableYear of [targetYear, targetYear + 1, targetYear - 1]) {
    const tbl = Solar.fromYmd(tableYear, 1, 1).getLunar().getJieQiTable();
    let key: string = JIEQI_LIST[jieIndex];
    let data = tbl[key];
    if (!data && JIEQI_FALLBACK[jieIndex]) {
      key = JIEQI_FALLBACK[jieIndex];
      data = tbl[key];
    }
    if (data && data.getYear() === targetYear) {
      return legacySolarTermToKstDate(data.toYmdHms());
    }
  }
  return null;
}

function legacyEffectiveCalendarYearForLichun(now: Date): number {
  const calYear = now.getFullYear();
  const lichun = legacyLookupJieForYear(calYear, 2);
  if (lichun && now < lichun) return calYear - 1;
  return calYear;
}

const isSeoulTz = () => !process.env.TZ || process.env.TZ === 'Asia/Seoul';

describe('kst-clock — Asia/Seoul에서 기존 로직과 동일', () => {
  it.skipIf(!isSeoulTz())('입춘·節入 시각(ms)이 legacy(로컬 Date)와 일치', () => {
    for (const year of [2024, 2025, 2026, 2027]) {
      for (let jieIndex = 0; jieIndex < 24; jieIndex++) {
        const legacy = legacyLookupJieForYear(year, jieIndex);
        const current = lookupJieForYear(year, jieIndex);
        if (!legacy && !current) continue;
        if (!legacy || !current) continue;
        expect(current.getTime()).toBe(legacy.getTime());
      }
    }
  });

  it.skipIf(!isSeoulTz())('getEffectiveCalendarYearForLichun — 여러 시각 샘플', () => {
    const samples = [
      new Date('2026-01-15T12:00:00+09:00'),
      new Date('2026-02-03T20:00:00+09:00'),
      new Date('2026-02-04T06:00:00+09:00'),
      new Date('2026-02-04T12:00:00+09:00'),
      new Date('2025-12-31T23:30:00+09:00'),
      new Date('2024-02-04T05:00:00+09:00'),
    ];
    for (const now of samples) {
      expect(getEffectiveCalendarYearForLichun(now)).toBe(
        legacyEffectiveCalendarYearForLichun(now),
      );
    }
  });

  it.skipIf(!isSeoulTz())('getEffectiveYunCalendarYearMonth — 입춘·節입 전후(로컬 now 기준 legacy와 동일)', () => {
    const samples = [
      new Date('2026-01-20T08:00:00+09:00'),
      new Date('2026-02-04T04:00:00+09:00'),
      new Date('2026-02-04T12:00:00+09:00'),
      new Date('2026-07-07T15:00:00+09:00'),
    ];
    for (const now of samples) {
      const legacyYear = legacyEffectiveCalendarYearForLichun(now);
      const legacyMonth = (() => {
        const calYear = now.getFullYear();
        const calMonth = now.getMonth() + 1;
        const entries = JIEQI_LIST.map((_, idx) => {
          const dt = legacyLookupJieForYear(calYear, idx);
          if (!dt || dt.getFullYear() !== calYear || dt.getMonth() + 1 !== calMonth) return null;
          return { isJieRu: idx % 2 === 0, dt };
        }).filter(Boolean) as { isJieRu: boolean; dt: Date }[];
        const first = entries.find((e) => e.isJieRu);
        if (!first) return { year: calYear, month: calMonth };
        if (now.getTime() >= first.dt.getTime()) return { year: calYear, month: calMonth };
        if (calMonth <= 1) return { year: calYear - 1, month: 12 };
        return { year: calYear, month: calMonth - 1 };
      })();
      expect(getEffectiveYunCalendarYearMonth(now)).toEqual(legacyMonth);
      expect(getEffectiveCalendarYearForLichun(now)).toBe(legacyYear);
    }
  });

  it.skipIf(!isSeoulTz())('KST 벽시계 왕복 — 서울 시각 1987-09-01 07:00', () => {
    const parts = { year: 1987, month: 9, day: 1, hour: 7, minute: 0 };
    const back = instantToKstParts(kstWallClockToDate(parts));
    expect(back.year).toBe(1987);
    expect(back.month).toBe(9);
    expect(back.day).toBe(1);
    expect(back.hour).toBe(7);
    expect(back.minute).toBe(0);
  });
});

describe('kst-clock — 해외 TZ에서도 한국 기준', () => {
  it('동일 UTC 순간 → KST 입춘 전 연도(2025)', () => {
    const instant = kstWallClockToInstant({
      year: 2026,
      month: 2,
      day: 4,
      hour: 4,
      minute: 0,
    });
    const asUtc = new Date(instant);
    expect(getEffectiveCalendarYearForLichun(asUtc)).toBe(2025);
    const parts = instantToKstParts(instant);
    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(2);
    expect(parts.day).toBe(4);
    expect(parts.hour).toBe(4);
  });

  it.skipIf(isSeoulTz())('미동부 TZ: 양력 연도가 KST와 다를 때도 입춘 판정은 KST 기준', () => {
    const instant = kstWallClockToInstant({
      year: 2026,
      month: 1,
      day: 1,
      hour: 8,
      minute: 0,
    });
    const now = new Date(instant);
    expect(instantToKstParts(now).year).toBe(2026);
    expect(now.getFullYear()).toBe(2025);
    expect(getEffectiveCalendarYearForLichun(now)).toBe(2025);
  });
});
