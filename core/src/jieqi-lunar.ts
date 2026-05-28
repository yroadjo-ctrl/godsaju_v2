/**
 * 24절기 — lunar-javascript + KST(+1h), 일운 달력·포스텔러 계열과 동일
 */
import { Solar } from 'lunar-javascript';

/** 24절기 순서 (lunar-javascript 키와 일치) */
export const JIEQI_LIST = [
  '小寒', '大寒', '立春', '雨水', '驚蟄', '春分',
  '清明', '穀雨', '立夏', '小滿', '芒種', '夏至',
  '小暑', '大暑', '立秋', '處暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
] as const;

/** 12節 한글 (짝수 인덱스) */
export const JIEQI_KOR_12 = [
  '소한', '입춘', '경칩', '청명', '입하', '망종',
  '소서', '입추', '백로', '한로', '입동', '대설',
] as const;

/** 24절기 전체 한글 */
export const JIEQI_KOR_24 = [
  '소한', '대한', '입춘', '우수', '경칩', '춘분',
  '청명', '곡우', '입하', '소만', '망종', '하지',
  '소서', '대서', '입추', '처서', '백로', '추분',
  '한로', '상강', '입동', '소설', '대설', '동지',
] as const;

/** 간체 한자 대체 */
export const JIEQI_FALLBACK: Record<number, string> = {
  4: '惊蛰',
  7: '谷雨',
  9: '小满',
  10: '芒种',
  15: '处暑',
};

/** 월지 → 12節 슬롯 (0=丑月 … 11=子月) */
export const BRANCH_TO_MONTH_II: Record<string, number> = {
  '丑': 0, '寅': 1, '卯': 2, '辰': 3, '巳': 4, '午': 5,
  '未': 6, '申': 7, '酉': 8, '戌': 9, '亥': 10, '子': 11,
};

export interface JieQiDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface LunarMonthBoundaryTerms {
  ingiName: number;
  ingiYear: number;
  ingiMonth: number;
  ingiDay: number;
  ingiHour: number;
  ingiMin: number;
  outgiName: number;
  outgiYear: number;
  outgiMonth: number;
  outgiDay: number;
  outgiHour: number;
  outgiMin: number;
}

type SolarTermData = {
  getYear(): number;
  toYmdHms(): string;
};

function solarTermToKstDate(data: SolarTermData): Date {
  const [y, m, d, h, min, s] = data.toYmdHms().split(/[-: ]/).map(Number);
  const date = new Date(y, m - 1, d, h, min, s ?? 0);
  date.setHours(date.getHours() + 1);
  return date;
}

function dateToParts(d: Date): JieQiDateTime {
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
  };
}

function resolveJieSolarData(
  tableYear: number,
  jieIndex: number,
  targetYear: number,
): SolarTermData | null {
  const tbl = Solar.fromYmd(tableYear, 1, 1).getLunar().getJieQiTable();
  let key: string = JIEQI_LIST[jieIndex];
  let solarData: SolarTermData | undefined = tbl[key];

  if (!solarData && JIEQI_FALLBACK[jieIndex]) {
    key = JIEQI_FALLBACK[jieIndex];
    solarData = tbl[key];
  }
  if (!solarData) return null;

  if (solarData.getYear() !== targetYear && tableYear === targetYear) {
    try {
      const nextTbl = Solar.fromYmd(targetYear + 1, 1, 1).getLunar().getJieQiTable();
      const nextData: SolarTermData | undefined =
        nextTbl[key] ?? (JIEQI_FALLBACK[jieIndex] ? nextTbl[JIEQI_FALLBACK[jieIndex]] : undefined);
      if (nextData && nextData.getYear() === targetYear) {
        solarData = nextData;
      }
    } catch {
      // 원본 유지
    }
  }

  if (solarData.getYear() !== targetYear) return null;
  return solarData;
}

/** 양력 targetYear에 해당하는 jieIndex(0–23) 절기 시각 (KST) */
export function lookupJieForYear(targetYear: number, jieIndex: number): Date | null {
  for (const tableYear of [targetYear, targetYear + 1, targetYear - 1]) {
    const data = resolveJieSolarData(tableYear, jieIndex, targetYear);
    if (data) return solarTermToKstDate(data);
  }
  return null;
}

/** 1996년(입춘 후) = 丙子 — HGANJI[12] */
const ANCHOR_SAJU_YEAR = 1996;
const ANCHOR_YEAR_GANJI_INDEX = 12;

function pymod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

