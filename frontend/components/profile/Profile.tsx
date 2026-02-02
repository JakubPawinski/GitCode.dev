'use client'
import { useAuth } from '@/contexts/auth/AuthContext'
import { UserImage } from '../user/UserImage'
import { useGetUserStats } from '@/hooks/api/use-get-user-stats'
import { Error } from '../error/Error'
import { Loader } from '../loading/Loader'

interface UserStatsProps {
  totalSubmissions: number
  successfulSubmissions: number
  successRate: number
  avgExecutionTime: number | null
  avgMemoryUsed: number | null
  problemsAttempted: number
  problemsSolved: number
}

export const Profile = () => {
  const { data } = useAuth()
  if (!data) return null

  const { user } = data
  const { id } = user

  const {
    data: statsData,
    error,
    loading,
  } = useGetUserStats<UserStatsProps>({ id })

  if (error) return <Error {...error} />
  if (loading) return <Loader />
  if (!statsData) return null

  console.log(statsData)
  const {
    totalSubmissions,
    successfulSubmissions,
    successRate,
    avgExecutionTime,
    avgMemoryUsed,
    problemsAttempted,
    problemsSolved,
  } = statsData

  return (
    <div>
      <section className="flex flex-col">
        <div className="flex flex-col">
          <div className="flex">
            <UserImage
              className="rounded-sm"
              src={user.avatarUrl}
              width={64}
              height={64}
            />
            <div>
              <div>{user.username}</div>
              <p>{user.email}</p>
            </div>
          </div>
          <button>Edit Profile</button>
        </div>
        <div>
          <div>
            <strong>Languages</strong>
          </div>
        </div>
        <div>
          <div>
            <strong>Skills</strong>
            <div>
              <div>
                <div></div>
                <div>Hard</div>
              </div>
              <div>
                <div></div>
                <div>Medium</div>
              </div>
              <div>
                <div></div>
                <div>Easy</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main>
        <header className="flex">
          <div></div>
          <div>
            <div className="flex flex-col">
              <div>Easy</div>
              <div></div>
            </div>
            <div className="flex flex-col">
              <div>Medium</div>
              <div></div>
            </div>
            <div className="flex flex-col">
              <div>Hard</div>
              <div></div>
            </div>
          </div>
        </header>
        <main>
          <header></header>
          <div>CALENDAR</div>
        </main>
      </main>
    </div>
  )
}
