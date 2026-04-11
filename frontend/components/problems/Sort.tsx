import { sortOrder, sortOrderType } from '@/consts/sort/sortOrder'
interface SortProps {
  selectedSortOrder: sortOrderType | ''
  onSortOrderChange: (value: sortOrderType | '') => void
}

export const Sort = ({ selectedSortOrder, onSortOrderChange }: SortProps) => {
  const defaultOrder = sortOrder[0]

  return (
    <div className="fixed" data-testid="sort-menu">
      <div className="border-primary/30 from-background/95 to-primary/10 absolute top-12 z-[100] min-w-[200px] rounded-xl border bg-gradient-to-b p-4 shadow-2xl backdrop-blur-xl">
        <select
          name="sortOrder"
          value={selectedSortOrder || defaultOrder}
          onChange={(e) => onSortOrderChange(e.target.value as sortOrderType)}
          className="border-primary/30 from-primary/10 to-accent/5 text-foreground focus:ring-primary/50 [&>option]:bg-background [&>option]:text-foreground w-full rounded-lg border bg-gradient-to-r p-2 shadow-md transition-all duration-300 hover:shadow-lg focus:ring-2 focus:outline-none"
        >
          {sortOrder.map((order) => (
            <option key={order} value={order}>
              {order}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
