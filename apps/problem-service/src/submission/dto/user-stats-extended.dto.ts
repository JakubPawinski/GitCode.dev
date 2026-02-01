import { ApiProperty } from '@nestjs/swagger';

// ===== SUB-DTOs =====

export class DifficultyBreakdownDto {
  @ApiProperty({ example: 25, description: 'Number of easy problems solved' })
  easy: number;

  @ApiProperty({ example: 15, description: 'Number of medium problems solved' })
  medium: number;

  @ApiProperty({ example: 5, description: 'Number of hard problems solved' })
  hard: number;

  @ApiProperty({ example: 45, description: 'Total problems solved' })
  total: number;
}

export class DifficultyPercentageDto {
  @ApiProperty({ example: 55.5, description: 'Percentage of easy problems solved' })
  easy: number;

  @ApiProperty({ example: 33.3, description: 'Percentage of medium problems solved' })
  medium: number;

  @ApiProperty({ example: 11.2, description: 'Percentage of hard problems solved' })
  hard: number;
}

export class TopicStatsDto {
  @ApiProperty({ example: 'Array', description: 'Topic name' })
  topic: string;

  @ApiProperty({ example: 15, description: 'Problems solved in this topic' })
  solved: number;

  @ApiProperty({ example: 20, description: 'Problems attempted in this topic' })
  attempted: number;

  @ApiProperty({ example: 75.0, description: 'Success rate for this topic' })
  successRate: number;

  @ApiProperty({ example: 120.5, description: 'Average execution time in ms' })
  avgExecutionTime: number | null;
}

export class LanguageStatsDto {
  @ApiProperty({ example: 'python', description: 'Programming language' })
  language: string;

  @ApiProperty({ example: 30, description: 'Number of submissions in this language' })
  submissions: number;

  @ApiProperty({ example: 25, description: 'Successful submissions in this language' })
  successful: number;

  @ApiProperty({ example: 83.3, description: 'Success rate for this language' })
  successRate: number;

  @ApiProperty({ example: 115.2, description: 'Average execution time in ms' })
  avgExecutionTime: number | null;

  @ApiProperty({ example: 42.5, description: 'Average memory usage in MB' })
  avgMemoryUsed: number | null;
}

export class StreakDto {
  @ApiProperty({ example: 7, description: 'Current consecutive days streak' })
  currentStreak: number;

  @ApiProperty({ example: 21, description: 'Longest consecutive days streak' })
  longestStreak: number;

  @ApiProperty({ example: '2026-01-31', description: 'Last activity date' })
  lastActivityDate: string | null;

  @ApiProperty({ example: true, description: 'Whether user was active today' })
  activeToday: boolean;
}

