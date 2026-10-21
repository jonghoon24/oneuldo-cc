# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개요

"오늘도"는 매일 실천할 습관을 체크하는 단일 페이지 React 19 + Vite 웹앱이다. 서버, 라우터, 상태 관리 라이브러리 없이 모든 데이터를 브라우저 `localStorage`에 저장한다. UI 문구와 코드 주석, 커밋 메시지는 모두 한국어로 쓴다(UI 문구는 해요체).

새 라이브러리(npm 패키지)를 설치하거나 `package.json`에 의존성을 추가하기 전에는 반드시 먼저 사용자에게 물어본다.

`SPEC.md`는 기능 하나를 구현하는 동안만 루트에 두는 임시 스펙이다. 커밋하지 않고 구현이 끝나면 삭제하므로, 오래 지켜야 할 규칙은 이 문서에 옮겨 적는다. 1차 버전 스펙만 git 기록에 남아 있다: `git show fc34b05^:SPEC.md`

## 명령어

```sh
npm run dev        # 개발 서버
npm run build      # tsc --noEmit 후 vite build
npm run typecheck  # 타입 검사만
npm run lint       # ESLint 검사
npm run preview    # 빌드 결과 미리보기
npm run test:e2e   # Playwright E2E 테스트 (예: npx playwright test -g "새로고침")
```

- 변경 후 검증은 `npm run typecheck`와 `npm run lint`가 기본이고, 동작이 바뀌는 변경이면 `npm run test:e2e`도 돌린다. 단위 테스트 러너는 없다. ESLint 설정은 `eslint.config.js`(flat config)에 있고 `@eslint/js`·`typescript-eslint`·`react-hooks`·`react-refresh` 권장 규칙을 쓴다. `tsconfig.json`의 `noUnusedLocals`/`noUnusedParameters` 때문에 쓰지 않는 변수나 매개변수가 있으면 빌드가 실패한다.
- E2E 테스트는 `e2e/`에 있고 Chromium만 쓴다. `playwright.config.ts`가 개발 서버를 5199 포트로 띄우며(이미 떠 있으면 재사용), 시간대를 `Asia/Seoul`로 고정한다. 각 테스트는 `page.clock.setFixedTime`으로 오늘을 2026-03-18(수) 정오로 고정해 어제·그제가 같은 달에 오게 한다. 등록한 습관의 어제·그제를 체크하려면 `addHabit(page, name, '2026-03-01')`처럼 시작일을 넘긴다. 날짜 칸은 `.day[data-date="2026-03-18"]`로, 등록 폼은 `.panel--list .habit-form`, 수정 폼은 `.detail .habit-form`으로, 오늘 토글은 습관 이름이 든 `.habit-item` 안의 `.today-toggle`로 찾고, 완료 여부는 `--done` 클래스로 확인한다. 처음 실행하는 환경에서는 `npx playwright install chromium`이 필요하다.
- `npm run typecheck`는 `src`만 검사한다(`tsconfig.json`의 `include`). `e2e/`와 `playwright.config.ts`는 타입 검사 대상이 아니고, `@types/node`가 없으므로 이 파일들에서 `process` 같은 Node 전역을 쓰지 않는다.
- 개발 서버에서 `?mock`을 붙여 접속하면 저장소가 비어 있을 때 목 습관 4개를 채운다(`src/dev/mockData.ts`). 이미 데이터가 있으면 덮어쓰지 않으므로, 다시 채우려면 먼저 `localStorage`의 `oneuldo` 키를 지운다.

## 아키텍처

데이터 흐름은 `lib/storage.ts`(직렬화·검증) → `hooks/useHabitStore.ts`(상태와 변경 함수) → `App.tsx`(선택·포커스 관리) → `components/`(표시) 순서다.

### 저장소 (`src/lib/storage.ts`)
- 키 `oneuldo`에 `{ version: 1, habits: Habit[] }`를 JSON으로 저장한다. `habits` 배열 순서가 등록 순서다.
- `Habit.createdDate`는 이름과 달리 **시작일**이다(저장 형식 호환을 위해 필드 이름 유지). 불러올 때 시작일보다 이른 체크 기록이 있으면 메모리에서 시작일을 가장 이른 기록으로 당기고, 이 보정만을 위해 저장하지는 않는다(다음 `commit` 때 함께 저장된다).
- 불러올 때 엄격하게 검증한다. 습관 하나라도 형식이 틀리거나 id·이름이 중복되면 전체 로드가 `parse` 오류가 된다. 자동 복구하지 않고 읽기 전용으로 막아 기존 데이터를 보호하는 것이 의도다.
- 데이터 구조를 바꾸면 `DATA_VERSION`과 `parseData`를 함께 손봐야 한다. 지금은 버전이 다르면 그대로 `parse` 오류가 된다.

