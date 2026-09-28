// 개발 모드에서 `?mock`으로 접속하면 저장소가 비어 있을 때 목 데이터를 채운다.
import { addDays, todayKey } from '../lib/date'
import { DATA_VERSION, STORAGE_KEY, type Habit, type StoredData } from '../lib/storage'

/** 기준일로부터 offsets일 전 날짜 목록 (0 = 기준일) */
function daysAgo(today: string, offsets: number[]): string[] {
  return offsets.map((offset) => addDays(today, -offset)).sort()
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

export function createMockData(today: string = todayKey()): StoredData {
  const habits: Habit[] = [
    {
      // 오늘까지 12일 연속, 지난달부터 기록이 있다
      id: 'mock-water',
      name: '물 2잔 마시기',
      createdDate: addDays(today, -45),
      completedDates: daysAgo(today, [...range(0, 11), 13, 14, 15, 18, 20, 21, 22, 25, 30, 31, 33, 40, 44]),
    },
    {
      // 오늘은 아직, 어제까지 5일 연속
      id: 'mock-walk',
      name: '30분 걷기',
      createdDate: addDays(today, -20),
      completedDates: daysAgo(today, [...range(1, 5), 8, 9, 12, 15, 16, 19]),
    },
    {
      // 어제 기록이 없어 0일
      id: 'mock-reading',
      name: '독서 10쪽',
      createdDate: addDays(today, -10),
      completedDates: daysAgo(today, [2, 3, 4, 7, 9]),
    },
    {
      // 오늘 등록, 기록 없음
      id: 'mock-meditation',
      name: '명상 5분',
      createdDate: today,
      completedDates: [],
    },
  ]
  return { version: DATA_VERSION, habits }
}

export function seedMockDataFromUrl(): void {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('mock')) return
  url.searchParams.delete('mock')
  window.history.replaceState(null, '', url)
  try {
    if (window.localStorage.getItem(STORAGE_KEY) !== null) {
      console.info('[oneuldo] 저장된 데이터가 있어 목 데이터를 넣지 않았어요.')
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createMockData()))
    console.info('[oneuldo] 목 데이터를 넣었어요.')
  } catch (error) {
    console.warn('[oneuldo] 목 데이터를 넣지 못했어요.', error)
  }
}
