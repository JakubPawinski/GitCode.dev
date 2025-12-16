interface TestCaseProps {
  testCase: {
    input: string
    expectedOutput: string
  }
}

const formatInput = (input: string) => {
  try {
    const parsed = JSON.parse(input)
    return Object.entries(parsed)
      .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
      .join(', ')
  } catch {
    return input
  }
}

const formatOutput = (output: string) => {
  try {
    const parsed = JSON.parse(output)
    return JSON.stringify(parsed)
  } catch {
    return output
  }
}

export const TestCase = ({ testCase }: TestCaseProps) => {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-foreground/60 mb-1 text-sm font-medium">
          Input:
        </div>
        <code className="bg-primary/10 text-foreground block rounded-md p-4 font-mono text-sm">
          {formatInput(testCase.input)}
        </code>
      </div>
      <div>
        <div className="text-foreground/60 mb-1 text-sm font-medium">
          Expected Output:
        </div>
        <code className="bg-primary/10 text-accent block rounded-md p-4 font-mono text-sm font-semibold">
          {formatOutput(testCase.expectedOutput)}
        </code>
      </div>
    </div>
  )
}
