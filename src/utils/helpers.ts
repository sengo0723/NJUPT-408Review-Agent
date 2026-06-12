export const SUBJECT_NAMES: Record<string, string> = {
  'data-structure': '数据结构',
  'computer-organization': '计算机组成原理',
  'os': '操作系统',
  'network': '计算机网络',
}

export const SUBJECT_COLORS: Record<string, string> = {
  'data-structure': '#1677ff',
  'computer-organization': '#5B9A6F',
  'os': '#C4956A',
  'network': '#722ed1',
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: '简单',
  2: '较易',
  3: '中等',
  4: '较难',
  5: '困难',
}

export const ERROR_TAG_OPTIONS = [
  '概念混淆',
  '计算失误',
  '审题不清',
  '知识点遗忘',
  '题意理解错误',
  '方法不当',
]

export const MEMORY_CATEGORY_LABELS: Record<string, string> = {
  'weakness': '薄弱知识点',
  'mastered': '已掌握',
  'preference': '学习偏好',
  'error-pattern': '常见错误',
}

export const MEMORY_CATEGORY_COLORS: Record<string, string> = {
  'weakness': '#C45D5D',
  'mastered': '#5B9A6F',
  'preference': '#C4956A',
  'error-pattern': '#D4A574',
}

export const CHAPTER_NAMES: Record<string, string> = {
  'ds-ch1': '基本概念',
  'ds-ch2': '线性表',
  'ds-ch3': '栈、队列和数组',
  'ds-ch4': '树和二叉树',
  'ds-ch5': '图',
  'ds-ch6': '查找',
  'ds-ch7': '排序',
  'co-ch1': '计算机系统概述',
  'co-ch2': '数据的表示和运算',
  'co-ch3': '存储系统',
  'co-ch4': '指令系统',
  'co-ch5': '中央处理器',
  'co-ch6': '总线',
  'co-ch7': '输入输出系统',
  'os-ch1': '操作系统概述',
  'os-ch2': '进程管理',
  'os-ch3': '内存管理',
  'os-ch4': '文件管理',
  'os-ch5': 'I/O管理',
  'net-ch1': '概述',
  'net-ch2': '物理层与数据链路层',
  'net-ch3': '网络层',
  'net-ch4': '传输层',
  'net-ch5': '应用层',
}

export const SUBJECT_CHAPTERS: Record<string, string[]> = {
  'data-structure': ['ds-ch1', 'ds-ch2', 'ds-ch3', 'ds-ch4', 'ds-ch5', 'ds-ch6', 'ds-ch7'],
  'computer-organization': ['co-ch1', 'co-ch2', 'co-ch3', 'co-ch4', 'co-ch5', 'co-ch6', 'co-ch7'],
  'os': ['os-ch1', 'os-ch2', 'os-ch3', 'os-ch4', 'os-ch5'],
  'network': ['net-ch1', 'net-ch2', 'net-ch3', 'net-ch4', 'net-ch5'],
}

export const VALID_SUBJECTS = ['data-structure', 'computer-organization', 'os', 'network', 'general']

export const VALID_CHAPTERS = Object.keys(CHAPTER_NAMES)
