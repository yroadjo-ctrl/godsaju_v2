/**
 * 사주 결과 조립 (갓사주 업그레이드 버전)
 * Phase 4: YinYang, FamilyRelation, GuiinInfo 계산 로직 추가
 */
import {
  getFourPillars, getDaewoon, getRelation, getJeonggi,
  getTwelveMeteor, getTwelveSpirit, getHiddenStems, analyzeAllRelations,
  calculateJwabeop, calculateInjongbeop, getGongmang,
} from './pillars.ts';
import { STEM_INFO } from './constants.ts';
import { calculateOhaengSipsinStats, calculateOhaengSipsinStatsWeighted } from './ohaeng-analysis.ts';
import { calculateSinGangYak } from './singang-analysis.ts';
import { calculateYongsin } from './yongsin-analysis.ts';
import { calculateJohu } from './johu-analysis.ts';
import { calculateHapHwa } from './hap-hwa-analysis.ts';
import { calculateGyeokguk } from './gyeokguk-analysis.ts';
import { calculateDaewoonMeta } from './daewoon-meta.ts';
import { formatNayeon } from './nayeon.ts';
import { getAdjustedBirthDateTime } from './birth-calendar.ts';
import type {
  BirthInput, SajuResult, PillarDetail, PillarDetailExtended, Pillar, DaewoonItem, Gongmang,
  YinYangElement, FamilyRelation, GuiinInfo, SpecialSinsal,
} from './types.ts';

/** 천간 → 십신 (한글(한자)) */
function getSipsin(dayStem: string, targetStem: string): string {
  const rel = getRelation(dayStem, targetStem);
  return rel ? `${rel.hangul}(${rel.hanja})` : '?';
}

/** 지장간 한글(한자) 변환 */
function formatJigang(jigangStr: string): string {
  const stemKorean: Record<string, string> = {
    '甲': '갑', '乙': '을', '丙': '병', '丁': '정',
    '戊': '무', '己': '기', '庚': '경', '辛': '신',
    '壬': '임', '癸': '계'
  };
  const stems = jigangStr.replace(/ /g, '').split('');
  const koreanStems = stems.map(s => stemKorean[s] || s).join('');
  const hanjaStem = stems.join('');
  return `${koreanStems}(${hanjaStem})`;
}

/** 천간 → 음양오행 */
function getStemYinYangElement(stem: string): YinYangElement {
  const yinYangMap: Record<string, { yinyang: string; element: string }> = {
    '甲': { yinyang: '陽', element: '木' },
    '乙': { yinyang: '陰', element: '木' },
    '丙': { yinyang: '陽', element: '火' },
    '丁': { yinyang: '陰', element: '火' },
    '戊': { yinyang: '陽', element: '土' },
    '己': { yinyang: '陰', element: '土' },
    '庚': { yinyang: '陽', element: '金' },
    '辛': { yinyang: '陰', element: '金' },
    '壬': { yinyang: '陽', element: '水' },
    '癸': { yinyang: '陰', element: '水' },
  };
  const info = yinYangMap[stem] || { yinyang: '?', element: '?' };
  const yinyangKorean: Record<string, string> = { '陽': '양', '陰': '음' };
  const elementKorean: Record<string, string> = { '木': '목', '火': '화', '土': '토', '金': '금', '水': '수' };
  const koreanYinYang = `${yinyangKorean[info.yinyang] || '?'}${elementKorean[info.element] || '?'}`;
  return {
    yinyang: info.yinyang,
    element: info.element,
    korean: koreanYinYang,
  };
}

