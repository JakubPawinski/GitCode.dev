interface MonthFormatProps {
  key: string
  label: string
  year: number
  days: { date: string; count: number }[]
}

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0]
}

const getMonthsData = ({
  activityHeatmap,
}: {
  activityHeatmap: {
    date: string
    submissions: number
    solved: number
  }[]
}) => {
  const heatmap = activityHeatmap
  const map = new Map<string, number>()

  heatmap.forEach((item: any) => {
    const dateKey = String(item.date).split('T')[0]
    const rawCount =
      item.count ?? item.submissions ?? item.totalSubmissions ?? item.value
    const count =
      typeof rawCount === 'number'
        ? rawCount
        : typeof rawCount === 'string'
          ? Number(rawCount)
          : 0
    if (!Number.isFinite(count) || count <= 0) return
    map.set(dateKey, (map.get(dateKey) || 0) + count)
  })

  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)

  const months: MonthFormatProps[] = []

  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(start.getFullYear(), start.getMonth() + i, 1)
    const year = monthDate.getFullYear()
    const monthIndex = monthDate.getMonth()
    const nextMonth = new Date(year, monthIndex + 1, 1)
    const daysInMonth = Math.round(
      (nextMonth.getTime() - monthDate.getTime()) / 86400000
    )

    const days: { date: string; count: number }[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day)
      const dateKey = formatDate(date)
      days.push({ date: dateKey, count: map.get(dateKey) || 0 })
    }
    months.push({
      key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
      label: monthDate.toLocaleString('en-US', { month: 'short' }),
      year,
      days,
    })
  }

  return { months, map }
}

export const monthFormat = ({
  activityHeatmap,
}: {
  activityHeatmap: {
    date: string
    submissions: number
    solved: number
  }[]
}) => {
  const now = new Date()

  const start = new Date(now.getFullYear(), 0, 1)

  const { months, map } = getMonthsData({ activityHeatmap })
  const MONTHS = 12

  for (let i = 0; i < MONTHS; i++) {
    const monthDate = new Date(start.getFullYear(), start.getMonth() + i, 1)
    const year = monthDate.getFullYear()
    const monthIndex = monthDate.getMonth()
    const nextMonth = new Date(year, monthIndex + 1, 1)
    const daysInMonth = Math.round(
      (nextMonth.getTime() - monthDate.getTime()) / 86400000
    )

    const days: { date: string; count: number }[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day)
      const dateKey = formatDate(date)
      days.push({ date: dateKey, count: map.get(dateKey) || 0 })
    }

    months.push({
      key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
      label: monthDate.toLocaleString('en-US', { month: 'short' }),
      year,
      days,
    })
  }
  const maxSubmissionsInView = months.reduce((acc, month) => {
    for (const day of month.days) {
      if (day.count > acc) acc = day.count
    }
    return acc
  }, 0)

  return { months, maxSubmissionsInView }
}
