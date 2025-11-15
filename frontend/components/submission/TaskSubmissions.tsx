import { availableLanguages } from '@/consts/editor/languages'
import { useGetSubmission } from '@/hooks/api/use-get-submission'

interface TaskSubmissionsProps {
  submissions: {
    attempt: number
    status: {
      state: string
      submissionDate: Date
    }
    language: string
    runtime: number
    memory: number
  }[]
}
export const TaskSubmissions = ({ title }: { title: string }) => {
  const { data, loading, error } = useGetSubmission<TaskSubmissionsProps>({
    title,
  })
  if (loading) {
  }
  if (error) {
  }
  if (data) {
    const { submissions } = data
    return (
      <div>
        <nav>
          <select name="language" defaultValue={availableLanguages[0]}>
            {availableLanguages.map((language) => (
              <option key={language}>{language}</option>
            ))}
          </select>
          <div>Runtime</div>
          <div>Memory</div>
        </nav>
        <main>
          {submissions.map((submission) => (
            <div key={submission.attempt}>
              <div>
                <div>{submission.attempt}</div>
                <div>
                  <div>{submission.status.state}</div>
                  <div>{submission.status.submissionDate.toString()}</div>
                </div>
              </div>
              <div>
                <div>{submission.language}</div>
                <div>
                  <div>{submission.runtime}</div>
                </div>
                <div>
                  <div>{submission.memory}</div>
                </div>
              </div>
            </div>
          ))}
        </main>
      </div>
    )
  }
}