/** 지지 → 음양오행 */
function getBranchYinYangElement(branch: string): YinYangElement {
  const yinYangMap: Record<string, { yinyang: string; element: string }> = {
    '子': { yinyang: '陽', element: '水' },
    '丑': { yinyang: '陰', element: '土' },
    '寅': { yinyang: '陽', element: '木' },
    '卯': { yinyang: '陰', element: '木' },
    '辰': { yinyang: '陽', element: '土' },
    '巳': { yinyang: '陰', element: '火' },
    '午': { yinyang: '陽', element: '火' },
    '未': { yinyang: '陰', element: '土' },
    '申': { yinyang: '陽', element: '金' },
    '酉': { yinyang: '陰', element: '金' },
    '戌': { yinyang: '陽', element: '土' },
    '亥': { yinyang: '陰', element: '水' },
  };
  const info = yinYangMap[branch] || { yinyang: '?', element: '?' };
  const yinyangKorean: Record<string, string> = { '陽': '양', '陰': '음' };
  const elementKorean: Record<string, string> = { '木': '목', '火': '화', '土': '토', '金': '금', '水': '수' };
  const koreanYinYang = `${yinyangKorean[info.yinyang] || '?'}${elementKorean[info.element] || '?'}`;
  return {
    yinyang: info.yinyang,
    element: info.element,
    korean: koreanYinYang,
  };
}

/** 육친 계산 (일간 기준) */
function getFamilyRelation(dayStem: string, targetStem: string, pillarIndex: number): FamilyRelation | undefined {
  const rel = getRelation(dayStem, targetStem);
  if (!rel) return undefined;

  return {
    hanja: targetStem,
    korean: rel.hangul,
    type: 'relation',
  };
}

/** 귀인 정보 계산 */
function getGuiinForPillar(dayStem: string, stem: string, branch: string, monthBranch: string): GuiinInfo[] {
  const guiins: GuiinInfo[] = [];

  // 천을귀인 (일간 기준)
  const cheonulMap: Record<string, string[]> = {
    '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
    '乙': ['子', '申'], '己': ['子', '申'],
    '丙': ['亥', '酉'], '丁': ['亥', '酉'],
    '壬': ['巳', '卯'], '癸': ['巳', '卯'],
    '辛': ['寅', '午']
  };
  if (cheonulMap[dayStem]?.includes(branch)) {
    guiins.push({ name: '천을귀인', type: 'cheonul' });
  }

  // 천덕귀인 (월지 기준)
  const cheondukMap: Record<string, string> = {
    '子': '壬', '丑': '癸', '寅': '甲', '卯': '乙',
    '辰': '甲', '巳': '丙', '午': '丁', '未': '己',
    '申': '庚', '酉': '辛', '戌': '庚', '亥': '壬'
  };
  if (cheondukMap[monthBranch] === stem) {
    guiins.push({ name: '천덕귀인', type: 'cheonduk' });
  }

  // 월덕귀인 (월지 기준)
  const woldukMap: Record<string, string> = {
    '寅': '丙', '午': '丙', '戌': '丙',
    '申': '壬', '子': '壬', '辰': '壬',
    '亥': '甲', '卯': '甲', '未': '甲',
    '巳': '庚', '酉': '庚', '丑': '庚'
  };
  if (woldukMap[monthBranch] === stem) {
    guiins.push({ name: '월덕귀인', type: 'wolduk' });
  }

  // 태극귀인 (일간 기준)
  const taegukMap: Record<string, string[]> = {
    '甲': ['子', '午'], '乙': ['子', '午'],
    '丙': ['卯', '酉'], '丁': ['卯', '酉'],
    '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'],
    '庚': ['寅', '亥'], '辛': ['寅', '亥'],
    '壬': ['巳', '申'], '癸': ['巳', '申']
  };
  if (taegukMap[dayStem]?.includes(branch)) {
    guiins.push({ name: '태극귀인', type: 'taeguk' });
  }

  // 문창귀인 (일간 기준)
  const moonchangMap: Record<string, string> = {
    '甲': '子', '乙': '子',
    '丙': '卯', '丁': '卯',
    '戊': '午', '己': '午',
    '庚': '酉', '辛': '酉',
    '壬': '亥', '癸': '亥'
  };
  if (moonchangMap[dayStem] === branch) {
    guiins.push({ name: '문창귀인', type: 'moonchang' });
  }

  return guiins;
}