function birthDate(year: number, month: number, day: number, hour: number, min: number): Date {
  return new Date(year, month - 1, day, hour, min);
}

function findJieAtOrBefore(birth: Date, jieIndex: number): Date | null {
  const y = birth.getFullYear();
  let best: Date | null = null;
  for (const yr of [y - 1, y, y + 1]) {
    const dt = lookupJieForYear(yr, jieIndex);
    if (dt && dt <= birth && (!best || dt > best)) best = dt;
  }
  return best;
}

function findJieAfter(after: Date, jieIndex: number): Date | null {
  const y = after.getFullYear();
  let best: Date | null = null;
  for (const yr of [y - 1, y, y + 1, y + 2]) {
    const dt = lookupJieForYear(yr, jieIndex);
    if (dt && dt > after && (!best || dt < best)) best = dt;
  }
  return best;
}

function findJieBetween(after: Date, jieIndex: number, before: Date): Date | null {
  let best: Date | null = null;
  const y0 = after.getFullYear();
  for (const yr of [y0 - 1, y0, y0 + 1, y0 + 2]) {
    const dt = lookupJieForYear(yr, jieIndex);
    if (dt && dt > after && dt <= before && (!best || dt < best)) best = dt;
  }
  return best;
}

/**
 * 명리 월 슬롯 (0=丑月 … 11=子月) — 12節 기준
 */
export function getLunarMonthIndex(
  year: number, month: number, day: number, hour: number, min: number,
): number {
  const birth = birthDate(year, month, day, hour, min);
  const terms: { ii: number; dt: Date }[] = [];

  for (const yr of [year - 1, year, year + 1]) {
    for (let ii = 0; ii < 12; ii++) {
      const dt = lookupJieForYear(yr, ii * 2);
      if (dt) terms.push({ ii, dt });
    }
  }

  terms.sort((a, b) => a.dt.getTime() - b.dt.getTime());

  let monthIdx = 11;
  for (const t of terms) {
    if (t.dt <= birth) monthIdx = t.ii;
  }
  return monthIdx;
}

/** ii(0=丑月) → 月支 */
export const MONTH_BRANCH_BY_II = [
  '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子',
] as const;

/** 五虎遁 — 寅月 천간 시작 인덱스 (甲己→丙 …) */
const TIGER_STEM_START = [2, 4, 6, 8, 0];

/** 五虎遁 순서 (寅月=0 … 丑月=11) */
const TIGER_BRANCH_ORDER = [
  '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑',
];

/** 년주 HGANJI 인덱스 + lunar 월지 → 월주 HGANJI 인덱스 */
export function getLunarMonthGanIndex(
  yearGanIndex: number,
  year: number,
  month: number,
  day: number,
  hour: number,
  min: number,
  ganjiTable: readonly string[],
): number {
  const ii = getLunarMonthIndex(year, month, day, hour, min);
  const branch = MONTH_BRANCH_BY_II[ii];
  const yearStemIdx = yearGanIndex % 10;
  const tigerStart = TIGER_STEM_START[yearStemIdx % 5];
  const bidx = TIGER_BRANCH_ORDER.indexOf(branch);
  const monthStemIdx = (tigerStart + bidx) % 10;

  for (let i = 0; i < ganjiTable.length; i++) {
    const gz = ganjiTable[i];
    const stemIdx = '甲乙丙丁戊己庚辛壬癸'.indexOf(gz[0]);
    if (stemIdx === monthStemIdx && gz[1] === branch) return i;
  }
  throw new Error(`Month ganji not found for branch ${branch}`);
}

/** 입춘 기준 사주년 → HGANJI 인덱스 */
export function getLunarYearGanIndex(
  year: number, month: number, day: number, hour: number, min: number,
): number {
  const birth = birthDate(year, month, day, hour, min);
  const calYear = birth.getFullYear();
  const ichun = lookupJieForYear(calYear, 2);
  const sajuYear = ichun && birth < ichun ? calYear - 1 : calYear;
  return pymod(ANCHOR_YEAR_GANJI_INDEX + (sajuYear - ANCHOR_SAJU_YEAR), 60);
}

export interface LunarSolarTerms {
  ingiName: number; ingiYear: number; ingiMonth: number; ingiDay: number; ingiHour: number; ingiMin: number;
  midName: number; midYear: number; midMonth: number; midDay: number; midHour: number; midMin: number;
  outgiName: number; outgiYear: number; outgiMonth: number; outgiDay: number; outgiHour: number; outgiMin: number;
}

