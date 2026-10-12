import { expect, test, type Page } from '@playwright/test'

// 오늘을 2026-03-18(수) 정오로 고정한다. 어제·그제가 같은 달이라 달력을 넘기지 않아도 된다.
const TODAY_LABEL = '2026년 3월 18일 수요일, 오늘'
const YESTERDAY_LABEL = '2026년 3월 17일 화요일'
const TWO_DAYS_AGO_LABEL = '2026년 3월 16일 월요일'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-03-18T12:00:00+09:00'))
  await page.goto('/')
})

async function addHabit(page: Page, name: string) {
  await page.getByLabel('새 습관').fill(name)
  await page.getByRole('button', { name: '추가' }).click()
  await expect(page.getByRole('heading', { level: 2, name })).toBeVisible()
}

function dayButton(page: Page, label: string) {
  return page.getByRole('button', { name: label, exact: true })
}

function currentStreak(page: Page) {
  return page.locator('.streak__item', { hasText: '현재 연속' }).locator('.streak__value')
}

function habitSelectButton(page: Page, name: string) {
  return page.locator('.habit-item__select', { hasText: name })
}

test('습관을 등록하고 오늘을 체크하면 연속 1일이 되고, 다시 누르면 해제되어 0일이 된다', async ({ page }) => {
  await addHabit(page, '물 마시기')
  const toggle = page.getByRole('button', { name: '물 마시기 오늘 완료' })

  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect(currentStreak(page)).toHaveText('0일')

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(dayButton(page, TODAY_LABEL)).toHaveAttribute('aria-pressed', 'true')
  await expect(currentStreak(page)).toHaveText('1일')
  await expect(habitSelectButton(page, '물 마시기')).toContainText('연속 1일')

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect(dayButton(page, TODAY_LABEL)).toHaveAttribute('aria-pressed', 'false')
  await expect(currentStreak(page)).toHaveText('0일')
  await expect(habitSelectButton(page, '물 마시기')).toContainText('연속 0일')
})

test('어제와 오늘을 체크하면 연속 2일이 된다', async ({ page }) => {
  await addHabit(page, '물 마시기')

  await dayButton(page, YESTERDAY_LABEL).click()
  await dayButton(page, TODAY_LABEL).click()

  await expect(currentStreak(page)).toHaveText('2일')
  await expect(habitSelectButton(page, '물 마시기')).toContainText('연속 2일')
})

test('그제와 오늘만 체크하면(어제 빠짐) 연속 1일이 된다', async ({ page }) => {
  await addHabit(page, '물 마시기')

  await dayButton(page, TWO_DAYS_AGO_LABEL).click()
  await dayButton(page, TODAY_LABEL).click()

  await expect(dayButton(page, YESTERDAY_LABEL)).toHaveAttribute('aria-pressed', 'false')
  await expect(currentStreak(page)).toHaveText('1일')
  await expect(habitSelectButton(page, '물 마시기')).toContainText('연속 1일')
})

test('체크한 뒤 새로고침해도 체크 기록과 연속 일수가 남아 있다', async ({ page }) => {
  await addHabit(page, '물 마시기')
  await dayButton(page, YESTERDAY_LABEL).click()
  await dayButton(page, TODAY_LABEL).click()
  await expect(currentStreak(page)).toHaveText('2일')

  await page.reload()

  await expect(page.getByRole('heading', { level: 2, name: '물 마시기' })).toBeVisible()
  await expect(dayButton(page, YESTERDAY_LABEL)).toHaveAttribute('aria-pressed', 'true')
  await expect(dayButton(page, TODAY_LABEL)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: '물 마시기 오늘 완료' })).toHaveAttribute('aria-pressed', 'true')
  await expect(currentStreak(page)).toHaveText('2일')
  await expect(habitSelectButton(page, '물 마시기')).toContainText('연속 2일')
})

test('습관을 삭제하면 확인 창을 거쳐 목록에서 사라지고 다음 습관이 선택된다', async ({ page }) => {
  await addHabit(page, '물 마시기')
  await addHabit(page, '책 읽기')
  await addHabit(page, '스트레칭')

  await habitSelectButton(page, '물 마시기').click()
  await expect(page.getByRole('heading', { level: 2, name: '물 마시기' })).toBeVisible()

  await page.getByRole('button', { name: '삭제' }).click()
  const dialog = page.getByRole('dialog', { name: '‘물 마시기’ 습관을 삭제할까요?' })
  await expect(dialog).toBeVisible()

  // 취소하면 아무것도 지워지지 않는다.
  await dialog.getByRole('button', { name: '취소' }).click()
  await expect(dialog).toBeHidden()
  await expect(habitSelectButton(page, '물 마시기')).toBeVisible()

  await page.getByRole('button', { name: '삭제' }).click()
  await dialog.getByRole('button', { name: '삭제' }).click()
  await expect(dialog).toBeHidden()

  await expect(habitSelectButton(page, '물 마시기')).toHaveCount(0)
  await expect(page.locator('.habit-item__name')).toHaveText(['책 읽기', '스트레칭'])
  const next = habitSelectButton(page, '책 읽기')
  await expect(next).toHaveAttribute('aria-current', 'true')
  await expect(next).toBeFocused()
  await expect(page.getByRole('heading', { level: 2, name: '책 읽기' })).toBeVisible()
})
