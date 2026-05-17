# 사주팔자 엔진 전체 코드 분석

## 1. 간지 추출 로직 (calcPillarIndices)

### 위치: core/src/pillars.ts (라인 244-338)

```typescript
/**
 * 그레고리력 → 60갑자 인덱스 [연주, 월주, 일주, 시주]
 *
 * @returns [so24(60년 배수), so24year, so24month, so24day, so24hour]
 */
export function calcPillarIndices(
  year: number, month: number, day: number, hour: number, min: number,
  jasiMethod?: JasiMethod,
): [number, number, number, number, number] {
  const displ2min = minutesBetween(
    UNIT.year, UNIT.month, UNIT.day, UNIT.hour, UNIT.min,
    year, month, day, hour, min,
  );
  const displ2day = daysBetween(
    UNIT.year, UNIT.month, UNIT.day, year, month, day,
  );

  // 경과 연수
  let so24 = div(displ2min, 525949);
  if (displ2min >= 0) so24 += 1;

  // 년주
  let so24year = (so24 % 60) * -1 + 12;
  if (so24year < 0) so24year += 60;
  else if (so24year > 59) so24year -= 60;

  // 월주
  let monthmin100 = displ2min % 525949;
  monthmin100 = 525949 - monthmin100;
  if (monthmin100 < 0) monthmin100 += 525949;
  else if (monthmin100 >= 525949) monthmin100 -= 525949;

  let so24monthIdx = 0;
  for (let i = 0; i < 12; i++) {
    const j = i * 2;
    if (MONTH[j] <= monthmin100 && monthmin100 < MONTH[j + 2]) {
      so24monthIdx = i;
    }
  }

  let t = so24year % 10;
  t = t % 5;
  t = t * 12 + 2 + so24monthIdx;
  let so24month = t;
  if (so24month > 59) so24month -= 60;

  // 일주
  let so24day = displ2day % 60;
  so24day = so24day * -1 + 7;
  if (so24day < 0) so24day += 60;
  else if (so24day > 59) so24day -= 60;

  // 시주 (반시 체계: 30분 경계, 동경 127.5도 보정)
  let i: number;
  if (hour === 0 || (hour === 1 && min < 30)) {
    i = 0; // 子 (조자시: 00:00~01:29)
  } else if ((hour === 1 && min >= 30) || hour === 2 || (hour === 3 && min < 30)) {
    i = 1; // 丑
  } else if ((hour === 3 && min >= 30) || hour === 4 || (hour === 5 && min < 30)) {
    i = 2; // 寅
  } else if ((hour === 5 && min >= 30) || hour === 6 || (hour === 7 && min < 30)) {
    i = 3; // 卯
  } else if ((hour === 7 && min >= 30) || hour === 8 || (hour === 9 && min < 30)) {
    i = 4; // 辰
  } else if ((hour === 9 && min >= 30) || hour === 10 || (hour === 11 && min < 30)) {
    i = 5; // 巳
  } else if ((hour === 11 && min >= 30) || hour === 12 || (hour === 13 && min < 30)) {
    i = 6; // 午
  } else if ((hour === 13 && min >= 30) || hour === 14 || (hour === 15 && min < 30)) {
    i = 7; // 未
  } else if ((hour === 15 && min >= 30) || hour === 16 || (hour === 17 && min < 30)) {
    i = 8; // 申
  } else if ((hour === 17 && min >= 30) || hour === 18 || (hour === 19 && min < 30)) {
    i = 9; // 酉
  } else if ((hour === 19 && min >= 30) || hour === 20 || (hour === 21 && min < 30)) {
    i = 10; // 戌
  } else if ((hour === 21 && min >= 30) || hour === 22 || (hour === 23 && min < 30)) {
    i = 11; // 亥
  } else {
    // 야자시: hour === 23 && min >= 30
    i = 0; // 子
    const method = jasiMethod ?? 'unified';
    if (method === 'unified') {
      // 통자시: 23:30부터 일주를 다음날로 넘김
      so24day += 1;
      if (so24day === 60) so24day = 0;
    }
    // 'split' (야자시 인정): 일주 당일 유지, 시주 천간은 당일 일간 기준
  }

  // 야자시(split): 일주는 당일 유지하되, 시주 천간은 다음날 일간 기준
  const isYajasi = i === 0 && hour === 23 && jasiMethod === 'split';
  const dayForHour = isYajasi ? (so24day + 1) % 60 : so24day;
  t = dayForHour % 10;
  t = t % 5;
  t = t * 12 + i;
  const so24hour = t;

  return [so24, so24year, so24month, so24day, so24hour];
}
```

