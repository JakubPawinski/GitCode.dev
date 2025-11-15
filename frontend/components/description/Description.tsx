import { useGetTask } from '@/hooks/api/use-get-task'

interface DescriptionProps {
  taskNumber: number
  taskTitle: string
  taskDescription: string
  examples: {
    image?: string
    input: string
    output: string
    explanation: string
  }[]
  constraints: {
    example: string
  }[]
}

export const Description = ({ title }: { title: string }) => {
  const { data, loading, error } = useGetTask<DescriptionProps>({ title })
  if (loading) {
  }
  if (error) {
  }
  if (data) {
    const { taskNumber, taskTitle, taskDescription, examples, constraints } =
      data

    return (
      <div>
        <header>
          <div>
            <strong>
              {taskNumber}. {taskTitle}
            </strong>
          </div>
        </header>
        <nav>
          <div>{taskDescription}</div>
        </nav>
        <main>
          {examples.map((example, index) => (
            <div>
              <div>Example {index}</div>
              <div>Input: {example.input}</div>
              <div>Output: {example.output}</div>
              <div>Explanation: {example.explanation}</div>
            </div>
          ))}
        </main>
        <footer>
          <ul>
            Constrains:
            {constraints.map((constraint) => (
              <li>{constraint.example}</li>
            ))}
          </ul>
        </footer>
      </div>
    )
  }
}
