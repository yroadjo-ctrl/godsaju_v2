import { adjustBirthInputToKstWallClock, isKoreanHistoricalTimeAnomaly } from '../core/src/timezone.ts';
import { getFourPillars } from '../core/src/pillars.ts';

const STEM_K = { '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계' };
const BR_K = { '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해' };

function pillarStr(yp, mp, dp, hp) {
  const p = [hp, dp, mp, yp];
  return p.map((x) => STEM_K[x[0]] + BR_K[x[1]]).join(' ');
}

function subtractMinutes(y, m, d, h, min, delta) {
  const t = Date.UTC(y, m - 1, d, h, min) - delta * 60000;
  const d2 = new Date(t);
  return {
    year: d2.getUTCFullYear(),
    month: d2.getUTCMonth() + 1,
    day: d2.getUTCDate(),
    hour: d2.getUTCHours(),
    minute: d2.getUTCMinutes(),
  };
}

/** 포스텔러 UI: 역사 서머타임 해당 시 -60분 */
function forcetellerAdjust(input) {
  if (!isKoreanHistoricalTimeAnomaly(input.year, input.month, input.day)) return input;
  return subtractMinutes(input.year, input.month, input.day, input.hour, input.minute, 60);
}

function calcGodsaju(input) {
  const adj = adjustBirthInputToKstWallClock(input);
  const [yp, mp, dp, hp] = getFourPillars(adj.year, adj.month, adj.day, adj.hour, adj.minute);
  return { adj, pillars: pillarStr(yp, mp, dp, hp), hp, dp, yp, mp };
}

function calcForce(input) {
  const adj = forcetellerAdjust(input);
  const [yp, mp, dp, hp] = getFourPillars(adj.year, adj.month, adj.day, adj.hour, adj.minute);
  return { adj, pillars: pillarStr(yp, mp, dp, hp), hp, dp, yp, mp };
}

function fmt(input) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${input.year}-${pad(input.month)}-${pad(input.day)} ${pad(input.hour)}:${pad(input.minute)}`;
}

const cases = [];
const years = [1948, 1949, 1950, 1951, 1954, 1955, 1956, 1957, 1958, 1959, 1960, 1961, 1987, 1988];

for (const y of years) {
  for (const m of [1, 5, 9, 12]) {
    for (const d of [1, 8, 15, 28]) {
      for (let h = 0; h < 24; h++) {
        for (const min of [0, 15, 30, 45]) {
          const input = { year: y, month: m, day: d, hour: h, minute: min };
          try {
            const g = calcGodsaju(input);
            const f = calcForce(input);
            if (g.pillars !== f.pillars) {
              const inMin = h * 60 + min;
              const gAdjMin = g.adj.hour * 60 + g.adj.minute;
              const fAdjMin = f.adj.hour * 60 + f.adj.minute;
              cases.push({
                input: fmt(input),
                godAdj: fmt(g.adj),
                forceAdj: fmt(f.adj),
                deltaGod: gAdjMin - inMin,
                deltaForce: fAdjMin - inMin,
                god: g.pillars,
                force: f.pillars,
                siDiff: g.hp !== f.hp,
                dayDiff: g.dp !== f.dp,
              });
            }
          } catch {
            /* skip invalid dates */
          }
        }
      }
    }
  }
}

console.log('총 차이 케이스:', cases.length);
const siOnly = cases.filter((c) => c.siDiff && !c.dayDiff);
const dayAlso = cases.filter((c) => c.dayDiff);
console.log('시주만 다른:', siOnly.length);
console.log('일주도 다른:', dayAlso.length);

console.log('\n=== 추천 테스트 (시주만, 경계 근처) ===');
for (const c of siOnly.slice(0, 20)) {
  console.log(`${c.input}  | 갓 ${c.godAdj}(${c.deltaGod}) 포 ${c.forceAdj}(${c.deltaForce})  | 갓:${c.god}  포:${c.force}`);
}

console.log('\n=== 1956-09 집중 ===');
const sep56 = cases.filter((c) => c.input.startsWith('1956-09'));
for (const c of sep56.slice(0, 15)) {
  console.log(`${c.input}  갓:${c.god}  포:${c.force}`);
}
