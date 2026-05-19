import { useState, useMemo } from 'react'
import { Solar } from 'lunar-javascript'
import { getRelation, getHiddenStems, getTwelveMeteor, getTwelveSpirit, getStemRelation, getBranchRelation } from '@core/pillars'
import { HGANJI, GONGMANG_TABLE } from '@core/constants'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'




// 라이브러리 내부 키값과 완벽하게 일치시킨 24절기 순서 (정확한 한자 사용)
const JIEQI_LIST = [
  "小寒", "大寒", "立春", "雨水", "驚蟄", "春分",
  "清明", "穀雨", "立夏", "小滿", "芒種", "夏至",
  "小暑", "大暑", "立秋", "處暑", "白露", "秋分",
  "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"
];

// 한글 매핑용
const JIEQI_KOR = [
  "소한", "대한", "입춘", "우수", "경칩", "춘분",
  "청명", "곡우", "입하", "소만", "망종", "하지",
  "소서", "대서", "입추", "처서", "백로", "추분",
  "한로", "상강", "입동", "소설", "대설", "동지"
];

// 누락된 절기들의 간체 한자 대체 (라이브러리가 간체를 사용할 수 있음)
const JIEQI_FALLBACK: Record<number, string> = {
  4: "惊蛰",    // 경칩
  7: "谷雨",    // 곡우
  9: "小满",    // 소만
  10: "芒种",   // 망종
  15: "处暑"    // 처서
};

// 모든 24절기 추출 (연도 경계 보정 포함)
function getAllJieQi(year: number) {
  try {
    const solar = Solar.fromYmd(year, 1, 1);
    const lunar = solar.getLunar();
    const jieQiTable = lunar.getJieQiTable();

    const result: Record<number, Record<number, { name: string; time: string }>> = {};

    JIEQI_KOR.forEach((name, index) => {
      let chineseKey = JIEQI_LIST[index];
      let solarData = jieQiTable[chineseKey];

      // 만약 기본 한자로 못 찾으면 간체 한자 시도
      if (!solarData && JIEQI_FALLBACK[index]) {
        chineseKey = JIEQI_FALLBACK[index];
        solarData = jieQiTable[chineseKey];
      }

      // [핵심] 연도 경계 보정: 동지 등이 전년도/내년도 데이터일 경우 처리
      if (solarData) {
        const dataYear = solarData.getYear();
        
        // 만약 가져온 데이터의 연도가 입력한 연도와 다르면
        if (dataYear !== year) {
          // 다음 연도의 테이블에서 해당 절기를 다시 찾음
          try {
            const nextYearSolar = Solar.fromYmd(year + 1, 1, 1);
            const nextYearLunar = nextYearSolar.getLunar();
            const nextYearTable = nextYearLunar.getJieQiTable();
            const nextData = nextYearTable[chineseKey];
            
            if (nextData && nextData.getYear() === year) {
              solarData = nextData;
            }
          } catch (e) {
            // 실패하면 원래 데이터 사용
          }
        }
      }

      if (!solarData) {
        return; // 누락 처리
      }

      // 라이브러리 시간(UTC+8)을 Date 객체로 변환
      const dateStr = solarData.toYmdHms();
      const [y, m, d, h, min, s] = dateStr.split(/[-: ]/).map(Number);
      const date = new Date(y, m - 1, d, h, min, s);
      
      // 한국 시간(UTC+9)으로 1시간 추가 보정
      date.setHours(date.getHours() + 1);

      const korMonth = date.getMonth() + 1;
      const korDay = date.getDate();
      const korHour = String(date.getHours()).padStart(2, '0');
      const korMin = String(date.getMinutes()).padStart(2, '0');

      if (!result[korMonth]) {
        result[korMonth] = {};
      }

      result[korMonth][korDay] = {
        name: name,
        time: `${korHour}:${korMin}`
      };
    });

    return result;
  } catch (e) {
    console.error('JieQi 계산 오류:', e);
    return {};
  }
}

// 날짜를 "YYYY-MM-DD" 형식으로 변환
function dateToString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 오행 영어→한자 변환
const ELEMENT_HANJA: Record<string, string> = {
  tree: '木', fire: '火', earth: '土', metal: '金', water: '水',
};

