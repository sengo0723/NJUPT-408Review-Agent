let reminderTimer: ReturnType<typeof setTimeout> | null = null
let reminderInterval: ReturnType<typeof setInterval> | null = null

export function startReminder(time: string) {
  stopReminder()
  const [h, m] = time.split(':').map(Number)
  const now = new Date()
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  const delay = target.getTime() - now.getTime()

  reminderTimer = setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('408考研助手', { body: '该复习啦！今日任务等你来完成~', icon: '/favicon.ico' })
    }
    // 24小时后再次提醒
    reminderInterval = setInterval(() => {
      if (Notification.permission === 'granted') {
        new Notification('408考研助手', { body: '该复习啦！今日任务等你来完成~', icon: '/favicon.ico' })
      }
    }, 24 * 60 * 60 * 1000)
  }, delay)
}

export function stopReminder() {
  if (reminderTimer) {
    clearTimeout(reminderTimer)
    reminderTimer = null
  }
  if (reminderInterval) {
    clearInterval(reminderInterval)
    reminderInterval = null
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}
