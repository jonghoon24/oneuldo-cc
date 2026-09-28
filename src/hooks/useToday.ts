import { useEffect, useState } from 'react'
import { msUntilNextMidnight, todayKey } from '../lib/date'

const FALLBACK_CHECK_MS = 60_000

/** 브라우저 현지 날짜 기준의 오늘. 자정, 탭 재활성화, 주기 확인으로 갱신한다. */
export function useToday(): string {
  const [today, setToday] = useState(todayKey)

  useEffect(() => {
    const refresh = () => setToday(todayKey())

    const midnightTimer = window.setTimeout(refresh, msUntilNextMidnight() + 50)
    const fallbackTimer = window.setInterval(refresh, FALLBACK_CHECK_MS)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearTimeout(midnightTimer)
      window.clearInterval(fallbackTimer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [today])

  return today
}
