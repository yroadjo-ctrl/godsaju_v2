import { useState, useMemo } from 'react'
import { Solar } from 'lunar-javascript'
import { getRelation, getHiddenStems, getTwelveMeteor, getTwelveSpirit } from '@core/pillars'




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

interface Props {
  dayStem?: string;
  yearBranch?: string;
  onSelectedDateChange?: (date: Date | null) => void;
}

const DailyCalendar: React.FC<Props> = ({ dayStem, yearBranch, onSelectedDateChange }) => {
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

  // 오행 색상 매핑 (천간과 지지별)
  const getOhaengColor = (char: string): string => {
    // 천간 오행
    const stemOhaeng: Record<string, string> = {
      '甲': 'text-green-600',   // 목
      '乙': 'text-green-600',   // 목
      '丙': 'text-red-600',     // 화
      '丁': 'text-red-600',     // 화
      '戊': 'text-yellow-700',  // 토
      '己': 'text-yellow-700',  // 토
      '庚': 'text-gray-600',    // 금
      '辛': 'text-gray-600',    // 금
      '壬': 'text-blue-600',    // 수
      '癸': 'text-blue-600'     // 수
    };
    
    // 지지 오행
    const branchOhaeng: Record<string, string> = {
      '子': 'text-blue-600',    // 수
      '丑': 'text-yellow-700',  // 토
      '寅': 'text-green-600',   // 목
      '卯': 'text-green-600',   // 목
      '辰': 'text-yellow-700',  // 토
      '巳': 'text-red-600',     // 화
      '午': 'text-red-600',     // 화
      '未': 'text-yellow-700',  // 토
      '申': 'text-gray-600',    // 금
      '酉': 'text-gray-600',    // 금
      '戌': 'text-yellow-700',  // 토
      '亥': 'text-blue-600'     // 수
    };
    
    return stemOhaeng[char] || branchOhaeng[char] || 'text-slate-600';
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

  // 셀 배경색 결정
  const getCellBgColor = (day: number): string => {
    const cellDateStr = dateToString(new Date(year, month, day));
    const isToday = cellDateStr === todayStr;
    const isSelected = cellDateStr === selectedDateStr && !isToday;
    
    if (isSelected) {
      return 'bg-blue-200';  // 선택됨 (파란색)
    } else if (isToday) {
      return 'bg-amber-300';  // 오늘 (주황색)
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
          <div key={`empty-${i}`} className="border-r border-b border-slate-300 h-24 bg-slate-50/50"></div>
        ))}

        {/* 실제 날짜 칸 */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayOfWeek = (firstDayOfMonth + i) % 7;
          const lunar = getLunarDay(day);
          const jieQi = getJieQiInfo(day);
          
          // 요일별 색상: 0=일(빨강), 6=토(파랑)
          const dayColor = dayOfWeek === 0 ? 'text-red-600' : dayOfWeek === 6 ? 'text-blue-600' : 'text-slate-700';
          
          // 셀 배경색
          const bgColor = getCellBgColor(day);

          return (
            <div 
              key={day}
              onClick={() => handleCellClick(day)}
              className={`border-r border-b border-slate-300 h-24 p-2 transition-colors cursor-pointer group relative ${bgColor}`}
            >
              {/* 절기 시간 - 우측 상단 파란색 */}
              {jieQi && (
                <div className="absolute top-0.5 right-1 text-[9px] font-bold text-blue-600 whitespace-nowrap">
                  {jieQi.name} {jieQi.time}
                </div>
              )}

              <div className="flex items-baseline gap-1">
                <span className={`text-sm font-bold ${dayColor}`}>{day}</span>
                <span className="text-[9px] text-slate-600 font-medium">
                  (음 {lunar})
                </span>
              </div>
              
              {/* 일진(日干支) 표시 - 셀 중앙 */}
              {(() => {
                const ganzi = getDayGanzi(day);
                if (ganzi) {
                  const tenStems = getTenStems(ganzi.stem, ganzi.branch);
                  return (
                    <div className="mt-1 flex flex-col items-center justify-center">
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
                      {/* 12운성 + 12신살 (같은 줄) */}
                      <div className="flex items-center justify-center gap-3 mt-0.5">
                        {/* 12운성 */}
                        {(() => {
                          const meteorology = getTwelveMeteorology(ganzi.branch);
                          if (meteorology) {
                            return (
                              <div className="text-[7px] text-gray-500 text-center">
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
                              <div className="text-[7px] text-gray-500 text-center">
                                ({spirits})
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
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
      
        <div className="mt-4 text-[11px] text-slate-400 text-right">
          * 날짜를 클릭하면 하이라이트됩니다. (오늘은 주황색 고정)
        </div>
      </div>
    </div>
  );
}

export default DailyCalendar;
