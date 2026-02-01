from pydantic import BaseModel, Field
from typing import List

class AIReadmeContent(BaseModel):
    """AI-generated content for README profile."""
    
    headline: str = Field(
        description="Short, catchy headline describing the developer (max 100 chars)"
    )
    
    bio: str = Field(
        description="2-3 sentence professional bio based on coding patterns and achievements"
    )
    
    keyStrengths: List[str] = Field(
        description="3-5 key strengths based on topic success rates and patterns",
        min_length=3,
        max_length=5
    )
    
    growthAreas: List[str] = Field(
        description="2-3 areas where the developer can improve based on weak topics",
        min_length=2,
        max_length=3
    )
    
    recommendedFocus: List[str] = Field(
        description="2-3 specific recommendations for next steps",
        min_length=2,
        max_length=3
    )
    
    motivationalQuote: str = Field(
        description="Personalized motivational quote based on progress and achievements"
    )
    
    codeQualityAnalysis: str = Field(
        description="2-3 sentences analyzing code quality trends based on AI feedback distribution"
    )
    
    personalizedRecommendations: str = Field(
        description="Markdown-formatted personalized learning recommendations (3-5 bullet points)"
    )
    
    summary: str = Field(
        description="2-3 sentence summary highlighting key achievements and potential"
    )