/** 입·中·出기 — calcSolarTerms와 동일 필드, lunar 시각 */
export function calcLunarSolarTerms(
  year: number, month: number, day: number, hour: number, min: number,
): LunarSolarTerms {
  const monthIdx = getLunarMonthIndex(year, month, day, hour, min);
  const ingiName = monthIdx * 2;
  const midName = monthIdx * 2 + 1;
  /** 子月(11) 다음 절출은 小寒(0) — 24절기 순환 */
  const outgiName = (monthIdx * 2 + 2) % 24;

  const birth = birthDate(year, month, day, hour, min);
  const ingi = findJieAtOrBefore(birth, ingiName);
  if (!ingi) throw new Error(`Cannot find ingi jie ${jieIndexLabel(ingiName)}`);

  const outgi = findJieAfter(ingi, outgiName);
  if (!outgi) throw new Error(`Cannot find outgi jie ${jieIndexLabel(outgiName)}`);

  const mid = findJieBetween(ingi, midName, outgi);
  if (!mid) throw new Error(`Cannot find mid jie ${jieIndexLabel(midName)}`);

  const ingiP = dateToParts(ingi);
  const midP = dateToParts(mid);
  const outgiP = dateToParts(outgi);

  return {
    ingiName,
    ingiYear: ingiP.year, ingiMonth: ingiP.month, ingiDay: ingiP.day,
    ingiHour: ingiP.hour, ingiMin: ingiP.minute,
    midName,
    midYear: midP.year, midMonth: midP.month, midDay: midP.day,
    midHour: midP.hour, midMin: midP.minute,
    outgiName,
    outgiYear: outgiP.year, outgiMonth: outgiP.month, outgiDay: outgiP.day,
    outgiHour: outgiP.hour, outgiMin: outgiP.minute,
  };
}

/** 월지 기준 절입·절출 — calcMonthBoundaryTerms와 동일 필드, lunar 시각 */
export function calcLunarMonthBoundaryTerms(
  year: number,
  month: number,
  day: number,
  hour: number,
  min: number,
  monthBranch: string,
): LunarMonthBoundaryTerms {
  const ii = BRANCH_TO_MONTH_II[monthBranch];
  if (ii === undefined) {
    throw new Error(`Unknown month branch: ${monthBranch}`);
  }

  const birth = new Date(year, month - 1, day, hour, min);
  const ingiName = ii * 2;
  const outgiName = (ii * 2 + 2) % 24;

  let ingi: Date | null = null;
  for (const y of [year - 1, year, year + 1]) {
    const dt = lookupJieForYear(y, ingiName);
    if (dt && dt <= birth && (!ingi || dt > ingi)) {
      ingi = dt;
    }
  }
  if (!ingi) {
    throw new Error(`Cannot find ingi jie ${jieIndexLabel(ingiName)} for ${monthBranch}月`);
  }

  let outgi: Date | null = null;
  for (const y of [year - 1, year, year + 1, year + 2]) {
    const dt = lookupJieForYear(y, outgiName);
    if (dt && dt > ingi && (!outgi || dt < outgi)) {
      outgi = dt;
    }
  }
  if (!outgi) {
    throw new Error(`Cannot find outgi jie ${jieIndexLabel(outgiName)} after ingi`);
  }

  const ingiP = dateToParts(ingi);
  const outgiP = dateToParts(outgi);

  return {
    ingiName,
    ingiYear: ingiP.year,
    ingiMonth: ingiP.month,
    ingiDay: ingiP.day,
    ingiHour: ingiP.hour,
    ingiMin: ingiP.minute,
    outgiName,
    outgiYear: outgiP.year,
    outgiMonth: outgiP.month,
    outgiDay: outgiP.day,
    outgiHour: outgiP.hour,
    outgiMin: outgiP.minute,
  };
}

function jieIndexLabel(jieIndex: number): string {
  return JIEQI_LIST[jieIndex] ?? String(jieIndex);
}

/** 24절기 한글·한자 (jieIndex 0–23) */
export function jieqiKorHanja(jieIndex: number): { kor: string; hanja: string } {
  const hanja = JIEQI_LIST[jieIndex] ?? JIEQI_FALLBACK[jieIndex] ?? '?';
  const kor = JIEQI_KOR_24[jieIndex] ?? '?';
  return { kor, hanja };
}

