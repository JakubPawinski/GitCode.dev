import { RotateCcw, CircleAlert, FileSliders } from 'lucide-react'
import { useState } from 'react'
import { Funnel } from 'lucide-react'
import { Difficulties, DifficultyType } from '@/consts/filters/difficulty'
import { availableTopics } from '@/consts/problem/topics'
export interface FilterProps {
  selectedDifficulty: DifficultyType | ''
  selectedTopic: string
  onDifficultyChange: (value: '' | DifficultyType) => void
  onTopicChange: (value: string) => void
  onReset?: () => void
}

export const Filter = ({
  selectedDifficulty,
  selectedTopic,
  onDifficultyChange,
  onTopicChange,
  onReset,
}: FilterProps) => {
  const [filterClicked, setFilterClicked] = useState<boolean>(false)
  return (
    <div className="relative">
      <button
        onClick={() => setFilterClicked((previous: boolean) => !previous)}
        className="text-foreground hover:text-accent flex items-center gap-2 transition-all duration-300"
      >
        <Funnel size={20} />
        <span className="font-semibold">Filter</span>
      </button>
      {filterClicked && (
        <div className="border-primary/30 from-background/95 to-primary/10 absolute top-14 right-0 z-[100] max-w-[280px] min-w-[280px] rounded-xl border bg-gradient-to-b p-3 shadow-2xl backdrop-blur-xl">
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="text-accent flex items-center gap-2 text-xs font-semibold">
                <CircleAlert size={14} />
                <span>Difficulty</span>
              </div>
              <select
                name="difficulty"
                value={selectedDifficulty}
                onChange={(e) =>
                  onDifficultyChange(e.target.value as DifficultyType)
                }
                className="border-primary/30 from-primary/10 to-accent/5 text-foreground focus:ring-primary/50 [&>option]:bg-background [&>option]:text-foreground w-full rounded-lg border bg-gradient-to-r p-1.5 text-sm shadow-md transition-all duration-300 hover:shadow-lg focus:ring-2 focus:outline-none"
              >
                <option value="">All</option>
                {Difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <div className="text-accent flex items-center gap-2 text-xs font-semibold">
                <FileSliders size={14} />
                <span>Topics</span>
              </div>
              <select
                name="topic"
                value={selectedTopic}
                onChange={(e) => onTopicChange(e.target.value)}
                className="border-primary/30 from-primary/10 to-accent/5 text-foreground focus:ring-primary/50 [&>option]:bg-background [&>option]:text-foreground custom-scrollbar w-full rounded-lg border bg-gradient-to-r p-1 text-sm shadow-md transition-all duration-300 focus:ring-2 focus:outline-none [&>option]:p-1.5"
              >
                <option value="">All</option>
                {availableTopics?.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={onReset}
            className="from-primary/20 to-accent/20 text-foreground hover:from-primary/30 hover:to-accent/30 mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r p-1.5 text-sm font-semibold shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      )}
    </div>
  )
}