### 핵심 로직:
1. **기준점**: UNIT (1996-02-04 22:08) - UTC 기준
2. **경과 분 계산**: minutesBetween()
3. **경과 일 계산**: daysBetween()
4. **연주**: 60년 주기 계산
5. **월주**: MONTH 배열 사용 (절기 기준)
6. **일주**: 경과 일 수 기반
7. **시주**: 시간/분 기반 (반시 체계)

---

## 2. 절기 시간 계산 로직 (calcSolarTerms)

### 위치: core/src/pillars.ts (라인 347-394)

```typescript
/**
 * 절기 시간 구하기 - 입기, 중기, 출기 날짜/시각
 */
export function calcSolarTerms(
  year: number, month: number, day: number, hour: number, min: number,
): {
  ingiName: number; ingiYear: number; ingiMonth: number; ingiDay: number; ingiHour: number; ingiMin: number;
  midName: number; midYear: number; midMonth: number; midDay: number; midHour: number; midMin: number;
  outgiName: number; outgiYear: number; outgiMonth: number; outgiDay: number; outgiHour: number; outgiMin: number;
} {
  const [, , so24month] = calcPillarIndices(year, month, day, hour, min);

  const displ2min = minutesBetween(
    UNIT.year, UNIT.month, UNIT.day, UNIT.hour, UNIT.min,
    year, month, day, hour, min,
  );

  let monthmin100 = (displ2min % 525949) * -1;
  if (monthmin100 < 0) monthmin100 += 525949;
  else if (monthmin100 >= 525949) monthmin100 -= 525949;

  let ii = so24month % 12 - 2;
  if (ii === -2) ii = 10;
  else if (ii === -1) ii = 11;

  const ingiName = ii * 2;
  const midName = ii * 2 + 1;
  const outgiName = ii * 2 + 2;

  const j = ii * 2;
  let tmin = displ2min + (monthmin100 - MONTH[j]);
  const [ingiYear, ingiMonth, ingiDay, ingiHour, ingiMin] = dateFromMinutes(
    tmin, UNIT.year, UNIT.month, UNIT.day, UNIT.hour, UNIT.min,
  );

  tmin = displ2min + (monthmin100 - MONTH[j + 1]);
  const [midYear, midMonth, midDay, midHour, midMin] = dateFromMinutes(
    tmin, UNIT.year, UNIT.month, UNIT.day, UNIT.hour, UNIT.min,
  );

  tmin = displ2min + (monthmin100 - MONTH[j + 2]);
  const [outgiYear, outgiMonth, outgiDay, outgiHour, outgiMin] = dateFromMinutes(
    tmin, UNIT.year, UNIT.month, UNIT.day, UNIT.hour, UNIT.min,
  );

  return {
    ingiName, ingiYear, ingiMonth, ingiDay, ingiHour, ingiMin,
    midName, midYear, midMonth, midDay, midHour, midMin,
    outgiName, outgiYear, outgiMonth, outgiDay, outgiHour, outgiMin,
  };
}
```

### 핵심 로직:
1. **기준점**: UNIT (1996-02-04 22:08) - **UTC 기준**
2. **경과 분 계산**: minutesBetween()
3. **절기 인덱스**: so24month 기반
4. **MONTH 배열**: 절기별 기준점으로부터의 분 차이
5. **dateFromMinutes()**: 분으로부터 날짜 역산

---

## 3. 기준점 상수 (UNIT)

### 위치: core/src/pillars.ts (라인 53-63)

```typescript
const UNIT = {
  year: 1996, month: 2, day: 4, hour: 22, min: 8,
  // 세차
  ygan: 2, yji: 0,
  // 월건
  mgan: 6, mji: 2, msu: 26,
  // 일진
  dgan: 7, dji: 7, dsu: 7,
  // 시주
  hgan: 5, hji: 11, hsu: 35,
};
```

