from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path
from app.models.ai_readme_content import AIReadmeContent
from app.services.llm.providers.open_router import OpenRouterClient
import logging

logger = logging.getLogger(__name__)

class ReadmeGeneratorService:
    def __init__(self):
        template_dir = Path(__file__).parent.parent.parent / "templates"
        self.env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml']),
            trim_blocks=True,
            lstrip_blocks=True
        )
        self.llm_client = OpenRouterClient()
    
    async def generate_readme(
        self,
        user_data: dict,
        stats_data: dict
    ) -> str:
        """
        Generate a complete README profile using stats and AI-generated content.
        
        :param user_data: User information (username, githubUsername, etc.)
        :param stats_data: Extended statistics from UserStatsExtendedDto
        :return: Rendered README markdown string
        """
        # Normalize stats data (ensure proper structure)
        normalized_stats = self._normalize_stats(stats_data)
        
        # Generate AI content based on stats using OpenRouter
        ai_content = await self.llm_client.generate_readme_content(normalized_stats)
        
        # Convert AI content to dict if it's a Pydantic model
        ai_dict = ai_content.model_dump() if hasattr(ai_content, 'model_dump') else ai_content
        
        # Load and render template
        template = self.env.get_template("readme.md.j2")
        
        rendered = template.render(
            user=user_data,
            stats=normalized_stats,
            ai=ai_dict
        )
        
        logger.info(f"Generated README for user {user_data.get('username')}")
        return rendered
    
    async def get_ai_content_only(self, stats_data: dict) -> AIReadmeContent:
        """
        Get only the AI-generated content without rendering the template.
        """
        normalized_stats = self._normalize_stats(stats_data)
        return await self.llm_client.generate_readme_content(normalized_stats)
    
    def _normalize_stats(self, stats: dict) -> dict:
        """
        Normalize statistics data to ensure all expected fields exist with defaults.
        This prevents template errors when fields are missing.
        """
        # Default structures
        default_streak = {
            'currentStreak': 0,
            'longestStreak': 0,
            'lastActivityDate': None,
            'activeToday': False
        }
        
        default_difficulty_breakdown = {
            'easy': 0,
            'medium': 0,
            'hard': 0,
            'total': 0
        }
        
        default_difficulty_percentage = {
            'easy': 0,
            'medium': 0,
            'hard': 0
        }
        
        default_performance_metrics = {
            'avgExecutionTime': None,
            'avgMemoryUsed': None,
            'bestExecutionTime': None,
            'bestMemoryUsed': None,
            'executionTimePercentile': None,
            'memoryPercentile': None
        }
        
        default_ai_feedback_by_type = {
            'bug': 0,
            'performance': 0,
            'security': 0,
            'cleanCode': 0,
            'logic': 0,
            'bestPractices': 0,
            'total': 0
        }
        
        default_ai_feedback_by_severity = {
            'info': 0,
            'warning': 0,
            'critical': 0
        }
        
        default_strengths_weaknesses = {
            'strengths': [],
            'weaknesses': [],
            'recommendedTopics': []
        }
        
        # Merge defaults with actual data
        normalized = {
            'userId': stats.get('userId', ''),
            'problemsAttempted': stats.get('problemsAttempted', 0),
            'problemsSolved': stats.get('problemsSolved', 0),
            'totalSubmissions': stats.get('totalSubmissions', 0),
            'successfulSubmissions': stats.get('successfulSubmissions', 0),
            'successRate': stats.get('successRate', 0),
            
            # Nested objects with defaults
            'streak': {**default_streak, **stats.get('streak', {})},
            'difficultyBreakdown': {**default_difficulty_breakdown, **stats.get('difficultyBreakdown', {})},
            'difficultyPercentage': {**default_difficulty_percentage, **stats.get('difficultyPercentage', {})},
            'performanceMetrics': {**default_performance_metrics, **stats.get('performanceMetrics', {})},
            'aiFeedbackByType': {**default_ai_feedback_by_type, **stats.get('aiFeedbackByType', {})},
            'aiFeedbackBySeverity': {**default_ai_feedback_by_severity, **stats.get('aiFeedbackBySeverity', {})},
            'strengthsWeaknesses': {**default_strengths_weaknesses, **stats.get('strengthsWeaknesses', {})},
            
            # Arrays with defaults
            'topicStats': stats.get('topicStats', []),
            'languageStats': stats.get('languageStats', []),
            'weeklyActivity': stats.get('weeklyActivity', []),
            'hourlyActivity': stats.get('hourlyActivity', []),
            'activityHeatmap': stats.get('activityHeatmap', []),
            'progressOverTime': stats.get('progressOverTime', []),
            'milestones': stats.get('milestones', []),
            'recentActivity': stats.get('recentActivity', []),
            
            # Computed metrics
            'averageDifficultyScore': stats.get('averageDifficultyScore', 0),
            'consistencyScore': stats.get('consistencyScore', 0),
            'growthRate': stats.get('growthRate', 0),
            'generatedAt': stats.get('generatedAt', '2026-01-01T00:00:00Z'),
        }
        
        return normalized