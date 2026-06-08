export function calculateNextReview(errorCount: number, isCorrect: boolean): { nextDate: Date; mastered: boolean } {
  const now = new Date()

  if (isCorrect) {
    // 之前错越多，需要更多次答对才能确认掌握
    if (errorCount === 0) {
      return { nextDate: addDays(now, 30), mastered: true }
    }
    if (errorCount <= 2) {
      // 错1-2次，先短间隔确认
      return { nextDate: addDays(now, 7), mastered: false }
    }
    // 错很多次，需要更谨慎
    return { nextDate: addDays(now, 3), mastered: false }
  }

  const intervals = [3, 7, 15, 30]
  const idx = Math.min(errorCount, intervals.length) - 1
  return { nextDate: addDays(now, intervals[idx]), mastered: false }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