**⚠️ 중요**: 1996-02-04 22:08은 **UTC 기준**입니다.
- 한국 시간(KST)으로는 1996-02-05 07:08입니다.

---

## 4. 절기 상수 (MONTH 배열)

### 위치: core/src/pillars.ts (라인 42-47)

```typescript
const MONTH = [
  0, 21355, 42843, 64498, 86335, 108366, 130578, 152958,
  175471, 198077, 220728, 243370, 265955, 288432, 310767,
  332928, 354903, 376685, 398290, 419736, 441060, 462295,
  483493, 504693, 525949,
];
```

**의미**:
- 기준점(1996-02-04 22:08 UTC)으로부터 각 절기까지의 분 차이
- 인덱스: 0=입춘, 1=우수, ..., 23=대한
- 525949분 = 약 365.2422일 (태양년)

**절기 매핑**:
```
0: 입춘 (立春)       1: 우수 (雨水)
2: 경칩 (驚蟄)       3: 춘분 (春分)
4: 청명 (清明)       5: 곡우 (穀雨)
6: 입하 (立夏)       7: 소만 (小滿)
8: 망종 (芒種)       9: 하지 (夏至)
10: 소서 (小暑)      11: 대서 (大暑)
12: 입추 (立秋)      13: 처서 (處暑)
14: 백로 (白露)      15: 추분 (秋分)
16: 한로 (寒露)      17: 상강 (霜降)
18: 입동 (立冬)      19: 소설 (小雪)
20: 대설 (大雪)      21: 동지 (冬至)
22: 소한 (小寒)      23: 대한 (大寒)
```

---

## 5. 날짜 연산 함수

### 5.1 minutesBetween() - 두 시점 사이의 분 계산

### 위치: core/src/pillars.ts (라인 146-152)

```typescript
/** 두 시점 사이의 분(minutes) 계산 */
function minutesBetween(
  uy: number, umm: number, ud: number, uh: number, umin: number,
  y1: number, mo1: number, d1: number, h1: number, mm1: number,
): number {
  const dispday = daysBetween(uy, umm, ud, y1, mo1, d1);
  return dispday * 24 * 60 + (uh - h1) * 60 + (umin - mm1);
}
```

**동작**:
- 기준점(UNIT)에서 입력 시점까지의 분 차이 계산
- **현재 구현: UTC 기준 (타임존 미보정)**

---

### 5.2 dateFromMinutes() - 분으로부터 날짜 역산

### 위치: core/src/pillars.ts (라인 155-233)

```typescript
/** 분(tmin)으로부터 날짜 역산 */
function dateFromMinutes(
  tmin: number, uyear: number, umonth: number, uday: number,
  uhour: number, umin: number,
): [number, number, number, number, number] {
  let y1: number, mo1: number, d1: number, h1: number, mi1: number;
  let t: number;

  y1 = uyear - div(tmin, 525949);

  if (tmin > 0) {
    y1 += 2;
    while (true) {
      y1 -= 1;
      t = minutesBetween(uyear, umonth, uday, uhour, umin, y1, 1, 1, 0, 0);
      if (t >= tmin) break;
    }

    mo1 = 13;
    while (true) {
      mo1 -= 1;
      t = minutesBetween(uyear, umonth, uday, uhour, umin, y1, mo1, 1, 0, 0);
      if (t >= tmin) break;
    }

    d1 = 32;
    while (true) {
      d1 -= 1;
      t = minutesBetween(uyear, umonth, uday, uhour, umin, y1, mo1, d1, 0, 0);
      if (t >= tmin) break;
    }

    h1 = 24;
    while (true) {
      h1 -= 1;
      t = minutesBetween(uyear, umonth, uday, uhour, umin, y1, mo1, d1, h1, 0);
      if (t >= tmin) break;
    }

    t = minutesBetween(uyear, umonth, uday, uhour, umin, y1, mo1, d1, h1, 0);
    mi1 = t - tmin;
  } else {
    y1 -= 2;
    while (true) {
      y1 += 1;
      t = minutesBetween(uyear, umonth, uday, uhour, umin, y1, 1, 1, 0, 0);
      if (t < tmin) break;
    }

    y1 -= 1;
    mo1 = 0;
    while (true) {
      mo1 += 1;
      t = minutesBetween(uyear, umonth, uday, uhour, umin, y1, mo1, 1, 0, 0);
      if (t < tmin) break;
    }

    mo1 -= 1;
    d1 = 0;
    while (true) {
      d1 += 1;
      t = minutesBetween(uyear, umonth, uday, uhour, umin, y1, mo1, d1, 0, 0);
      if (t < tmin) break;
    }

    d1 -= 1;
    h1 = -1;
    while (true) {
      h1 += 1;
      t = minutesBetween(uyear, umonth, uday, uhour, umin, y1, mo1, d1, h1, 0);
      if (t < tmin) break;
    }

    h1 -= 1;
    t = minutesBetween(uyear, umonth, uday, uhour, umin, y1, mo1, d1, h1, 0);
    mi1 = t - tmin;
  }

  return [y1, mo1, d1, h1, mi1];
}
```

