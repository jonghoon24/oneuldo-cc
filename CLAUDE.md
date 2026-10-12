# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개요

"오늘도"는 매일 실천할 습관을 체크하는 단일 페이지 React 19 + Vite 웹앱이다. 서버, 라우터, 상태 관리 라이브러리 없이 모든 데이터를 브라우저 `localStorage`에 저장한다. UI 문구와 코드 주석, 커밋 메시지는 모두 한국어로 쓴다(UI 문구는 해요체).

새 라이브러리(npm 패키지)를 설치하거나 `package.json`에 의존성을 추가하기 전에는 반드시 먼저 사용자에게 물어본다.

1차 버전 스펙(`SPEC.md`)은 삭제되었지만 git 기록에 남아 있다: `git show fc34b05^:SPEC.md`

## 명령어

```sh
npm run dev        # 개발 서버
npm run build      # tsc --noEmit 후 vite build
npm run typecheck  # 타입 검사만
npm run lint       # ESLint 검사
npm run preview    # 빌드 결과 미리보기
```

- 테스트 러너는 없다. 변경 후 검증은 `npm run typecheck`와 `npm run lint`가 기본이다. ESLint 설정은 `eslint.config.js`(flat config)에 있고 `@eslint/js`·`typescript-eslint`·`react-hooks`·`react-refresh` 권장 규칙을 쓴다. `tsconfig.json`의 `noUnusedLocals`/`noUnusedParameters` 때문에 쓰지 않는 변수나 매개변수가 있으면 빌드가 실패한다.
- 개발 서버에서 `?mock`을 붙여 접속하면 저장소가 비어 있을 때 목 습관 4개를 채운다(`src/dev/mockData.ts`). 이미 데이터가 있으면 덮어쓰지 않으므로, 다시 채우려면 먼저 `localStorage`의 `oneuldo` 키를 지운다.

## 아키텍처

데이터 흐름은 `lib/storage.ts`(직렬화·검증) → `hooks/useHabitStore.ts`(상태와 변경 함수) → `App.tsx`(선택·포커스 관리) → `components/`(표시) 순서다.

### 저장소 (`src/lib/storage.ts`)
- 키 `oneuldo`에 `{ version: 1, habits: Habit[] }`를 JSON으로 저장한다. `habits` 배열 순서가 등록 순서다.
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
- 체크 가능한 날짜는 `date ≤ 오늘`이다. 등록일(`createdDate`) 이전 날짜도 체크할 수 있고 연속 일수에도 포함된다. 이 조건은 `toggleDate`와 `Calendar` UI 양쪽에서 막는다. 달력은 `1900-01`까지 거슬러 갈 수 있다.
- 현재 연속 일수(`lib/streak.ts`): 오늘이 체크되어 있으면 오늘부터, 아니면 어제부터 과거로 끊기지 않은 날을 센다.
- 습관 이름(`lib/habitName.ts`): trim 후 NFC 정규화, 줄바꿈 불가, 코드 포인트 기준 20자 이하, 정규화한 이름끼리 중복 불가. 저장소 로드 검증도 같은 함수를 쓴다.

### UI
- 선택한 습관은 저장하지 않는다. 선택이 없거나 사라지면 첫 습관을 보여준다. 삭제하면 다음(없으면 이전) 습관으로 선택과 포커스를 옮기고, 남은 습관이 없으면 추가 입력란으로 포커스를 옮긴다.
- 접근성을 꼼꼼히 챙긴다(`aria-pressed`, 날짜별 `aria-label`, `aria-live`, 비활성화 시 포커스 이동). 새 UI도 같은 수준을 맞춘다.
- 스타일은 `src/styles.css` 한 파일에 있다. `:root`의 CSS 변수와 BEM 형태의 클래스명(`calendar__title`, `day--done`)을 쓴다.
