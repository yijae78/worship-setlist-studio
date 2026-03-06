// 대한민국 공휴일 데이터
// 고정 공휴일 + 음력 기반 공휴일 (2024-2028)

type HolidayMap = Record<string, string>;

const fixedHolidays: Record<string, string> = {
  "01-01": "새해",
  "03-01": "삼일절",
  "05-05": "어린이날",
  "06-06": "현충일",
  "08-15": "광복절",
  "10-03": "개천절",
  "10-09": "한글날",
  "12-25": "크리스마스"
};

// 음력 기반 공휴일 (연도별)
const lunarHolidays: Record<number, HolidayMap> = {
  2024: {
    "02-09": "설날 연휴",
    "02-10": "설날",
    "02-11": "설날 연휴",
    "02-12": "대체공휴일",
    "05-15": "부처님오신날",
    "09-16": "추석 연휴",
    "09-17": "추석",
    "09-18": "추석 연휴"
  },
  2025: {
    "01-28": "설날 연휴",
    "01-29": "설날",
    "01-30": "설날 연휴",
    "05-05": "부처님오신날",
    "10-05": "추석 연휴",
    "10-06": "추석",
    "10-07": "추석 연휴",
    "10-08": "대체공휴일",
    "03-03": "대체공휴일"
  },
  2026: {
    "02-16": "설날 연휴",
    "02-17": "설날",
    "02-18": "설날 연휴",
    "05-24": "부처님오신날",
    "09-24": "추석 연휴",
    "09-25": "추석",
    "09-26": "추석 연휴",
    "03-02": "대체공휴일"
  },
  2027: {
    "02-05": "설날 연휴",
    "02-06": "설날",
    "02-07": "설날 연휴",
    "02-08": "대체공휴일",
    "05-13": "부처님오신날",
    "09-14": "추석 연휴",
    "09-15": "추석",
    "09-16": "추석 연휴"
  },
  2028: {
    "01-25": "설날 연휴",
    "01-26": "설날",
    "01-27": "설날 연휴",
    "05-02": "부처님오신날",
    "10-02": "추석 연휴",
    "10-03": "추석",
    "10-04": "추석 연휴"
  }
};

export function getHolidayName(year: number, month: number, day: number): string | null {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const key = `${mm}-${dd}`;

  // 음력 기반 공휴일 우선
  const lunar = lunarHolidays[year]?.[key];
  if (lunar) return lunar;

  // 고정 공휴일
  const fixed = fixedHolidays[key];
  if (fixed) return fixed;

  return null;
}

export function isHoliday(year: number, month: number, day: number): boolean {
  return getHolidayName(year, month, day) !== null;
}
