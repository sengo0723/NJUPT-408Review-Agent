import dayjs from 'dayjs'

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const rm = m % 60
    return `${h}小时${rm}分${s}秒`
  }
  return `${m}分${s}秒`
}

export function getDaysUntil(dateStr: string): number {
  return dayjs(dateStr).diff(dayjs(), 'day')
}

export function getToday(): string {
  return dayjs().format('YYYY-MM-DD')
}

export function formatDateTime(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

export function formatDate(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD')
}
