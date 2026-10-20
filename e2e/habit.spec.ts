import { expect, test, type Page } from '@playwright/test'

// 오늘을 2026-03-18(수) 정오로 고정한다. 어제·그제가 같은 달이라 달력을 넘기지 않아도 된다.
const TODAY = '2026-03-18'
const YESTERDAY = '2026-03-17'
const TWO_DAYS_AGO = '2026-03-16'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-03-18T12:00:00+09:00'))
  await page.goto('/')
})

// 이번 달 1일. 어제·그제를 체크하는 테스트는 이 날을 시작일로 등록한다.
const MONTH_START = '2026-03-01'

function addForm(page: Page) {
  return page.locator('.panel--list .habit-form')
}

function addButton(page: Page) {
  return page.getByRole('button', { name: '습관 등록', exact: true })
}

/** '습관 등록' 폼을 열어 등록한다. startDate를 넘기면 그 날을 시작일로 고른다. */
async function addHabit(page: Page, name: string, startDate?: string) {
  await addButton(page).click()
  await addForm(page).getByLabel('이름').fill(name)
  if (startDate !== undefined) await addForm(page).getByLabel('시작일').fill(startDate)
  await addForm(page).getByRole('button', { name: '등록', exact: true }).click()
  await expect(page.getByRole('heading', { level: 2, name })).toBeVisible()
}

function dayButton(page: Page, date: string) {
  return page.locator(`.day[data-date="${date}"]`)
}

function todayToggle(page: Page, name: string) {
  return page.locator('.habit-item', { hasText: name }).locator('.today-toggle')
}

function currentStreak(page: Page) {
  return page.locator('.streak__value')
}

function habitSelectButton(page: Page, name: string) {
  return page.locator('.habit-item__select', { hasText: name })
}

test('습관을 등록하고 오늘을 체크하면 연속 1일이 되고, 다시 누르면 해제되어 0일이 된다', async ({ page }) => {
  await addHabit(page, '물 마시기')
  const toggle = todayToggle(page, '물 마시기')

  await expect(toggle).not.toHaveClass(/--done/)
  await expect(currentStreak(page)).toHaveText('0일')

  await toggle.click()
  await expect(toggle).toHaveClass(/--done/)
  await expect(dayButton(page, TODAY)).toHaveClass(/--done/)
  await expect(currentStreak(page)).toHaveText('1일')
  await expect(habitSelectButton(page, '물 마시기')).toContainText('연속 1일')

  await toggle.click()
  await expect(toggle).not.toHaveClass(/--done/)
  await expect(dayButton(page, TODAY)).not.toHaveClass(/--done/)
  await expect(currentStreak(page)).toHaveText('0일')
  await expect(habitSelectButton(page, '물 마시기')).toContainText('연속 0일')
})

test('어제와 오늘을 체크하면 연속 2일이 된다', async ({ page }) => {
  await addHabit(page, '물 마시기', MONTH_START)

  await dayButton(page, YESTERDAY).click()
  await dayButton(page, TODAY).click()

  await expect(currentStreak(page)).toHaveText('2일')
  await expect(habitSelectButton(page, '물 마시기')).toContainText('연속 2일')
})

test('그제와 오늘만 체크하면(어제 빠짐) 연속 1일이 된다', async ({ page }) => {
  await addHabit(page, '물 마시기', MONTH_START)

  await dayButton(page, TWO_DAYS_AGO).click()
  await dayButton(page, TODAY).click()

  await expect(dayButton(page, YESTERDAY)).not.toHaveClass(/--done/)
  await expect(currentStreak(page)).toHaveText('1일')
  await expect(habitSelectButton(page, '물 마시기')).toContainText('연속 1일')
})