export function getPillarSinsals(
  pillarIndex: number,
  dayStem: string,
  stems: string[],
  branches: string[],
  dayPillar: string[],
  yearPillar: string[],
  allPillars: Array<{ ganzi: string; stem: string; branch: string }>
): SpecialSinsal[] {
  const sinsalList: SpecialSinsal[] = [];
  const addSinsal = (name: string, position: 'heaven' | 'earth') => {
    if (!sinsalList.find(s => s.name === name && s.position === position)) {
      sinsalList.push({ name, position, pillarIndex });
    }
  };
  
  const currentStem = stems[pillarIndex];
  const currentBranch = branches[pillarIndex];
  const currentGanzi = currentStem + currentBranch;
  const monthBranch = branches[2]; // 월주 지지 (월지)
  
  // 조건 천간이 있는 기둥을 찾는 헬퍼 함수
  const findStemColumn = (targetStem: string): number => {
    return stems.findIndex(s => s === targetStem);
  };
  
  // ==================== PART A: 천간(Stem) 검사 → 상단(heaven) 배치 ====================
  
  // 1. 괴강살 (天干): 기둥 먼저 확인
  // 정확한 6개 기둥: 壬辰, 壬戌, 庚辰, 庚戌, 戊戌, 庚申
  if (['壬辰', '壬戌', '庚辰', '庚戌', '戊戌', '庚申'].includes(currentGanzi)) {
    addSinsal('괴강살', 'heaven');
  }
  
  // 2. 백호대살 (天干): 기둥 먼저 확인
  // 정확한 8개 기둥: 甲辰, 乙未, 丙戌, 丁丑, 戊辰, 壬戌, 癸丑, 己未
  if (['甲辰', '乙未', '丙戌', '丁丑', '戊辰', '壬戌', '癸丑', '己未'].includes(currentGanzi)) {
    addSinsal('백호대살', 'heaven');
  }
  
  // 3. 천덕귀인 (天干): 월지 기준 조건을 찾되, 해당 천간이 있는 기둥에만 표시
  const cheondukMap: Record<string, string> = {
    '子': '壬', '丑': '癸', '寅': '甲', '卯': '乙',
    '辰': '甲', '巳': '丙', '午': '丁', '未': '己',
    '申': '庚', '酉': '辛', '戌': '庚', '亥': '壬'
  };
  // 월지 기준 조건 천간 찾기
  const cheondukStem = cheondukMap[monthBranch];
  // 조건 천간이 현재 기둥에 있으면 표시 (조건 천간이 있는 기둥에만)
  if (cheondukStem && cheondukStem === currentStem) {
    addSinsal('천덕귀인', 'heaven');
  }
  
  // 4. 월덕귀인 (天干): 월지 기준 조건을 찾되, 해당 천간이 있는 기둥에만 표시
  const woldukMap: Record<string, string> = {
    '寅': '丙', '午': '丙', '戌': '丙',
    '申': '壬', '子': '壬', '辰': '壬',
    '亥': '甲', '卯': '甲', '未': '甲',
    '巳': '庚', '酉': '庚', '丑': '庚'
  };
  // 월지 기준 조건 천간 찾기
  const woldukStem = woldukMap[monthBranch];
  // 조건 천간이 현재 기둥에 있으면 표시 (조건 천간이 실제로 있는 기둥에만)
  if (woldukStem && woldukStem === currentStem) {
    addSinsal('월덕귀인', 'heaven');
  }
  
  // 5. 현침살 (天干): 천간이 甲, 辛, 庚일 때
  if (currentStem === '甲' || currentStem === '辛' || currentStem === '庚') {
    addSinsal('현침살', 'heaven');
  }
  
  // ==================== PART B: 지지(Branch) 검사 → 하단(earth) 배치 ====================
  
  // 6. 괴강살 (地支): 기둥이 맞으면 지지에도 표시
  // 정확한 6개 기둥: 壬辰, 壬戌, 庚辰, 庚戌, 戊戌, 庚申
  if (['壬辰', '壬戌', '庚辰', '庚戌', '戊戌', '庚申'].includes(currentGanzi)) {
    addSinsal('괴강살', 'earth');
  }
  
  // 7. 백호대살 (地支): 기둥이 맞으면 지지에도 표시
  // 정확한 8개 기둥: 甲辰, 乙未, 丙戌, 丁丑, 戊辰, 壬戌, 癸丑, 己未
  if (['甲辰', '乙未', '丙戌', '丁丑', '戊辰', '壬戌', '癸丑', '己未'].includes(currentGanzi)) {
    addSinsal('백호대살', 'earth');
  }
  
  // 8. 천을귀인 (地支): 모든 천간 기준 지지
  const cheonulMap: Record<string, string[]> = {
    '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
    '乙': ['子', '申'], '己': ['子', '申'],
    '丙': ['亥', '酉'], '丁': ['亥', '酉'],
    '壬': ['巳', '卯'], '癸': ['巳', '卯'],
    '辛': ['寅', '午']
  };
  if (cheonulMap[dayStem]?.includes(currentBranch)) {
    addSinsal('천을귀인', 'earth');
  }
  
  // 9. 천문성 (地支): 지지가 亥, 戌, 未, 卯일 때만 (午는 제외)
  // 정확한 4개 지지: 亥, 戌, 未, 卯
  if (currentBranch === '亥' || currentBranch === '戌' || currentBranch === '未' || currentBranch === '卯') {
    addSinsal('천문성', 'earth');
  }
  
  // 9-1. 현침살 (地支): 지지가 卯, 午, 申일 때
  // 정확한 3개 지지: 卯, 午, 申
  if (currentBranch === '卯' || currentBranch === '午' || currentBranch === '申') {
    addSinsal('현침살', 'earth');
  }
  
  // 10. 태극귀인 (地支): 일간 기준 지지
  const taegukMap: Record<string, string[]> = {
    '甲': ['子', '午'], '乙': ['子', '午'],
    '丙': ['卯', '酉'], '丁': ['卯', '酉'],
    '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'],
    '庚': ['寅', '亥'], '辛': ['寅', '亥'],
    '壬': ['巳', '申'], '癸': ['巳', '申']
  };
  if (taegukMap[dayStem]?.includes(currentBranch)) {
    addSinsal('태극귀인', 'earth');
  }
  
  // 11. 문창귀인 (地支): 일간 기준 지지
  const moonchangMap: Record<string, string> = {
    '甲': '子', '乙': '子',
    '丙': '卯', '丁': '卯',
    '戊': '午', '己': '午',
    '庚': '酉', '辛': '酉',
    '壬': '亥', '癸': '亥'
  };
  if (moonchangMap[dayStem] === currentBranch) {
    addSinsal('문창귀인', 'earth');
  }
  
  // 12. 암록 (地支): 일간 기준 암록지
  const amrokMap: Record<string, string> = {
    '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午',
    '戊': '午', '己': '午', '庚': '申', '辛': '酉',
    '壬': '亥', '癸': '子'
  };
  if (amrokMap[dayStem] === currentBranch) {
    addSinsal('암록', 'earth');
  }
  
  // 13. 정록 (地支): 일간 기준 정록지
  const jeongrokMap: Record<string, string> = {
    '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午',
    '戊': '巳', '己': '午', '庚': '申', '辛': '酉',
    '壬': '亥', '癸': '子'
  };
  if (jeongrokMap[dayStem] === currentBranch) {
    addSinsal('정록', 'earth');
  }
  
  // 14. 양인살 (地支): 일간 기준 제왕지
  const yanginsalMap: Record<string, string> = {
    '甲': '卯', '乙': '卯',
    '丙': '午', '丁': '午', '戊': '午', '己': '午',
    '庚': '酉', '辛': '酉',
    '壬': '子', '癸': '子'
  };
  if (yanginsalMap[dayStem] === currentBranch) {
    addSinsal('양인살', 'earth');
  }
  
  // 15. 홍염살 (地支): 일간 기준 독립 로직 (양인살과 다름)
  const hongryeomsalMap: Record<string, string> = {
    '甲': '午', '乙': '午',
    '丙': '寅', '丁': '未',
    '戊': '辰', '己': '辰',
    '庚': '戌', '辛': '酉',
    '壬': '子', '癸': '申'
  };
  if (hongryeomsalMap[dayStem] === currentBranch) {
    addSinsal('홍염살', 'earth');
  }
  
  // 16. 현침살 (地支): 지지가 卯, 午, 申일 때
  // ⚠️ 글자 모양 우선: 천간에서 이미 현침살을 가져갔어도 지지에도 표시
  if (currentBranch === '卯' || currentBranch === '午' || currentBranch === '申') {
    addSinsal('현침살', 'earth');
  }
  
  // 17. 원진살 (地支): 지지 쌍 관계
  const wonjinPairs: [string, string][] = [
    ['子', '未'], ['丑', '午'], ['寅', '酉'],
    ['卯', '申'], ['辰', '亥'], ['巳', '戌']
  ];
  for (const [b1, b2] of wonjinPairs) {
    if (currentBranch === b1 || currentBranch === b2) {
      const pairBranch = currentBranch === b1 ? b2 : b1;
      for (let i = 0; i < branches.length; i++) {
        if (i !== pillarIndex && branches[i] === pairBranch) {
          addSinsal('원진살', 'earth');
          break;
        }
      }
      break;
    }
  }
  
  // 18. 귀문관살 (地支): 지지 쌍 관계
  const gwimunPairs: [string, string][] = [
    ['子', '酉'], ['丑', '午'], ['寅', '未'],
    ['卯', '申'], ['辰', '亥'], ['巳', '戌']
  ];
  for (const [b1, b2] of gwimunPairs) {
    if (currentBranch === b1 || currentBranch === b2) {
      const pairBranch = currentBranch === b1 ? b2 : b1;
      for (let i = 0; i < branches.length; i++) {
        if (i !== pillarIndex && branches[i] === pairBranch) {
          addSinsal('귀문관살', 'earth');
          break;
        }
      }
      break;
    }
  }
  
  return sinsalList;
}