/** 대운수 절기 라벨 — 예: 백로(白露) 절출 1982-09-08 08:31 */
export function formatDaewoonTermLabel(
  jieIndex: number,
  kind: 'ingi' | 'outgi',
  termDate: Date,
): string {
  const { kor, hanja } = jieqiKorHanja(jieIndex);
  const suffix = kind === 'ingi' ? '절입' : '절출';
  const y = termDate.getFullYear();
  const m = String(termDate.getMonth() + 1).padStart(2, '0');
  const day = String(termDate.getDate()).padStart(2, '0');
  const h = String(termDate.getHours()).padStart(2, '0');
  const min = String(termDate.getMinutes()).padStart(2, '0');
  return `${kor}(${hanja}) ${suffix} ${y}-${m}-${day} ${h}:${min}`;
}

/** 일운 달력용 — 해당 연도 24절기를 월·일 키로 */
export function buildJieQiCalendarMap(
  year: number,
): Record<number, Record<number, { name: string; time: string }>> {
  const result: Record<number, Record<number, { name: string; time: string }>> = {};

  JIEQI_KOR_24.forEach((name, index) => {
    const dt = lookupJieForYear(year, index);
    if (!dt) return;

    const korMonth = dt.getMonth() + 1;
    const korDay = dt.getDate();
    const korHour = String(dt.getHours()).padStart(2, '0');
    const korMin = String(dt.getMinutes()).padStart(2, '0');

    if (!result[korMonth]) result[korMonth] = {};
    result[korMonth][korDay] = { name, time: `${korHour}:${korMin}` };
  });

  return result;
}

/** text-export 일운 구간용 — 날짜 키(YYYY-M-D) → 절기 */
export function buildJieQiDateKeyMap(
  years: number[],
): Record<string, { name: string; time: string }> {
  const map: Record<string, { name: string; time: string }> = {};
  const uniqueYears = Array.from(new Set(years));

  for (const yr of uniqueYears) {
    JIEQI_LIST.forEach((_, idx) => {
      const dt = lookupJieForYear(yr, idx);
      if (!dt) return;
      const key = `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`;
      map[key] = {
        name: JIEQI_KOR_24[idx],
        time: `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
      };
    });
  }

  return map;
}

export interface MonthlyJieQiEntry {
  jieIndex: number;
  /** 12節(節入) — 월령 전환 */
  isJieRu: boolean;
  kor: string;
  hanja: string;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** 양력 month(1–12)에 들어오는 24절기 목록 (KST, 일운 달력과 동일) */
export function getMonthlyJieQiEntries(year: number, month: number): MonthlyJieQiEntry[] {
  const entries: MonthlyJieQiEntry[] = [];

  JIEQI_LIST.forEach((hanja, idx) => {
    const dt = lookupJieForYear(year, idx);
    if (!dt || dt.getFullYear() !== year || dt.getMonth() + 1 !== month) return;
    entries.push({
      jieIndex: idx,
      isJieRu: idx % 2 === 0,
      kor: JIEQI_KOR_24[idx],
      hanja,
      month,
      day: dt.getDate(),
      hour: dt.getHours(),
      minute: dt.getMinutes(),
    });
  });

  entries.sort((a, b) => a.day - b.day || a.hour - b.hour || a.minute - b.minute);
  return entries;
}

/** 월운표 절기 셀 — 한 달에 2개면 lineBreak로 구분 */
export function formatMonthlyJieQiCell(
  year: number,
  month: number,
  lineBreak = '\n',
): string {
  const entries = getMonthlyJieQiEntries(year, month);
  if (entries.length === 0) return '-';

  return entries.map((e) => {
    const time = `${String(e.hour).padStart(2, '0')}:${String(e.minute).padStart(2, '0')}`;
    const prefix = e.isJieRu ? '◆' : '·';
    return `${prefix}${e.kor}(${e.hanja})${lineBreak}${e.month}/${e.day} ${time}`;
  }).join(lineBreak);
}

/** 입춘(立春) — 세운·소운 연도 칸 경계 */
export function formatLichunBoundaryCell(calYear: number, lineBreak = '\n'): string {
  const dt = lookupJieForYear(calYear, 2);
  if (!dt) return '-';
  const h = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return `◆입춘(立春)${lineBreak}${dt.getMonth() + 1}/${dt.getDate()} ${h}:${min}`;
}

/** 대운 칸 시작 시각 */
export function formatDaewoonStartCell(startDate: Date, lineBreak = '\n'): string {
  const h = String(startDate.getHours()).padStart(2, '0');
  const min = String(startDate.getMinutes()).padStart(2, '0');
  return `◆시작${lineBreak}${startDate.getMonth() + 1}/${startDate.getDate()} ${h}:${min}`;
}
