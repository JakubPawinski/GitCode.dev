'use client'
import { TestCase } from './TestCase'
import { useState } from 'react'
import { FlaskConical } from 'lucide-react'

export interface TestCasesProps {
  testInputOutput: {
    input: string
    output: string
  }[]
}
export const TestCaseScreen = ({ testInputOutput }: TestCasesProps) => {
  const [activeTab, setActiveTab] = useState(0)

  const reducedTestCases =
    testInputOutput.length > 3 ? testInputOutput.slice(2) : testInputOutput

  return (
    <section className="text-foreground h-full p-4 shadow-lg">
      <header className="mb-3 flex items-center gap-2">
        <FlaskConical className="text-accent" />
        <div className="text-lg font-semibold">Test Cases</div>
      </header>
      <nav className="border-primary/20 flex border-b">
        {reducedTestCases.map((_, index) => (
          <button
            key={`tab-${index}`}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === index
                ? 'border-accent text-accent'
                : 'text-foreground/60 hover:text-foreground border-transparent'
            }`}
            onClick={() => setActiveTab(index)}
          >
            Case {index + 1}
          </button>
        ))}
      </nav>
      <main className="p-4">
        <div>
          <TestCase key={activeTab} testCase={reducedTestCases[activeTab]} />
        </div>
      </main>
    </section>
  )
}