test('체크한 뒤 새로고침해도 체크 기록과 연속 일수가 남아 있다', async ({ page }) => {
  await addHabit(page, '물 마시기', MONTH_START)
  await dayButton(page, YESTERDAY).click()
  await dayButton(page, TODAY).click()
  await expect(currentStreak(page)).toHaveText('2일')

  await page.reload()

  await expect(page.getByRole('heading', { level: 2, name: '물 마시기' })).toBeVisible()
  await expect(dayButton(page, YESTERDAY)).toHaveClass(/--done/)
  await expect(dayButton(page, TODAY)).toHaveClass(/--done/)
  await expect(todayToggle(page, '물 마시기')).toHaveClass(/today-toggle--done/)
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
  const dialog = page.locator('dialog', { hasText: '‘물 마시기’ 습관을 삭제할까요?' })
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
  await expect(page.locator('.habit-item', { hasText: '책 읽기' })).toHaveClass(/habit-item--selected/)
  await expect(page.getByRole('heading', { level: 2, name: '책 읽기' })).toBeVisible()
})

function monthlyRate(page: Page) {
  return page.locator('.calendar__rate')
}

/** 저장소에 습관 하나를 직접 넣고 새로고침한다. 날짜는 오름차순·중복 없이 넘긴다. */
async function seedHabit(page: Page, completedDates: string[], createdDate = TODAY) {
  const data = {
    version: 1,
    habits: [{ id: 'seed-habit', name: '물 마시기', createdDate, completedDates }],
  }
  await page.evaluate((json) => localStorage.setItem('oneuldo', json), JSON.stringify(data))
  await page.reload()
  await expect(page.getByRole('heading', { level: 2, name: '물 마시기' })).toBeVisible()
}

function datesOfMonth(monthKey: string, days: number[]) {
  return days.map((day) => `${monthKey}-${String(day).padStart(2, '0')}`)
}

function range(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

test('이번 달 날짜를 체크·해제하면 달성률이 즉시 바뀐다', async ({ page }) => {
  await addHabit(page, '물 마시기', MONTH_START)
  await expect(monthlyRate(page)).toHaveText('달성률 0% (0/18일)')

  await dayButton(page, YESTERDAY).click()
  await dayButton(page, TODAY).click()
  await expect(monthlyRate(page)).toHaveText('달성률 11% (2/18일)')

  await dayButton(page, TODAY).click()
  await expect(monthlyRate(page)).toHaveText('달성률 6% (1/18일)')
})

test('이번 달 12일을 체크하면 달성률 67% (12/18일)이다', async ({ page }) => {
  await seedHabit(page, datesOfMonth('2026-03', range(1, 12)))
  await expect(monthlyRate(page)).toHaveText('달성률 67% (12/18일)')
})

test('지난달로 이동하면 그 달 전체 일수 기준으로, 돌아오면 이번 달 기준으로 표시한다', async ({ page }) => {
  await seedHabit(page, [...datesOfMonth('2026-02', range(1, 20)), '2026-03-18'])
  await expect(monthlyRate(page)).toHaveText('달성률 6% (1/18일)')

  await page.locator('.calendar__prev').click()
  await expect(page.getByRole('heading', { level: 3, name: '2026년 2월' })).toBeVisible()
  await expect(monthlyRate(page)).toHaveText('달성률 71% (20/28일)')

  await page.locator('.calendar__next').click()
  await expect(page.getByRole('heading', { level: 3, name: '2026년 3월' })).toBeVisible()
  await expect(monthlyRate(page)).toHaveText('달성률 6% (1/18일)')
})

test('지난달을 모두 체크하면 달성률은 100% (28/28일)이다', async ({ page }) => {
  await seedHabit(page, datesOfMonth('2026-02', range(1, 28)))
  await page.locator('.calendar__prev').click()
  await expect(monthlyRate(page)).toHaveText('달성률 100% (28/28일)')
})

test('저장소에 오늘 이후 날짜가 섞여 있어도 달성률은 100%를 넘지 않는다', async ({ page }) => {
  await seedHabit(page, datesOfMonth('2026-03', range(1, 20)), MONTH_START)
  await expect(monthlyRate(page)).toHaveText('달성률 100% (18/18일)')
})

test('새로고침해도 같은 달성률이 표시된다', async ({ page }) => {
  await addHabit(page, '물 마시기', MONTH_START)
  await dayButton(page, YESTERDAY).click()
  await dayButton(page, TODAY).click()
  await expect(monthlyRate(page)).toHaveText('달성률 11% (2/18일)')

  await page.reload()

  await expect(page.getByRole('heading', { level: 2, name: '물 마시기' })).toBeVisible()
  await expect(monthlyRate(page)).toHaveText('달성률 11% (2/18일)')
})

test('매월 1일에 오늘을 체크하지 않았으면 달성률 0% (0/1일)이다', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-03-01T12:00:00+09:00'))
  await page.goto('/')
  await addHabit(page, '물 마시기')
  await expect(monthlyRate(page)).toHaveText('달성률 0% (0/1일)')
})