// 합충형파해 이모지 매핑
const RELATION_EMOJI: Record<string, string> = {
  '合': '🔗', '半合': '🤝', '沖': '⚡', '刑': '⚠️',
  '破': '💥', '害': '🗡️', '怨嗔': '😤', '鬼門': '👻',
};

// 관계 타입 한글 라벨
const RELATION_KOR: Record<string, string> = {
  '合': '합(合)', '半合': '반합(半合)', '沖': '충(沖)', '刑': '형(刑)',
  '破': '파(破)', '害': '해(害)', '怨嗔': '원진(怨嗔)', '鬼門': '귀문관살(鬼門)',
};

interface Props {
  dayStem?: string;
  yearBranch?: string;
  natalPillars?: string[]; // [시주, 일주, 월주, 년주] 간지 문자열
  onSelectedDateChange?: (date: Date | null) => void;
}

const DailyCalendar: React.FC<Props> = ({ dayStem, yearBranch, natalPillars, onSelectedDateChange }) => {
  const [viewDate, setViewDate] = useState(new Date());
  
  // 오늘 날짜 (고정, 주황색)
  const today = new Date();
  const todayStr = dateToString(today);
  
  // 선택된 날짜 (클릭 시 파란색, 오늘 제외)
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  


  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // 달력 계산 로직
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 해당 연도의 모든 절기 데이터 미리 계산
  const jieQiData = useMemo(() => {
    return getAllJieQi(year);
  }, [year]);

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

  // 해당 날짜의 절기 정보 가져오기
  const getJieQiInfo = (d: number) => {
    return jieQiData[month + 1]?.[d] || null;
  };

  // 일진(日干支) 추출 함수
  const getDayGanzi = (d: number) => {
    try {
      const solar = Solar.fromYmd(year, month + 1, d);
      const lunar = solar.getLunar();
      const stem = lunar.getDayGan();   // 천간 (예: "甲")
      const branch = lunar.getDayZhi(); // 지지 (예: "子")
      
      if (stem && branch) {
        return { ganzi: stem + branch, stem, branch };
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // 십성 계산 함수 (사용자 일간 기준)
  const getTenStems = (stem: string, branch: string) => {
    if (!dayStem) return { stemTenStem: null, branchTenStem: null };
    
    // 천간 십성
    const stemRelation = getRelation(dayStem, stem);
    const stemTenStem = stemRelation?.hanja || null;
    
    // 지지 십성 (지지의 숨겨진 천간 정기로 계산)
    const hiddenStems = getHiddenStems(branch);
    const jeonggi = hiddenStems.replace(/ /g, '').slice(-1); // 정기 (마지막 글자)
    const branchRelation = getRelation(dayStem, jeonggi);
    const branchTenStem = branchRelation?.hanja || null;
    
    return { stemTenStem, branchTenStem };
  };

  // 공망(空亡) 지지 집합 — 원국 일주 기준
  const gongmangBranchSet = useMemo((): Set<string> => {
    if (!natalPillars || natalPillars.length < 2) return new Set()
    const dayGanzi = natalPillars[1] // 일주 (index 1)
    const idx = HGANJI.indexOf(dayGanzi)
    if (idx < 0) return new Set()
    const branches = GONGMANG_TABLE[Math.trunc(idx / 10)] ?? []
    return new Set(branches)
  }, [natalPillars])

  // 오행 색상 매핑 (목:#00C459 화:#FF0000 토:#FF9900 수:#3366FF 금:#808080)
  const getOhaengColor = (char: string): string => {
    const map: Record<string, string> = {
      '甲': 'text-[#00C459]', '乙': 'text-[#00C459]',
      '丙': 'text-[#FF0000]', '丁': 'text-[#FF0000]',
      '戊': 'text-[#FF9900]', '己': 'text-[#FF9900]',
      '庚': 'text-[#808080]', '辛': 'text-[#808080]',
      '壬': 'text-[#3366FF]', '癸': 'text-[#3366FF]',
      '子': 'text-[#3366FF]', '亥': 'text-[#3366FF]',
      '丑': 'text-[#FF9900]', '辰': 'text-[#FF9900]', '未': 'text-[#FF9900]', '戌': 'text-[#FF9900]',
      '寅': 'text-[#00C459]', '卯': 'text-[#00C459]',
      '巳': 'text-[#FF0000]', '午': 'text-[#FF0000]',
      '申': 'text-[#808080]', '酉': 'text-[#808080]',
    };
    return map[char] || 'text-slate-600';
  };

  // 일운 합충형파해 계산 (원국 4주 vs 일진 천간/지지)
  const getDayInteractions = (dayStemChar: string, dayBranchChar: string) => {
    if (!natalPillars || natalPillars.length === 0) return [];
    const posLabels = ['시', '일', '월', '년'];
    const results: Array<{ type: string; detail: string | null; label: string }> = [];

    natalPillars.forEach((pillar, idx) => {
      const nStem = pillar[0];
      const nBranch = pillar[1];
      const pos = posLabels[idx];

      // 천간 관계
      getStemRelation(nStem, dayStemChar).forEach(rel => {
        if (rel.type) {
          const detailStr = rel.detail ? (ELEMENT_HANJA[rel.detail] ?? rel.detail) : '';
          results.push({
            type: rel.type,
            detail: rel.detail,
            label: `${nStem}${dayStemChar} ${rel.type}${detailStr} (${pos}간)`,
          });
        }
      });

      // 지지 관계
      getBranchRelation(nBranch, dayBranchChar).forEach(rel => {
        if (rel.type) {
          const detailStr = rel.detail ? (ELEMENT_HANJA[rel.detail] ?? rel.detail) : '';
          results.push({
            type: rel.type,
            detail: rel.detail,
            label: `${nBranch}${dayBranchChar} ${rel.type}${detailStr} (${pos}지)`,
          });
        }
      });
    });

    return results;
  };

  // 셀 클릭 핸들러
  const handleCellClick = (day: number) => {
    const cellDate = new Date(year, month, day);
    const cellDateStr = dateToString(cellDate);
    // 오늘을 클릭하면 선택 해제 (주황색 유지)
    if (cellDateStr === todayStr) {
      setSelectedDateStr(null);
      onSelectedDateChange?.(null);
    } else {
      setSelectedDateStr(cellDateStr);
      onSelectedDateChange?.(cellDate);
    }
  };

  // 12운성 추출 함수 (사용자 일간 기준)
  const getTwelveMeteorology = (branch: string) => {
    if (!dayStem) return null;
    const result = getTwelveMeteor(dayStem, branch);
    // "장생(長生)" 형식에서 한자만 추출
    const match = result.match(/\((.+?)\)/);
    return match ? match[1] : null;
  };

  // 12신살 추출 함수 (사용자 년지 기준, 殺 추가)
  const getTwelveSpirits = (branch: string) => {
    if (!yearBranch) return null;
    const result = getTwelveSpirit(yearBranch, branch);
    // "겁살(劫殺)" 형식에서 한자만 추출 후 殺 추가
    const match = result.match(/\((.+?)\)/);
    if (match) {
      const spirit = match[1];
      // 마지막 글자가 殺이 아니면 추가
      return spirit.endsWith('殺') ? spirit : spirit + '殺';
    }
    return null;
  };

  // 합충형파해 우선순위 기반 셀 테두리 색상 결정
  const INTERACTION_PRIORITY = ['沖', '刑', '合', '半合', '破', '害', '怨嗔', '鬼門'];
  const INTERACTION_RING: Record<string, string> = {
    '沖':  'ring-2 ring-inset ring-[#FF0000]',
    '刑':  'ring-2 ring-inset ring-[#FF00FF]',
    '合':  'ring-2 ring-inset ring-[#00B050]',
    '半合': 'ring-2 ring-inset ring-[#00B050]',
    '破':  'ring-2 ring-inset ring-[#FFC000]',
    '害':  'ring-2 ring-inset ring-[#FFFF00]',
    '怨嗔': 'ring-2 ring-inset ring-[#FF99FF]',
    '鬼門': 'ring-2 ring-inset ring-[#FF99FF]',
  };

  const getCellInteractionRing = (day: number): string => {
    const ganzi = getDayGanzi(day);
    if (!ganzi) return '';
    const interactions = getDayInteractions(ganzi.stem, ganzi.branch);
    if (interactions.length === 0) return '';
    const types = new Set(interactions.map(r => r.type));
    for (const priority of INTERACTION_PRIORITY) {
      if (types.has(priority)) return INTERACTION_RING[priority] ?? '';
    }
    return '';
  };

  // 셀 배경색 결정
  const getCellBgColor = (day: number): string => {
    const cellDateStr = dateToString(new Date(year, month, day));
    const isToday = cellDateStr === todayStr;
    const isSelected = cellDateStr === selectedDateStr && !isToday;
    
    if (isSelected) {
      return 'bg-[#66FFFF]';  // 선택됨
    } else if (isToday) {
      return 'bg-[#FFFF00]';  // 오늘
    }
    return 'hover:bg-slate-50';  // 기본
  };

   return (
    <div className="w-full mt-6">
      {/* 일운 타이틀 */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">일운(日運)</h3>
      </div>
      
      <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        {/* 달력 헤더: 월 이동 */}
        <div className="flex justify-between items-center mb-6 px-2">
          <button 
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors font-bold"
          >
            {"<"}
          </button>
          <h2 className="text-lg font-bold text-slate-800">
            {year}년 {month + 1}월
          </h2>
          <button 
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors font-bold"
          >
            {">"}        </button>
        </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-t border-l border-slate-300">
        {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
          <div 
            key={day} 
            className={`py-2 text-center text-xs font-bold border-r border-b border-slate-300 bg-slate-50
              ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-600'}`}
          >
            {day}
          </div>
        ))}

        {/* 시작일 전 빈 칸 처리 */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="border-r border-b border-slate-300 h-28 bg-slate-50/50"></div>
        ))}

        {/* 실제 날짜 칸 */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayOfWeek = (firstDayOfMonth + i) % 7;
          const lunar = getLunarDay(day);
          const jieQi = getJieQiInfo(day);

          // 공망 여부
          const dayGanziInfo = getDayGanzi(day);
          const isGongmang = dayGanziInfo ? gongmangBranchSet.has(dayGanziInfo.branch) : false;
          
          // 요일별 색상: 0=일(빨강), 6=토(파랑)
          const dayColor = dayOfWeek === 0 ? 'text-red-600' : dayOfWeek === 6 ? 'text-blue-600' : 'text-slate-700';
          
          // 셀 배경색
          const bgColor = getCellBgColor(day);
          const interactionRing = getCellInteractionRing(day);

          return (
            <div 
              key={day}
              onClick={() => handleCellClick(day)}
              className={`border-r border-b border-slate-300 h-20 sm:h-28 transition-colors cursor-pointer group relative ${bgColor} ${interactionRing} flex flex-col`}
            >
              {/* 절기 - 상단 전체 너비 바 */}
              {jieQi ? (
                <div className="w-full text-center text-[9px] font-bold text-white whitespace-nowrap rounded-t-sm py-px"
                  style={{ backgroundColor: '#FF66FF' }}>
                  {jieQi.name} {jieQi.time}
                </div>
              ) : (
                <div className="h-[3px]" />
              )}

              <div className={`flex items-baseline gap-0.5 px-1.5 ${jieQi ? 'pt-0' : 'pt-1'}`}>
                <span className={`text-sm font-bold ${dayColor}`}>{day}</span>
                <span className="text-[9px] text-slate-600 font-medium">(음{lunar})</span>
                {isGongmang && (
                  <span className="text-[9px] font-bold" style={{ color: '#FF0000' }}>空</span>
                )}
              </div>
              
              {/* 일진(日干支) 표시 - 셀 중앙 */}
              {(() => {
                const ganzi = getDayGanzi(day);
                if (ganzi) {
                  const tenStems = getTenStems(ganzi.stem, ganzi.branch);
                  return (
                    <div className={`${jieQi ? 'mt-0' : 'mt-0.5'} flex flex-col items-center justify-center px-1`}>
                      {/* 천간 + 천간십성 */}
                      <div className="flex items-center justify-center gap-1">
                        <div className="flex flex-col items-center">
                          <span className={`text-base font-bold ${getOhaengColor(ganzi.stem)}`}>
                            {ganzi.stem}
                          </span>
                          {tenStems.stemTenStem && (
                            <span className={`text-[8px] font-bold ${getOhaengColor(ganzi.stem)}`}>
                              ({tenStems.stemTenStem})
                            </span>
                          )}
                        </div>
                        {/* 지지 + 지지십성 */}
                        <div className="flex flex-col items-center">
                          <span className={`text-base font-bold ${getOhaengColor(ganzi.branch)}`}>
                            {ganzi.branch}
                          </span>
                          {tenStems.branchTenStem && (
                            <span className={`text-[8px] font-bold ${getOhaengColor(ganzi.branch)}`}>
                              ({tenStems.branchTenStem})
                            </span>
                          )}
                        </div>
                      </div>
                      {/* 12운성 + 12신살 (같은 줄) — PC(sm↑)에서만 표시 */}
                      <div className="hidden sm:flex items-center justify-center gap-3 mt-0.5">
                        {/* 12운성 */}
                        {(() => {
                          const meteorology = getTwelveMeteorology(ganzi.branch);
                          if (meteorology) {
                            return (
                              <div className="text-[7px] text-black text-center">
                                ({meteorology})
                              </div>
                            );
                          }
                          return null;
                        })()}
                        {/* 12신살 */}
                        {(() => {
                          const spirits = getTwelveSpirits(ganzi.branch);
                          if (spirits) {
                            return (
                              <div className="text-[7px] text-black text-center">
                                ({spirits})
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* 합충형파해 이모지 + Popover — PC(sm↑)에서만 표시 */}
                      {(() => {
                        const interactions = getDayInteractions(ganzi.stem, ganzi.branch);
                        if (interactions.length === 0) return null;
                        const uniqueTypes = [...new Set(interactions.map(r => r.type))];
                        return (
                          <Popover>
                            <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <div className="hidden sm:flex gap-0.5 justify-center mt-1 cursor-pointer hover:opacity-70">
                                {uniqueTypes.slice(0, 4).map((type, ti) => (
                                  <span key={ti} className="text-[11px] leading-none" title={RELATION_KOR[type] ?? type}>
                                    {RELATION_EMOJI[type] ?? '•'}
                                  </span>
                                ))}
                                {uniqueTypes.length > 4 && (
                                  <span className="text-[8px] text-slate-400">+{uniqueTypes.length - 4}</span>
                                )}
                              </div>
                            </PopoverTrigger>
                            <PopoverContent
                              side="bottom"
                              align="center"
                              sideOffset={6}
                              className="w-56 p-3 z-50 bg-white border border-slate-200 shadow-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-700">
                                  {month + 1}월 {day}일 합충형파해
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {interactions.map((item, ii) => (
                                  <div key={ii} className="flex items-start gap-1.5 text-xs text-slate-600">
                                    <span className="text-sm leading-none flex-shrink-0">
                                      {RELATION_EMOJI[item.type] ?? '•'}
                                    </span>
                                    <span>{item.label}</span>
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })()}
                    </div>
                  );
                }
                return (
                  <div className="mt-2 h-8 flex items-center justify-center">
                    <span className="text-[10px] text-slate-300 italic">계산중...</span>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
      
        <div className="mt-4 flex flex-wrap gap-3 items-center text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm ring-2 ring-[#FF0000]"></span>충(沖)</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm ring-2 ring-[#FF00FF]"></span>형(刑)</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm ring-2 ring-[#00B050]"></span>합(合)/반합</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm ring-2 ring-[#FFC000]"></span>파(破)</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm ring-2 ring-[#FFFF00]"></span>해(害)</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm ring-2 ring-[#FF99FF]"></span>원진/귀문</span>
          <span className="flex items-center gap-1"><span className="inline-block w-4 h-3 rounded-sm text-[8px] font-bold text-white flex items-center justify-center" style={{backgroundColor:'#FF66FF'}}>절기</span>절기</span>
          <span className="ml-auto text-slate-400">* 중복 시 우선순위 높은 관계 표시 · 이모지 클릭 시 상세 보기</span>
        </div>
      </div>
    </div>
  );
}

export default DailyCalendar;
