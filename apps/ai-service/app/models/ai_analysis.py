from pydantic import BaseModel, Field
from typing import Literal

class AnalysisResult(BaseModel):
    content: str = Field(description="Generated README.md content (Headers, Lists, Bold text). Keep it concise and professional, focused on errors and suggestions.")

    feedback_type: Literal["BUG", "PERFORMANCE", "SECURITY", "CLEAN_CODE", "LOGIC", "BEST_PRACTICES"] = Field(description="Category that best describes the main issue in the code")

    severity: Literal["INFO", "WARNING", "CRITICAL"] = Field(description="Severity level of the identified issue")