// 시작일

function storedHabit(page: Page): Promise<{ name: string; createdDate: string; completedDates: string[] }> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('oneuldo') ?? 'null')?.habits[0])
}

function editForm(page: Page) {
  return page.locator('.detail .habit-form')
}

/** '수정'을 열어 넘긴 칸만 바꾸고 저장한다. */
async function editHabit(page: Page, changes: { name?: string; startDate?: string }) {
  await page.getByRole('button', { name: '수정' }).click()
  if (changes.name !== undefined) await editForm(page).getByLabel('이름').fill(changes.name)
  if (changes.startDate !== undefined) await editForm(page).getByLabel('시작일').fill(changes.startDate)
  await editForm(page).getByRole('button', { name: '저장' }).click()
}

test('시작일을 지정하지 않으면 오늘이 시작일이 되어 어제는 체크할 수 없다', async ({ page }) => {
  await addHabit(page, '물 마시기')

  await expect(dayButton(page, TODAY)).toHaveClass(/day--start/)
  await expect(dayButton(page, YESTERDAY)).toHaveClass(/day--locked/)
  await expect(dayButton(page, YESTERDAY)).toBeDisabled()
  await expect(monthlyRate(page)).toHaveText('달성률 0% (0/1일)')
  await expect(page.locator('.calendar__prev')).toBeDisabled()
  await expect(page.locator('.calendar__legend')).toContainText('시작일')
})

test('등록할 때 지난 날짜를 시작일로 고르면 그 날부터 체크할 수 있다', async ({ page }) => {
  await addHabit(page, '물 마시기', '2026-03-10')

  await expect(dayButton(page, '2026-03-10')).toHaveClass(/day--start/)
  await expect(dayButton(page, '2026-03-09')).toBeDisabled()
  await expect(monthlyRate(page)).toHaveText('달성률 0% (0/9일)')

  await dayButton(page, '2026-03-10').click()
  await expect(dayButton(page, '2026-03-10')).toHaveClass(/--done/)
  await expect(monthlyRate(page)).toHaveText('달성률 11% (1/9일)')
})

test('등록 폼은 이름칸이 비어 있고 시작일이 오늘인 채로 열린다', async ({ page }) => {
  await expect(addForm(page)).toHaveCount(0)
  await addButton(page).click()

  await expect(addButton(page)).toHaveCount(0)
  await expect(addForm(page).getByLabel('이름')).toHaveValue('')
  await expect(addForm(page).getByLabel('시작일')).toHaveValue(TODAY)
  await expect(addForm(page).getByLabel('시작일')).toHaveAttribute('min', '1900-01-01')
  await expect(addForm(page).getByLabel('시작일')).toHaveAttribute('max', TODAY)
  await expect(addForm(page).getByRole('button')).toHaveText(['등록', '취소'])
})

test('빈 화면의 첫 습관 등록하기 버튼도 등록 폼을 연다', async ({ page }) => {
  await page.getByRole('button', { name: '첫 습관 등록하기' }).click()
  await expect(addForm(page).getByLabel('이름')).toBeFocused()
})

