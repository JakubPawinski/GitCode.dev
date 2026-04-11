import { render, screen, fireEvent } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import { Profile } from '@/components/user/Profile'
import { useAuth } from '@/contexts/auth/AuthContext'
import { useGetUserStats } from '@/hooks/api/profile/use-get-user-stats'
import { useGetRepository } from '@/hooks/github/use-get-repository'
import { usePostCreateRepository } from '@/hooks/github/use-post-create-repository'

// Mock the hooks
vi.mock('@/contexts/auth/AuthContext')
vi.mock('@/hooks/api/profile/use-get-user-stats')
vi.mock('@/hooks/github/use-get-repository')
vi.mock('@/hooks/github/use-post-create-repository')
vi.mock('next/navigation', () => ({
  usePathname: () => '/profile/testuser',
}))

const mockUseAuth = useAuth as vi.Mock
const mockUseGetUserStats = useGetUserStats as vi.Mock
const mockUseGetRepository = useGetRepository as vi.Mock
const mockUsePostCreateRepository = usePostCreateRepository as vi.Mock

const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  email: 'john.doe@example.com',
  avatarUrl: 'https://example.com/avatar.png',
}

const mockStatsData = {
  totalSubmissions: 100,
  successRate: 85,
  performanceMetrics: { avgExecutionTime: 120, avgMemoryUsed: 256 },
  problemsAttempted: 50,
  problemsSolved: 42,
  activityHeatmap: [],
  streak: { currentStreak: 10 },
  difficultyBreakdown: { easy: 20, medium: 15, hard: 7 },
  languageStats: { javascript: 30, python: 12 },
  topicStats: { arrays: 10, 'dynamic programming': 5 },
  consistencyScore: 123,
}

const mockRepoData = {
  name: 'my-repo',
  htmlUrl: 'https://github.com/johndoe/my-repo',
}

test('Profile renders correctly with user data', () => {
  mockUseAuth.mockReturnValue({ data: { user: mockUser } })
  mockUseGetUserStats.mockReturnValue({
    data: mockStatsData,
    error: null,
    loading: false,
  })
  mockUseGetRepository.mockReturnValue({
    data: mockRepoData,
    loading: false,
    error: null,
  })
  mockUsePostCreateRepository.mockReturnValue({
    postMutation: vi.fn(),
    data: null,
    error: null,
    loading: false,
  })

  render(<Profile />)

  expect(screen.getByText('johndoe')).toBeInTheDocument()
  expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
  expect(screen.getByText('Rank #123')).toBeInTheDocument()
  expect(screen.getByText('Streak: 10 🔥')).toBeInTheDocument()
  expect(screen.getByAltText('user-image')).toHaveAttribute(
    'src',
    'https://example.com/avatar.png'
  )
})

test('Profile renders loader while loading', () => {
  mockUseAuth.mockReturnValue({ data: { user: mockUser } })
  mockUseGetUserStats.mockReturnValue({
    data: null,
    error: null,
    loading: true,
  })
  mockUseGetRepository.mockReturnValue({
    data: mockRepoData,
    loading: false,
    error: null,
  })
  mockUsePostCreateRepository.mockReturnValue({
    postMutation: vi.fn(),
    data: null,
    error: null,
    loading: false,
  })

  render(<Profile />)

  expect(screen.getByRole('status')).toBeInTheDocument()
})

test('Profile renders error message on error', () => {
  mockUseAuth.mockReturnValue({ data: { user: mockUser } })
  mockUseGetUserStats.mockReturnValue({
    data: null,
    error: { message: 'Failed to fetch stats' },
    loading: false,
  })
  mockUseGetRepository.mockReturnValue({
    data: mockRepoData,
    loading: false,
    error: null,
  })
  mockUsePostCreateRepository.mockReturnValue({
    postMutation: vi.fn(),
    data: null,
    error: null,
    loading: false,
  })

  render(<Profile />)

  expect(screen.getByText('Failed to fetch stats')).toBeInTheDocument()
})

test('Profile renders null if no user data', () => {
  mockUseAuth.mockReturnValue({ data: null })
  const { container } = render(<Profile />)
  expect(container.firstChild).toBeNull()
})
