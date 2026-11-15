import { useI18n } from '../i18n'

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const { t, formatNumber } = useI18n()
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={t('session.progress', {
        current: formatNumber(current),
        total: formatNumber(total),
      })}
    >
      <span style={{ width: `${percent}%` }} />
    </div>
  )
}
