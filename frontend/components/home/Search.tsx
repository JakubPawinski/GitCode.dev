import { Search as SearchIcon } from 'lucide-react'
interface SearchProps {
  onQueryChange: (value: string) => void
}
export const Search = ({ onQueryChange }: SearchProps) => {
  return (
    <div className="flex items-center gap-2">
      <SearchIcon size={20} className="text-accent" />
      <input
        type="text"
        placeholder="Search questions..."
        onChange={(e) => onQueryChange(e.target.value)}
        className="text-foreground placeholder:text-foreground/40 w-48 bg-transparent font-medium focus:ring-0 focus:outline-none"
      />
    </div>
  )
}