test('등록하면 폼이 닫히고, 다시 열면 이름칸이 비어 있고 시작일이 오늘이다', async ({ page }) => {
  await addHabit(page, '물 마시기', '2026-03-10')
  await expect(addForm(page)).toHaveCount(0)

  await addButton(page).click()
  await expect(addForm(page).getByLabel('이름')).toHaveValue('')
  await expect(addForm(page).getByLabel('시작일')).toHaveValue(TODAY)
  await addForm(page).getByLabel('이름').fill('책 읽기')
  await addForm(page).getByRole('button', { name: '등록', exact: true }).click()
  await expect(page.getByRole('heading', { level: 2, name: '책 읽기' })).toBeVisible()
  await expect(dayButton(page, TODAY)).toHaveClass(/day--start/)
  await expect(dayButton(page, YESTERDAY)).toBeDisabled()
})

test('등록 폼에서 취소하면 입력한 내용을 버리고 닫는다', async ({ page }) => {
  await addButton(page).click()
  await addForm(page).getByLabel('이름').fill('물 마시기')
  await addForm(page).getByLabel('시작일').fill('2026-03-10')
  await addForm(page).getByRole('button', { name: '취소' }).click()

  await expect(addForm(page)).toHaveCount(0)
  await expect(page.locator('.habit-item')).toHaveCount(0)

  await addButton(page).click()
  await expect(addForm(page).getByLabel('이름')).toHaveValue('')
  await expect(addForm(page).getByLabel('시작일')).toHaveValue(TODAY)
})

test('등록할 때 잘못된 시작일은 저장되지 않고 오류가 표시된다', async ({ page }) => {
  await addButton(page).click()
  const form = addForm(page)
  const nameInput = form.getByLabel('이름')
  const startInput = form.getByLabel('시작일')
  const submit = form.getByRole('button', { name: '등록', exact: true })
  await nameInput.fill('물 마시기')

  await startInput.fill('2026-03-19')
  await submit.click()
  await expect(form).toContainText('시작일은 오늘 이후로 정할 수 없어요.')

  await startInput.fill('1899-12-31')
  await submit.click()
  await expect(form).toContainText('시작일은 1900년 1월 1일 이후로 정해 주세요.')

  await startInput.fill('')
  await submit.click()
  await expect(form).toContainText('시작일을 입력해 주세요.')

  await expect(page.locator('.habit-item')).toHaveCount(0)

  // 이름과 시작일 오류를 함께 표시한다.
  await nameInput.fill('')
  await startInput.fill('2026-03-19')
  await submit.click()
  await expect(form).toContainText('습관 이름을 입력해 주세요.')
  await expect(form).toContainText('시작일은 오늘 이후로 정할 수 없어요.')
  await expect(page.locator('.habit-item')).toHaveCount(0)
})

test('상세에는 수정과 삭제 버튼만 있다', async ({ page }) => {
  await addHabit(page, '물 마시기')
  await expect(page.locator('.detail__header .button')).toHaveText(['수정', '삭제'])
})

test('수정에서 시작일을 앞당기면 그 달까지 이동해 체크할 수 있다', async ({ page }) => {
  await addHabit(page, '물 마시기')
  await editHabit(page, { startDate: '2026-02-10' })
  await expect(editForm(page)).toHaveCount(0)
  await expect(monthlyRate(page)).toHaveText('달성률 0% (0/18일)')

  await page.locator('.calendar__prev').click()
  await expect(page.getByRole('heading', { level: 3, name: '2026년 2월' })).toBeVisible()
  await expect(page.locator('.calendar__prev')).toBeDisabled()
  await expect(dayButton(page, '2026-02-10')).toHaveClass(/day--start/)
  await expect(dayButton(page, '2026-02-09')).toBeDisabled()
  await expect(monthlyRate(page)).toHaveText('달성률 0% (0/19일)')

  await dayButton(page, '2026-02-10').click()
  await expect(monthlyRate(page)).toHaveText('달성률 5% (1/19일)')
  await dayButton(page, '2026-02-10').click()

  // 보고 있던 달보다 시작일을 늦추면 시작일이 든 달을 보여준다.
  await editHabit(page, { startDate: MONTH_START })
  await expect(page.getByRole('heading', { level: 3, name: '2026년 3월' })).toBeVisible()
  await expect(page.locator('.calendar__prev')).toBeDisabled()
})

