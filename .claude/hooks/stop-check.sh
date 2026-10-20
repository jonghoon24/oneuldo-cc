#!/bin/bash
# 응답을 마칠 때(Stop) 바뀐 파일이 있으면 typecheck와 lint를 돌린다.
# 실패하면 exit 2로 종료를 막고, 에러 내용을 stderr로 Claude에게 돌려줘 고치게 한다.

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

# 커밋되지 않은 변경(추적되지 않는 파일 포함)이 없으면 검사하지 않는다.
if [ -z "$(git status --porcelain 2>/dev/null)" ]; then
  exit 0
fi

failed=0
report=""

if ! out=$(npm run --silent typecheck 2>&1); then
  failed=1
  report+=$'## npm run typecheck 실패\n'"$out"$'\n\n'
fi

if ! out=$(npm run --silent lint 2>&1); then
  failed=1
  report+=$'## npm run lint 실패\n'"$out"$'\n\n'
fi

if [ "$failed" -eq 1 ]; then
  {
    echo "바뀐 파일이 있어 검사를 돌렸는데 통과하지 못했어요. 아래 에러를 고친 뒤 다시 마무리하세요."
    echo
    printf '%s' "$report"
  } >&2
  exit 2
fi

exit 0