/** BirthInput → SajuResult (확장 버전) */
export function calculateSaju(input: BirthInput): SajuResult {
  const { year, month, day, hour, minute } = getAdjustedBirthDateTime(input);
  const { gender } = input;
  const isMale = gender === 'M';

  // 사주 계산 (년, 월, 일, 시)
  const [yp, mp, dp, hp] = getFourPillars(year, month, day, hour, minute, input.jasiMethod);
  
  // 일간 (일주의 천간)
  const dayStem = dp[0];
  const monthBranch = mp[1];
  
  // 각 주의 천간/지지 (시 일 월 년 순서)
  const stems = [hp[0], dp[0], mp[0], yp[0]];
  const branches = [hp[1], dp[1], mp[1], yp[1]];
  const ganzis = [hp, dp, mp, yp];

  // 주별 상세 정보 조립 (확장 버전)
  const pillars: PillarDetailExtended[] = ganzis.map((ganzi, i) => {
    const stem = stems[i];
    const branch = branches[i];
    
    // 천간 십신
    let stemSipsin = getSipsin(dayStem, stem);
    // 일주 천간도 십신 표기 (비견f등)
    
    // 지지 십신 (지장간 정기)
    const jeonggi = getJeonggi(branch);
    const branchSipsin = getSipsin(dayStem, jeonggi);
    
    // 12운성
    const unseong = getTwelveMeteor(dayStem, branch);
    
    // 12신살 (연지 기준)
    const sinsal = getTwelveSpirit(yp[1], branch);
    
    // 지장간 (한글(한자) 형식)
    const jigangRaw = getHiddenStems(branch);
    const jigang = formatJigang(jigangRaw);
    // 확장 필드
    const stemYinYangElement = getStemYinYangElement(stem);
    const branchYinYangElement = getBranchYinYangElement(branch);
    const stemRelation = getFamilyRelation(dayStem, stem, i);
    const branchRelation = getFamilyRelation(dayStem, jeonggi, i);
    const pillarGuiin = getGuiinForPillar(dayStem, stem, branch, monthBranch);
    const pillar: Pillar = { ganzi: stem + branch, stem, branch };
    
    return {
      pillar,
      stemSipsin,
      branchSipsin,
      unseong,
      sinsal,
      jigang,
      nayeon: formatNayeon(pillar.ganzi),
      // 확장 필드
      stemYinYangElement,
      branchYinYangElement,
      stemRelation,
      branchRelation,
      guiin: pillarGuiin,
      hasGongmang: false, // 공망은 별도로 설정
    };
  });
  // 대운 계산 (시간 모름이면 정오 기준)
  const dwHour = input.unknownTime ? 12 : hour;
  const dwMinute = input.unknownTime ? 0 : minute;
  const rawDaewoon = getDaewoon(isMale, year, month, day, dwHour, dwMinute, input.jasiMethod);
  const birthForDaewoon = new Date(year, month - 1, day, dwHour, dwMinute);
  const daewoonMeta = calculateDaewoonMeta(
    isMale, year, month, day, dwHour, dwMinute, input.jasiMethod, rawDaewoon[0],
  );
  const yearBranch = yp[1];
  // 공망 계산
  const gmBranches = getGongmang(dp);
  const gmSet = new Set(gmBranches);
  const gongmang: Gongmang = {
    branches: gmBranches,
    pillarIndices: branches.reduce<number[]>((acc, b, i) => {
      if (gmSet.has(b)) acc.push(i);  // 모든 주에 공망 표시
      return acc;
    }, []),
  };
  // 공망 정보 업데이트
  pillars.forEach((p, i) => {
    if (gongmang.pillarIndices.includes(i)) {
      p.hasGongmang = true;
    }
  });
  const daewoon: DaewoonItem[] = rawDaewoon.map((dw, i) => {
    // 칸 헤더 나이: 대운 시작 연도 기준 10년 단위 (0·10·20…)
    const age = dw.startDate.getFullYear() - year;
    const dwStem = dw.ganzi[0];
    const dwBranch = dw.ganzi[1];
    const dwStemSipsin = getSipsin(dayStem, dwStem);
    const dwBranchJeonggi = getJeonggi(dwBranch);
    const dwBranchSipsin = getSipsin(dayStem, dwBranchJeonggi);
    const unseong = getTwelveMeteor(dayStem, dwBranch);
    const sinsal = getTwelveSpirit(yearBranch, dwBranch);
    return {
      index: i + 1,
      ganzi: dw.ganzi,
      startDate: dw.startDate,
      age,
      stemSipsin: dwStemSipsin,
      branchSipsin: dwBranchSipsin,
      unseong,
      sinsal,
      isGongmang: gmSet.has(dwBranch),
    };
  });
  // 팔자 관계
  const relations = analyzeAllRelations(ganzis);
  // 특수신살 (기둥별 천·지)
  const godSinsal: SpecialSinsal[] = [];
  const allPillars = ganzis.map((ganzi, idx) => ({
    ganzi: ganzi[0] + ganzi[1],
    stem: stems[idx],
    branch: branches[idx]
  }));
  for (let i = 0; i < 4; i++) {
    const pillarSinsals = getPillarSinsals(i, dayStem, stems, branches, [dp[0], dp[1]], [yp[0], yp[1]], allPillars);
    godSinsal.push(...pillarSinsals);
  }
  // 좌법 · 인종법
  const dayBranch = dp[1];
  const jwabeop = calculateJwabeop(dayStem, branches, dayBranch);
  const injongbeop = calculateInjongbeop(dayStem, dayBranch);
  const ohaengSipsin = calculateOhaengSipsinStats(pillars as PillarDetail[], input.unknownTime);
  const ohaengSipsinWeighted = calculateOhaengSipsinStatsWeighted(pillars as PillarDetail[], input.unknownTime);
  const hapHwa = calculateHapHwa(pillars as PillarDetail[], relations, ohaengSipsinWeighted);
  const ohaengSipsinAdjusted = hapHwa.adjustedOhaeng;
  const sinGangYak = calculateSinGangYak(pillars as PillarDetail[], input.unknownTime);
  const johu = calculateJohu(pillars as PillarDetail[]);
  const gyeokguk = calculateGyeokguk(pillars as PillarDetail[], sinGangYak, ohaengSipsinAdjusted);
  const yongsin = calculateYongsin(sinGangYak, ohaengSipsinAdjusted, { johu, gyeokguk, hapHwa });
  return {
    input,
    pillars: pillars as any, // PillarDetailExtended는 PillarDetail의 확장
    daewoon,
    relations,
    godSinsal,
    gongmang,
    jwabeop,
    injongbeop,
    ohaengSipsin,
    ohaengSipsinWeighted,
    ohaengSipsinAdjusted,
    hapHwa,
    johu,
    gyeokguk,
    sinGangYak,
    yongsin,
    daewoonMeta,
  };
}