export class ActivityHeatmapDto {
  @ApiProperty({ example: '2026-01-15', description: 'Date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ example: 5, description: 'Number of submissions on this date' })
  submissions: number;

  @ApiProperty({ example: 3, description: 'Number of problems solved on this date' })
  solved: number;
}

export class WeeklyActivityDto {
  @ApiProperty({ example: 0, description: 'Day of week (0=Sunday, 6=Saturday)' })
  dayOfWeek: number;

  @ApiProperty({ example: 'Sunday', description: 'Day name' })
  dayName: string;

  @ApiProperty({ example: 12, description: 'Total submissions on this day' })
  totalSubmissions: number;

  @ApiProperty({ example: 8, description: 'Successful submissions on this day' })
  successfulSubmissions: number;
}

export class HourlyActivityDto {
  @ApiProperty({ example: 14, description: 'Hour of day (0-23)' })
  hour: number;

  @ApiProperty({ example: 25, description: 'Total submissions at this hour' })
  submissions: number;
}

export class AIFeedbackStatsDto {
  @ApiProperty({ example: 12, description: 'Bug-related feedbacks' })
  bug: number;

  @ApiProperty({ example: 8, description: 'Performance-related feedbacks' })
  performance: number;

  @ApiProperty({ example: 3, description: 'Security-related feedbacks' })
  security: number;

  @ApiProperty({ example: 15, description: 'Clean code feedbacks' })
  cleanCode: number;

  @ApiProperty({ example: 7, description: 'Logic-related feedbacks' })
  logic: number;

  @ApiProperty({ example: 10, description: 'Best practices feedbacks' })
  bestPractices: number;

  @ApiProperty({ example: 55, description: 'Total AI feedbacks received' })
  total: number;
}

export class AIFeedbackSeverityDto {
  @ApiProperty({ example: 30, description: 'Info-level feedbacks' })
  info: number;

  @ApiProperty({ example: 20, description: 'Warning-level feedbacks' })
  warning: number;

  @ApiProperty({ example: 5, description: 'Critical-level feedbacks' })
  critical: number;
}

export class PerformanceMetricsDto {
  @ApiProperty({ example: 125.5, description: 'Average execution time in ms' })
  avgExecutionTime: number | null;

  @ApiProperty({ example: 42.3, description: 'Average memory usage in MB' })
  avgMemoryUsed: number | null;

  @ApiProperty({ example: 50.2, description: 'Best (fastest) execution time in ms' })
  bestExecutionTime: number | null;

  @ApiProperty({ example: 25.1, description: 'Best (lowest) memory usage in MB' })
  bestMemoryUsed: number | null;

  @ApiProperty({ example: 85.5, description: 'Percentile rank for execution time (lower is better)' })
  executionTimePercentile: number | null;

  @ApiProperty({ example: 78.2, description: 'Percentile rank for memory usage (lower is better)' })
  memoryPercentile: number | null;
}

export class ProgressOverTimeDto {
  @ApiProperty({ example: '2026-01', description: 'Month (YYYY-MM)' })
  month: string;

  @ApiProperty({ example: 15, description: 'Problems solved in this month' })
  problemsSolved: number;

  @ApiProperty({ example: 45, description: 'Total submissions in this month' })
  submissions: number;

  @ApiProperty({ example: 78.5, description: 'Success rate in this month' })
  successRate: number;
}

export class StrengthWeaknessDto {
  @ApiProperty({ 
    example: ['Array', 'String', 'Hash Table'], 
    description: 'Topics with highest success rate' 
  })
  strengths: string[];

  @ApiProperty({ 
    example: ['Dynamic Programming', 'Graph', 'Tree'], 
    description: 'Topics with lowest success rate or least attempted' 
  })
  weaknesses: string[];

  @ApiProperty({
    example: ['Recursion', 'Backtracking'],
    description: 'Topics user should practice more'
  })
  recommendedTopics: string[];
}

export class MilestoneDto {
  @ApiProperty({ example: 'first_solve', description: 'Milestone identifier' })
  id: string;

  @ApiProperty({ example: 'First Problem Solved', description: 'Milestone name' })
  name: string;

  @ApiProperty({ example: 'Solved your first coding problem!', description: 'Milestone description' })
  description: string;

  @ApiProperty({ example: true, description: 'Whether milestone is achieved' })
  achieved: boolean;

  @ApiProperty({ example: '2026-01-15T10:30:00Z', description: 'Date when milestone was achieved' })
  achievedAt: Date | null;

  @ApiProperty({ example: 1, description: 'Current progress towards milestone' })
  progress: number;

  @ApiProperty({ example: 1, description: 'Target value for milestone' })
  target: number;
}

export class RecentActivityDto {
  @ApiProperty({ example: 'problem-123', description: 'Problem ID' })
  problemId: string;

  @ApiProperty({ example: 'Two Sum', description: 'Problem title' })
  problemTitle: string;

  @ApiProperty({ example: 'two-sum', description: 'Problem slug' })
  problemSlug: string;

  @ApiProperty({ example: 'EASY', description: 'Problem difficulty' })
  difficulty: string;

  @ApiProperty({ example: 'success', description: 'Attempt status' })
  status: string;

  @ApiProperty({ example: '2026-01-31T14:30:00Z', description: 'Activity timestamp' })
  timestamp: Date;
}

// ===== MAIN DTO =====

export class UserStatsExtendedDto {
  // === Basic Stats ===
  @ApiProperty({ example: 'user-123', description: 'User ID' })
  userId: string;

  @ApiProperty({ example: 150, description: 'Total problems attempted' })
  problemsAttempted: number;

  @ApiProperty({ example: 45, description: 'Total problems solved' })
  problemsSolved: number;

  @ApiProperty({ example: 200, description: 'Total submission attempts' })
  totalSubmissions: number;

  @ApiProperty({ example: 120, description: 'Successful submission attempts' })
  successfulSubmissions: number;

  @ApiProperty({ example: 60.0, description: 'Overall success rate percentage' })
  successRate: number;

  // === Difficulty Breakdown ===
  @ApiProperty({ type: DifficultyBreakdownDto, description: 'Problems solved by difficulty' })
  difficultyBreakdown: DifficultyBreakdownDto;

  @ApiProperty({ type: DifficultyPercentageDto, description: 'Percentage breakdown by difficulty' })
  difficultyPercentage: DifficultyPercentageDto;

  // === Topic Stats (for pie chart / radar chart) ===
  @ApiProperty({ type: [TopicStatsDto], description: 'Statistics per topic' })
  topicStats: TopicStatsDto[];

  // === Language Stats (for pie chart) ===
  @ApiProperty({ type: [LanguageStatsDto], description: 'Statistics per programming language' })
  languageStats: LanguageStatsDto[];

  // === Streak & Activity ===
  @ApiProperty({ type: StreakDto, description: 'User streak information' })
  streak: StreakDto;

  @ApiProperty({ type: [ActivityHeatmapDto], description: 'Activity heatmap data (last 365 days)' })
  activityHeatmap: ActivityHeatmapDto[];

  @ApiProperty({ type: [WeeklyActivityDto], description: 'Activity breakdown by day of week' })
  weeklyActivity: WeeklyActivityDto[];

  @ApiProperty({ type: [HourlyActivityDto], description: 'Activity breakdown by hour' })
  hourlyActivity: HourlyActivityDto[];

  // === AI Feedback Stats (for pie chart) ===
  @ApiProperty({ type: AIFeedbackStatsDto, description: 'AI feedback statistics by type' })
  aiFeedbackByType: AIFeedbackStatsDto;

  @ApiProperty({ type: AIFeedbackSeverityDto, description: 'AI feedback statistics by severity' })
  aiFeedbackBySeverity: AIFeedbackSeverityDto;

  // === Performance Metrics ===
  @ApiProperty({ type: PerformanceMetricsDto, description: 'Code performance metrics' })
  performanceMetrics: PerformanceMetricsDto;

  // === Progress Over Time (for line chart) ===
  @ApiProperty({ type: [ProgressOverTimeDto], description: 'Monthly progress statistics' })
  progressOverTime: ProgressOverTimeDto[];

  // === Strengths & Weaknesses (for AI README generation) ===
  @ApiProperty({ type: StrengthWeaknessDto, description: 'User strengths and weaknesses analysis' })
  strengthsWeaknesses: StrengthWeaknessDto;

  // === Milestones / Achievements ===
  @ApiProperty({ type: [MilestoneDto], description: 'User milestones and achievements' })
  milestones: MilestoneDto[];

  // === Recent Activity ===
  @ApiProperty({ type: [RecentActivityDto], description: 'Recent user activity (last 10)' })
  recentActivity: RecentActivityDto[];

  // === Computed Metrics for AI ===
  @ApiProperty({ example: 2.3, description: 'Average difficulty score (1=Easy, 2=Medium, 3=Hard)' })
  averageDifficultyScore: number;

  @ApiProperty({ example: 85.5, description: 'Consistency score (0-100)' })
  consistencyScore: number;

  @ApiProperty({ example: 72.3, description: 'Growth rate percentage (compared to previous month)' })
  growthRate: number;

  @ApiProperty({ example: '2026-01-31T14:30:00Z', description: 'Stats generation timestamp' })
  generatedAt: Date;
}