**동작**:
- 이진 탐색으로 분(tmin)에 해당하는 년/월/일/시/분 계산
- 반환: [year, month, day, hour, minute]

---

### 5.3 daysBetween() - 두 날짜 사이의 일수

### 위치: core/src/pillars.ts (라인 90-143)

```typescript
/** 두 날짜 사이의 일수 (y1m1d1 → y2m2d2 방향) */
function daysBetween(
  y1: number, m1: number, d1: number,
  y2: number, m2: number, d2: number,
): number {
  let p1: number, p1n: number, p2: number;
  let pp1: number, pp2: number, pr: number;

  if (y2 > y1) {
    p1 = dayOfYear(y1, m1, d1);
    p1n = dayOfYear(y1, 12, 31);
    p2 = dayOfYear(y2, m2, d2);
    pp1 = y1; pp2 = y2; pr = -1;
  } else {
    p1 = dayOfYear(y2, m2, d2);
    p1n = dayOfYear(y2, 12, 31);
    p2 = dayOfYear(y1, m1, d1);
    pp1 = y2; pp2 = y1; pr = 1;
  }

  let dis: number;
  if (y2 === y1) {
    dis = p2 - p1;
  } else {
    dis = p1n - p1;
    let k = pp1 + 1;
    const ppp2 = pp2 - 1;

    while (k <= ppp2) {
      // 빠른 건너뛰기 (ppp2 > 1990일 때)
      if (k === -2000 && ppp2 > 1990) { dis += 1457682; k = 1991; }
      else if (k === -1750 && ppp2 > 1990) { dis += 1366371; k = 1991; }
      else if (k === -1500 && ppp2 > 1990) { dis += 1275060; k = 1991; }
      else if (k === -1250 && ppp2 > 1990) { dis += 1183750; k = 1991; }
      else if (k === -1000 && ppp2 > 1990) { dis += 1092439; k = 1991; }
      else if (k === -750 && ppp2 > 1990) { dis += 1001128; k = 1991; }
      else if (k === -500 && ppp2 > 1990) { dis += 909818; k = 1991; }
      else if (k === -250 && ppp2 > 1990) { dis += 818507; k = 1991; }
      else if (k === 0 && ppp2 > 1990) { dis += 727197; k = 1991; }
      else if (k === 250 && ppp2 > 1990) { dis += 635887; k = 1991; }
      else if (k === 500 && ppp2 > 1990) { dis += 544576; k = 1991; }
      else if (k === 750 && ppp2 > 1990) { dis += 453266; k = 1991; }
      else if (k === 1000 && ppp2 > 1990) { dis += 361955; k = 1991; }
      else if (k === 1250 && ppp2 > 1990) { dis += 270644; k = 1991; }
      else if (k === 1500 && ppp2 > 1990) { dis += 179334; k = 1991; }
      else if (k === 1750 && ppp2 > 1990) { dis += 88023; k = 1991; }

      dis += dayOfYear(k, 12, 31);
      k += 1;
    }
    dis += p2;
    dis *= pr;
  }
  return dis;
}
```