### 상태 (`src/hooks/useHabitStore.ts`)
- 모든 변경은 `commit()`을 거친다. 먼저 `saveData`로 저장하고, 성공했을 때만 화면 상태를 바꾼다. 저장에 실패하면 이전 데이터를 유지한 채 `{ status: 'error', reason: 'write' }`가 된다.
- 상태가 `ready`가 아니면(`access`/`parse`/`write` 오류) `canEdit`이 false가 되어 모든 편집 UI가 비활성화되고, `ErrorBanner`의 "다시 불러오기"로만 복구한다.
- 연속 조작이 항상 최신 데이터를 기준으로 계산되도록 `stateRef`를 동기적으로 갱신한다. 새 변경 함수도 `stateRef.current`를 읽고 `commit`을 쓰는 패턴을 따른다.
- 다른 탭의 변경은 `storage` 이벤트로 다시 불러와 반영한다.

### 날짜 (`src/lib/date.ts`, `src/hooks/useToday.ts`)
- 날짜는 시간대 없는 현지 날짜 문자열 `YYYY-MM-DD`, 월은 `YYYY-MM`으로 다루며 문자열 비교로 순서를 판단한다. `toISOString()`(UTC)은 쓰지 말고 `lib/date.ts`의 헬퍼를 쓴다.
- `Date`는 DST 영향을 피하려고 정오(12시) 기준으로 만든다.
- "오늘"은 `useToday()`가 자정 타이머, 탭 재활성화, 60초 주기 확인으로 갱신한다. 컴포넌트는 `todayKey()`를 직접 부르지 말고 `today` prop을 받는다(검증용으로 store 안에서 쓰는 것은 예외).
- 달력은 월요일 시작이다.

### 도메인 규칙
- 체크 가능한 날짜는 `시작일(createdDate) ≤ date ≤ 오늘`이다. 이 조건은 `isCheckableDate`(`lib/startDate.ts`) 하나로 표현하고 `toggleDate`와 `Calendar`·`HabitList` UI 양쪽에서 막는다. 달력은 시작일이 든 달까지만 거슬러 갈 수 있다.
- 시작일(`lib/startDate.ts`): `1900-01-01` 이상, 오늘 이하, 가장 이른 체크 기록 이하. 습관 목록의 '습관 등록'으로 여는 등록 폼(초기값 오늘)에서 정하거나 상세의 '수정'에서 이름과 함께 바꾼다(`editHabit`, 둘 중 하나라도 틀리면 아무것도 저장하지 않는다). 두 폼은 `components/HabitForm.tsx` 하나를 제출 버튼 이름만 바꿔 쓴다.
- 현재 연속 일수(`lib/streak.ts`): 오늘이 체크되어 있으면 오늘부터, 아니면 어제부터 과거로 끊기지 않은 날을 센다.
- 월간 달성률(`lib/monthlyRate.ts`): 달력에서 보고 있는 달 기준으로 `체크한 날 수 ÷ 체크할 수 있었던 날 수`를 반올림한 정수 퍼센트로 표시한다. 분모는 그 달 1일(시작일이 든 달이면 시작일)부터 말일과 오늘 중 이른 날까지(오늘은 체크 여부와 관계없이 포함)다. 기기 날짜를 되돌려 시작일이 오늘보다 늦으면 0/0이고 모든 날짜가 막힌다.
- 습관 이름(`lib/habitName.ts`): trim 후 NFC 정규화, 줄바꿈 불가, 코드 포인트 기준 20자 이하, 정규화한 이름끼리 중복 불가. 저장소 로드 검증도 같은 함수를 쓴다.

### UI
- 선택한 습관은 저장하지 않는다. 선택이 없거나 사라지면 첫 습관을 보여준다. 삭제하면 다음(없으면 이전) 습관을 선택한다.
- 등록 폼과 수정 폼은 열린 상태를 각각 `App`과 `HabitDetail`이 들고, `canEdit`이 false가 되면 닫는다.
- 스크린 리더 대응(`aria-*`, `role`, 숨김 텍스트)과 키보드 전용 조작·포커스 관리는 스펙 범위 밖이라 넣지 않는다. 버튼·`label`·`dialog` 같은 기본 HTML 요소는 그대로 쓴다.
- 화면은 '오늘 체크'가 먼저다. 오늘 날짜와 습관별 체크 원(`.today-toggle`)이 왼쪽(좁은 화면은 위)에, 선택한 습관의 기록지(연속 일수·달력)가 오른쪽(아래)에 온다. 선택한 습관 행은 기록지와 같은 바탕색으로 잇는다.
- 디자인은 '형광펜으로 칠하는 플래너'다. 형광펜 노랑(`--color-highlight`)은 완료 표시(오늘 체크 원, 달력의 체크한 날)에만 쓴다. 달력은 범례 없이 읽히게 한다: 체크한 날은 노랗게 칠하고 같은 주에 이어진 날은 `day--join-prev`/`day--join-next`로 한 줄로 잇고, 오늘·시작일은 칸 안의 '오늘'/'시작' 글자로, 체크할 수 없는 날은 흐린 숫자로 보여준다.
- 스타일은 `src/styles.css` 한 파일에 있다. `:root`의 CSS 변수와 BEM 형태의 클래스명(`calendar__title`, `day--done`)을 쓴다.