test('가장 이른 기록보다 늦거나 잘못된 시작일로는 바꿀 수 없다', async ({ page }) => {
  await seedHabit(page, ['2026-03-05', TODAY], MONTH_START)
  await page.getByRole('button', { name: '수정' }).click()
  const form = editForm(page)
  const input = form.getByLabel('시작일')
  const save = form.getByRole('button', { name: '저장' })

  await input.fill('2026-03-10')
  await save.click()
  await expect(form).toContainText('가장 이른 체크 기록(2026년 3월 5일 목요일)보다 늦게 정할 수 없어요.')

  await input.fill('2026-03-19')
  await save.click()
  await expect(form).toContainText('시작일은 오늘 이후로 정할 수 없어요.')

  await input.fill('')
  await save.click()
  await expect(form).toContainText('시작일을 입력해 주세요.')

  await input.fill('1899-12-31')
  await save.click()
  await expect(form).toContainText('시작일은 1900년 1월 1일 이후로 정해 주세요.')

  expect((await storedHabit(page)).createdDate).toBe(MONTH_START)

  // 가장 이른 기록 날짜까지는 미룰 수 있다.
  await input.fill('2026-03-05')
  await save.click()
  await expect(form).toHaveCount(0)
  await expect(dayButton(page, '2026-03-05')).toHaveClass(/day--start/)
  await expect(dayButton(page, '2026-03-04')).toBeDisabled()
})

test('수정으로 이름과 시작일을 한 번에 바꾸고 체크 기록은 유지한다', async ({ page }) => {
  await seedHabit(page, ['2026-03-10', TODAY], MONTH_START)
  await page.getByRole('button', { name: '수정' }).click()
  await expect(editForm(page).getByLabel('이름')).toHaveValue('물 마시기')
  await expect(editForm(page).getByLabel('시작일')).toHaveValue(MONTH_START)

  await editForm(page).getByLabel('이름').fill('물 2잔 마시기')
  await editForm(page).getByLabel('시작일').fill('2026-03-08')
  await editForm(page).getByRole('button', { name: '저장' }).click()

  await expect(editForm(page)).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 2, name: '물 2잔 마시기' })).toBeVisible()
  await expect(dayButton(page, '2026-03-08')).toHaveClass(/day--start/)
  await expect(dayButton(page, '2026-03-10')).toHaveClass(/--done/)
  await expect(dayButton(page, TODAY)).toHaveClass(/--done/)
  expect(await storedHabit(page)).toMatchObject({
    name: '물 2잔 마시기',
    createdDate: '2026-03-08',
    completedDates: ['2026-03-10', TODAY],
  })
})

test('수정에서 이름이나 시작일 중 하나라도 틀리면 아무것도 저장하지 않는다', async ({ page }) => {
  await addHabit(page, '책 읽기')
  await addHabit(page, '물 마시기', MONTH_START)
  await page.getByRole('button', { name: '수정' }).click()
  const form = editForm(page)
  const nameInput = form.getByLabel('이름')
  const startInput = form.getByLabel('시작일')
  const save = form.getByRole('button', { name: '저장' })

  // 이름은 맞고 시작일만 틀린 경우
  await nameInput.fill('물 2잔 마시기')
  await startInput.fill('2026-03-19')
  await save.click()
  await expect(form).toContainText('시작일은 오늘 이후로 정할 수 없어요.')

  // 시작일은 맞고 이름만 틀린 경우
  await nameInput.fill('책 읽기')
  await startInput.fill('2026-03-10')
  await save.click()
  await expect(form).toContainText('이미 같은 이름의 습관이 있어요.')

  // 둘 다 틀리면 두 오류를 함께 보여준다.
  await nameInput.fill('')
  await startInput.fill('')
  await save.click()
  await expect(form).toContainText('습관 이름을 입력해 주세요.')
  await expect(form).toContainText('시작일을 입력해 주세요.')

  await form.getByRole('button', { name: '취소' }).click()
  await expect(page.getByRole('heading', { level: 2, name: '물 마시기' })).toBeVisible()
  await expect(dayButton(page, MONTH_START)).toHaveClass(/day--start/)
  await expect(page.locator('.habit-item__name')).toHaveText(['책 읽기', '물 마시기'])
})

