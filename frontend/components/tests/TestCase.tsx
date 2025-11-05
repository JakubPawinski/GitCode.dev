interface TestCaseProps {
  testCase: {
    [key: string]: string
  }
}
export const TestCase = ({ testCase }: TestCaseProps) => {
  return (
    <div className="flex items-center gap-1">
      <span className="font-medium">{testCase.key} = </span>
      <span className="font-semibold">{testCase.value}</span>
    </div>
  )
}
