import { RotateCcw, CircleAlert, FileSliders, Search } from 'lucide-react'

export interface FilterProps {
  query?: string
  difficulties?: string[]
  topics?: string[]
  selectedDifficulty: string
  selectedTopic: string
  onQueryChange: (value: string) => void
  onDifficultyChange: (value: string) => void
  onTopicChange: (value: string) => void
  onReset?: () => void
}

export const Filter = ({
  difficulties,
  topics,
  selectedDifficulty,
  selectedTopic,
  onQueryChange,
  onDifficultyChange,
  onTopicChange,
  onReset,
}: FilterProps) => {
  return (
    <div>
      <div>
        <div>
          <div>
            <Search />
            <input
              type="text"
              placeholder="Search questions"
              onChange={(e) => onQueryChange(e.target.value)}
            />
          </div>
        </div>
        <div>
          <div>
            <CircleAlert />
            <div>Difficulty</div>
          </div>
          <select
            name="difficulty"
            value={selectedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
          >
            <option value="">All</option>
            {difficulties?.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div>
            <FileSliders />
            <div>Topics</div>
          </div>
          <select
            name="topic"
            value={selectedTopic}
            onChange={(e) => onTopicChange(e.target.value)}
          >
            <option value="">All</option>
            {topics?.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <RotateCcw />
        <button onClick={onReset}>Reset</button>
      </div>
    </div>
  )
}
