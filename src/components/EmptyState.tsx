type Props = {
  disabled: boolean
  onStart: () => void
}

export function EmptyState({ disabled, onStart }: Props) {
  return (
    <section className="empty-state">
      <h2 className="empty-state__title">아직 등록한 습관이 없어요</h2>
      <ul className="empty-state__features">
        <li>매일 실천할 습관을 등록해요.</li>
        <li>날짜별로 완료 여부를 체크하고, 지난 날짜도 고칠 수 있어요.</li>
        <li>현재 연속 실천 일수와 월별 달력으로 진행 상황을 확인해요.</li>
      </ul>
      <button type="button" className="button button--primary" onClick={onStart} disabled={disabled}>
        첫 습관 등록하기
      </button>
    </section>
  )
}
