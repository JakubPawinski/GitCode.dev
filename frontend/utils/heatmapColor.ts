export const getHeatmapColor = ({
  count,
  maxCount,
}: {
  count: number
  maxCount: number
}) => {
  if (count === 0) return 'bg-gray-700/50'
  if (maxCount <= 0) return 'bg-gray-700/50'
  const ratio = count / maxCount
  if (ratio <= 0.25) return 'bg-emerald-900'
  if (ratio <= 0.5) return 'bg-emerald-700'
  if (ratio <= 0.75) return 'bg-emerald-500'
  return 'bg-emerald-400'
}