test('이름과 시작일을 그대로 저장하면 아무것도 바꾸지 않고 닫힌다', async ({ page }) => {
  await addHabit(page, '물 마시기')
  await editHabit(page, {})
  await expect(editForm(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: '수정' })).toBeVisible()
  expect(await storedHabit(page)).toMatchObject({ name: '물 마시기', createdDate: TODAY })
})

test('시작일보다 이른 기록이 있는 데이터는 불러올 때 시작일을 당기고, 다음 저장 때 반영한다', async ({ page }) => {
  await seedHabit(page, ['2026-03-05', '2026-03-06'], TODAY)

  await expect(dayButton(page, '2026-03-05')).toHaveClass(/day--start/)
  await expect(dayButton(page, '2026-03-05')).toHaveClass(/--done/)
  await expect(dayButton(page, '2026-03-06')).toHaveClass(/--done/)
  await expect(dayButton(page, '2026-03-04')).toBeDisabled()
  await expect(monthlyRate(page)).toHaveText('달성률 14% (2/14일)')
  expect((await storedHabit(page)).createdDate).toBe(TODAY)

  await todayToggle(page, '물 마시기').click()
  await expect(todayToggle(page, '물 마시기')).toHaveClass(/--done/)
  expect((await storedHabit(page)).createdDate).toBe('2026-03-05')
})

test('수정한 이름과 시작일은 새로고침해도 유지된다', async ({ page }) => {
  await addHabit(page, '물 마시기')
  await editHabit(page, { name: '물 2잔 마시기', startDate: '2026-03-10' })
  await expect(dayButton(page, '2026-03-10')).toHaveClass(/day--start/)

  await page.reload()

  await expect(page.getByRole('heading', { level: 2, name: '물 2잔 마시기' })).toBeVisible()
  await expect(dayButton(page, '2026-03-10')).toHaveClass(/day--start/)
  await expect(dayButton(page, '2026-03-09')).toBeDisabled()
})

test('시작일이 오늘보다 늦은 데이터는 모든 날짜를 막고 달성률 0% (0/0일)이다', async ({ page }) => {
  await seedHabit(page, [], '2026-03-20')

  await expect(page.getByRole('heading', { level: 3, name: '2026년 3월' })).toBeVisible()
  await expect(page.locator('.day:not(:disabled)')).toHaveCount(0)
  await expect(todayToggle(page, '물 마시기')).toBeDisabled()
  await expect(monthlyRate(page)).toHaveText('달성률 0% (0/0일)')
  await expect(page.locator('.calendar__prev')).toBeDisabled()
})

test('시작일이 오늘보다 늦어도 시작일을 그대로 두면 이름은 바꿀 수 있다', async ({ page }) => {
  await seedHabit(page, [], '2026-03-20')
  await editHabit(page, { name: '물 2잔 마시기' })

  await expect(editForm(page)).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 2, name: '물 2잔 마시기' })).toBeVisible()
  expect(await storedHabit(page)).toMatchObject({ name: '물 2잔 마시기', createdDate: '2026-03-20' })
})

test('저장에 실패하면 열려 있던 등록·수정 폼을 닫고 두 버튼을 비활성화한다', async ({ page }) => {
  await addHabit(page, '물 마시기')
  await page.getByRole('button', { name: '수정' }).click()
  await addButton(page).click()
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('저장 실패')
    }
  })

  await addForm(page).getByLabel('이름').fill('책 읽기')
  await addForm(page).getByRole('button', { name: '등록', exact: true }).click()

  await expect(addForm(page)).toHaveCount(0)
  await expect(editForm(page)).toHaveCount(0)
  await expect(addButton(page)).toBeDisabled()
  await expect(page.getByRole('button', { name: '수정' })).toBeDisabled()
  await expect(page.locator('.habit-item')).toHaveCount(1)
})
