import { db } from '../db'
import dayjs from 'dayjs'

interface BackupData {
  version: number
  exportDate: string
  tables: Record<string, unknown[]>
  localStorageData: Record<string, string>
}

const TABLE_NAMES = [
  'questions', 'answerRecords', 'errorBook', 'aiConversations', 'aiMessages',
  'aiMemories', 'studyPlans', 'dailyTasks', 'flashcards', 'mockExamRecords',
  'favorites', 'notes', 'focusRecords', 'knowledgeProgress',
] as const

export async function exportAllData(): Promise<void> {
  const tables: Record<string, unknown[]> = {}
  for (const name of TABLE_NAMES) {
    tables[name] = await (db as unknown as Record<string, { toArray: () => Promise<unknown[]> }>)[name]?.toArray?.() || []
  }

  const localStorageData: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) localStorageData[key] = localStorage.getItem(key) || ''
  }

  const backup: BackupData = {
    version: 1,
    exportDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    tables,
    localStorageData,
  }

  downloadJSON(backup, `408_backup_${dayjs().format('YYYYMMDD_HHmmss')}.json`)
}

export async function importAllData(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text()
    const backup: BackupData = JSON.parse(text)

    if (!backup.version || !backup.tables) {
      return { success: false, message: '无效的备份文件格式' }
    }

    // 校验关键表数据格式
    const REQUIRED_TABLES = ['questions', 'answerRecords', 'errorBook', 'flashcards']
    for (const name of REQUIRED_TABLES) {
      if (backup.tables[name] && !Array.isArray(backup.tables[name])) {
        return { success: false, message: `备份文件中 ${name} 数据格式错误` }
      }
    }

    for (const name of TABLE_NAMES) {
      const table = (db as unknown as Record<string, { clear: () => Promise<void>; bulkAdd: (data: unknown[]) => Promise<unknown> }>)[name]
      if (table && backup.tables[name]) {
        await table.clear()
        if (backup.tables[name].length > 0) {
          const validData = backup.tables[name].filter((item: unknown) => item != null && typeof item === 'object')
          if (validData.length > 0) {
            await table.bulkAdd(validData)
          }
        }
      }
    }

    if (backup.localStorageData) {
      for (const [key, value] of Object.entries(backup.localStorageData)) {
        localStorage.setItem(key, value)
      }
    }

    return { success: true, message: `成功导入备份（${backup.exportDate}）` }
  } catch (err) {
    return { success: false, message: `导入失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function exportPartialData(tables: string[]): Promise<void> {
  const data: Record<string, unknown[]> = {}
  for (const name of tables) {
    const table = (db as unknown as Record<string, { toArray: () => Promise<unknown[]> }>)[name]
    if (table?.toArray) {
      data[name] = await table.toArray()
    }
  }

  const backup = {
    version: 1,
    exportDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    tables: data,
    localStorageData: {},
  }

  downloadJSON(backup, `408_partial_${dayjs().format('YYYYMMDD_HHmmss')}.json`)
}

export async function getDBStats(): Promise<Record<string, number>> {
  const stats: Record<string, number> = {}
  for (const name of TABLE_NAMES) {
    const table = (db as unknown as Record<string, { count: () => Promise<number> }>)[name]
    if (table?.count) {
      stats[name] = await table.count()
    }
  }
  return stats
}

export async function clearTable(name: string): Promise<void> {
  const table = (db as unknown as Record<string, { clear: () => Promise<void> }>)[name]
  if (table?.clear) {
    await table.clear()
  }
}

export async function clearAllData(): Promise<void> {
  for (const name of TABLE_NAMES) {
    await clearTable(name)
  }
  localStorage.clear()
}

function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