---

### 5.4 dayOfYear() - 연간 일수

### 위치: core/src/pillars.ts (라인 70-87)

```typescript
/** year의 1월 1일부터 month/day까지 일수 */
function dayOfYear(year: number, month: number, day: number): number {
  let e = 0;
  for (let i = 1; i < month; i++) {
    e += 31;
    if (i === 2 || i === 4 || i === 6 || i === 9 || i === 11) {
      e -= 1;
    }
    if (i === 2) {
      e -= 2;
      if (year % 4 === 0) e += 1;
      if (year % 100 === 0) e -= 1;
      if (year % 400 === 0) e += 1;
      if (year % 4000 === 0) e -= 1;
    }
  }
  e += day;
  return e;
}
```

---

## 6. lunar-javascript 통합 (사주 입력)

### 위치: core/src/saju.ts (라인 491-501)

```typescript
/** BirthInput → SajuResult (확장 버전) */
export function calculateSaju(input: BirthInput): SajuResult {
  const useSolarTime = input.timezone != null && input.timezone !== DEFAULT_TIMEZONE;
  const { year, month, day, hour, minute } = useSolarTime
    ? adjustBirthInputToSolarTime(input)
    : adjustBirthInputToKstWallClock(input);
  const { gender } = input;
  const isMale = gender === 'M';

  // 사주 계산 (년, 월, 일, 시)
  const [yp, mp, dp, hp] = getFourPillars(year, month, day, hour, minute, input.jasiMethod);
  // ... 이후 로직
}
```

**주요 포인트**:
- **lunar-javascript는 사주 계산에 직접 사용되지 않음**
- 입력 받은 양력 날짜/시간을 그대로 사용
- `getFourPillars()` → `calcPillarIndices()` 호출

---

## 7. 기술적 괴리 분석

| 항목 | 간지 계산 | 절기 계산 |
|------|---------|---------|
| **기준점** | UNIT (1996-02-04 22:08) | UNIT (1996-02-04 22:08) |
| **기준점 타임존** | UTC | UTC |
| **입력 타임존** | KST (보정됨) | KST (보정 안 됨) |
| **minutesBetween()** | 입력값 기준 | 입력값 기준 |
| **dateFromMinutes()** | 역산 정확 | 역산 정확 |
| **타임존 보정** | ✅ adjustBirthInputToKstWallClock() | ❌ 없음 |
| **결과 정확도** | ✅ 정확 | ❌ 9시간 오차 |

---

## 8. 타임존 보정 로직 (간지 계산만)

### 위치: core/src/timezone.ts

```typescript
export function adjustBirthInputToKstWallClock(input: BirthInput): BirthInput {
  // KST 벽시 입력을 UTC로 변환하여 calcPillarIndices에 전달
  // 예: KST 2026-05-01 12:00 → UTC 2026-05-01 03:00
  // ...
}
```

**절기 계산에는 이 보정이 적용되지 않음!**

---

## 9. 결론

### 간지 계산이 정확한 이유:
1. ✅ 입력 타임존 보정 (adjustBirthInputToKstWallClock)
2. ✅ UTC 기준점 사용
3. ✅ 정확한 분 단위 계산

### 절기 계산이 부정확한 이유:
1. ❌ 입력 타임존 보정 없음
2. ❌ UTC 기준점 사용 (KST로 변환 안 함)
3. ❌ 9시간 시간대 차이 미반영

### 필요한 수정:
```typescript
export function calcSolarTermsKST(
  year: number, month: number, day: number, hour: number, min: number,
): SolarTermResult {
  // 1. KST 입력을 UTC로 변환
  const utcHour = (hour - 9 + 24) % 24;
  const utcDay = hour >= 9 ? day : day - 1;
  
  // 2. UTC 기준으로 calcSolarTerms 호출
  const result = calcSolarTerms(year, month, utcDay, utcHour, min);
  
  // 3. 결과를 KST로 변환
  result.midHour = (result.midHour + 9) % 24;
  result.midDay += result.midHour < 9 ? 1 : 0;
  
  return result;
}
```

