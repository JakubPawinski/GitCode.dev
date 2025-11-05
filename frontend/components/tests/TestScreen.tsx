import { ClipLoader } from 'react-spinners'
import { TestCase } from './TestCase'
import { useState } from 'react'

interface TestCasesProps {
  data: {
    testCases: {
      [key: string]: string
    }[]
  }[]
  loading: boolean
  error: any
}
export const TestScreen = ({ data, loading, error }: TestCasesProps) => {
  const [activeTab, setActiveTab] = useState(0)
  if (loading) {
    return <ClipLoader />
  }
  return (
    <section className="rounded-lg bg-white p-4 text-black shadow">
      <header className="flex border-b">
        {data.map((_, index) => (
          <button
            key={`tab-${index}`}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === index
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(index)}
          >
            Case {index + 1}
          </button>
        ))}
      </header>
      <main className="p-4">
        <div>
          {data[activeTab]?.testCases.map((testCase, index) => (
            <TestCase key={`${testCase.key}-${index}`} testCase={testCase} />
          ))}
        </div>
      </main>
    </section>
  )
}
