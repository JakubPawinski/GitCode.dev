import { sortOrder, sortOrderType } from '@/consts/sort/sortOrder'
import { ArrowDownUp } from 'lucide-react'
import { useState } from 'react'
interface SortProps {
  selectedSortOrder: sortOrderType | ''
  onSortOrderChange: (value: sortOrderType | '') => void
}

export const Sort = ({ selectedSortOrder, onSortOrderChange }: SortProps) => {
  const [sortClicked, setSortClicked] = useState<boolean>(false)

  const defaultOrder = sortOrder[0]

  return (
    <div className="relative">
      <button
        onClick={() => setSortClicked((previous: boolean) => !previous)}
        className="text-foreground hover:text-accent flex items-center gap-2 transition-all duration-300"
      >
        <ArrowDownUp size={20} />
        <span className="font-semibold">Sort</span>
      </button>
      {sortClicked && (
        <div className="border-primary/30 from-background/95 to-primary/10 absolute top-12 right-0 z-[100] min-w-[200px] rounded-xl border bg-gradient-to-b p-4 shadow-2xl backdrop-blur-xl">
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
      )}
    </div>
  )
}
