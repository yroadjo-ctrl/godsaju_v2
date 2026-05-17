# 절기(JieQi) 추출 로직 분석 보고서

## 1. DailyCalendar.tsx (현재 상태)

```typescript
import React, { useState } from 'react';
import { Solar } from 'lunar-javascript'; 

const DailyCalendar: React.FC = () => {
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // 달력 계산 로직
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 음력 날짜를 가져오는 함수
  const getLunarDay = (d: number) => {
    try {
      const solar = Solar.fromYmd(year, month + 1, d);
      const lunar = solar.getLunar();
      return `${lunar.getMonth()}.${lunar.getDay()}`;
    } catch (e) {
      return "?.?";
    }
  };

  // ... 렌더링 코드 ...
};
```

**현재 상태:**
- ✅ lunar-javascript로 음력 변환 성공
- ❌ 절기(JieQi) 데이터 없음
- ❌ 타임존 보정 없음

---

## 2. 절기 계산 핵심 함수 (core/src/pillars.ts)

### 2.1 calcSolarTerms() - 절기 시간 계산

```typescript
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

**반환값 해석:**
- `ingiName`: 입기 인덱스 (0-23, 24절기)
- `ingiYear/Month/Day/Hour/Min`: 입기 날짜/시각
- `midName`: 중기 인덱스
- `midYear/Month/Day/Hour/Min`: 중기 날짜/시각
- `outgiName`: 출기 인덱스
- `outgiYear/Month/Day/Hour/Min`: 출기 날짜/시각

---

### 2.2 기준점 (UNIT) - UTC 기준

```typescript
const UNIT = {
  year: 1996, month: 2, day: 4, hour: 22, min: 8,
  // 1996-02-04 22:08 (병자년 입춘)
};
```

**⚠️ 중요:** 이 기준점은 **UTC 기준**입니다.
- 한국 시간(KST, UTC+9)으로 변환하려면 **9시간을 더해야 함**

---

### 2.3 절기 상수 (MONTH 배열) - 분 단위

```typescript
const MONTH = [
  0, 21355, 42843, 64498, 86335, 108366, 130578, 152958,
  175471, 198077, 220728, 243370, 265955, 288432, 310767,
  332928, 354903, 376685, 398290, 419736, 441060, 462295,
  483493, 504693, 525949,
];
```

**의미:**
- 각 절기가 기준점(1996-02-04 22:08 UTC)으로부터 몇 분 떨어져 있는지 나타냄
- 인덱스: 0=입춘, 1=우수, 2=경칩, ... 23=대한
- 525949분 = 약 365.2422일 (태양년)

---

### 2.4 핵심 유틸 함수

#### minutesBetween() - 두 시점 사이의 분 계산

```typescript
function minutesBetween(
  uy: number, umm: number, ud: number, uh: number, umin: number,
  y1: number, mo1: number, d1: number, h1: number, mm1: number,
): number {
  const dispday = daysBetween(uy, umm, ud, y1, mo1, d1);
  return dispday * 24 * 60 + (uh - h1) * 60 + (umin - mm1);
}
```

**동작:**
- 기준점(UNIT)에서 입력 시점까지의 분 차이 계산
- **현재 구현: UTC 기준**

#### dateFromMinutes() - 분으로부터 날짜 역산

```typescript
function dateFromMinutes(
  tmin: number, uyear: number, umonth: number, uday: number,
  uhour: number, umin: number,
): [number, number, number, number, number] {
  // 이진 탐색으로 년/월/일/시/분 계산
  // 반환: [year, month, day, hour, minute]
}
```

---

## 3. 타임존 문제 분석

### 현재 상황:
- **기준점 UNIT**: 1996-02-04 22:08 **UTC**
- **계산 결과**: UTC 기준 시각
- **실제 필요**: KST (UTC+9) 기준 시각

### 예시 (소만 - Grain Buds):
- 계산 결과: 2026-05-21 **10:50 UTC**
- 실제 필요: 2026-05-21 **19:50 KST** (10:50 + 9시간)

❌ **현재는 9시간 차이 발생**

---

## 4. 절기 이름 매핑

절기 인덱스 → 한글 이름:

```
0: 입춘 (立春)
1: 우수 (雨水)
2: 경칩 (驚蟄)
3: 춘분 (春分)
4: 청명 (清明)
5: 곡우 (穀雨)
6: 입하 (立夏)
7: 소만 (小滿)
8: 망종 (芒種)
9: 하지 (夏至)
10: 소서 (小暑)
11: 대서 (大暑)
12: 입추 (立秋)
13: 처서 (處暑)
14: 백로 (白露)
15: 추분 (秋分)
16: 한로 (寒露)
17: 상강 (霜降)
18: 입동 (立冬)
19: 소설 (小雪)
20: 대설 (大雪)
21: 동지 (冬至)
22: 소한 (小寒)
23: 대한 (大寒)
```

---

## 5. 필요한 보정 사항

### 5.1 타임존 보정 (UTC → KST)

```typescript
// 현재: UTC 기준 계산
const result = calcSolarTerms(year, month, day, 0, 0);

// 필요: KST 보정
const kstHour = result.midHour + 9;
const kstDay = result.midDay + (kstHour >= 24 ? 1 : 0);
const kstHourAdjusted = kstHour % 24;
```

### 5.2 입력 시점 보정

```typescript
// 현재: 자정(00:00) 기준
calcSolarTerms(year, month, day, 0, 0)

// 필요: KST 자정을 UTC로 변환 후 입력
// KST 2026-05-01 00:00 = UTC 2026-04-30 15:00
calcSolarTerms(2026, 4, 30, 15, 0)
```

---

## 6. 개선 방안

### 방안 1: calcSolarTerms() 직접 호출 + 보정
```typescript
const result = calcSolarTerms(year, month, day, 0, 0);
// UTC → KST 변환
const kstHour = (result.midHour + 9) % 24;
const kstDay = result.midDay + (result.midHour + 9 >= 24 ? 1 : 0);
```

### 방안 2: 래퍼 함수 생성
```typescript
export function calcSolarTermsKST(year: number, month: number, day: number) {
  // 내부에서 UTC → KST 자동 변환
  // 1분 오차도 없는 정밀 보정
}
```

---

## 7. 현재 코드의 문제점

| 항목 | 현재 상태 | 필요 상태 |
|------|---------|---------|
| 절기 데이터 | ❌ 없음 | ✅ calcSolarTerms() 호출 필요 |
| 타임존 | ❌ UTC 기준 | ✅ KST(UTC+9) 필요 |
| 보정 로직 | ❌ 없음 | ✅ 9시간 + 일자 조정 필요 |
| 정밀도 | - | ✅ 분 단위 정확도 필요 |

---

## 8. 다음 단계

1. **DailyCalendar.tsx 수정**
   - `calcSolarTerms()` import
   - 각 날짜마다 절기 계산
   - KST 보정 적용

2. **절기 이름 매핑**
   - 인덱스 → 한글 이름 변환

3. **UI 표시**
   - 예: `1(음 3.15) 입하 20:48`

