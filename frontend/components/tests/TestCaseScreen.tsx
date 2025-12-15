'use client'
import { TestCase } from './TestCase'
import { useState } from 'react'
import { FlaskConical } from 'lucide-react'

export interface TestCasesProps {
  testCases: {
    input: string
    expectedOutput: string
  }[]
}
export const TestCaseScreen = ({ testCases }: TestCasesProps) => {
  const [activeTab, setActiveTab] = useState(0)

  if (!testCases || testCases.length === 0) {
    return null
  }

  const displayedTestCases = testCases.slice(0, 3)

  return (
    <section className="text-foreground h-full p-4 shadow-lg">
      <header className="mb-3 flex items-center gap-2">
        <FlaskConical className="text-accent" />
        <div className="text-lg font-semibold">Test Cases</div>
      </header>
      <nav className="border-primary/20 flex gap-1 border-b">
        {displayedTestCases.map((_, index) => (
          <button
            key={`tab-${index}`}
            type="button"
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === index
                ? 'border-accent text-accent'
                : 'text-foreground/60 hover:text-foreground hover:bg-primary/10 border-transparent'
            }`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setActiveTab(index)
            }}
          >
            Case {index + 1}
          </button>
        ))}
      </nav>
      <main
        className="custom-scrollbar overflow-y-auto p-4"
        style={{ maxHeight: 'calc(100% - 120px)' }}
      >
        <TestCase testCase={displayedTestCases[activeTab]} />
      </main>
    </section>
  )
}
