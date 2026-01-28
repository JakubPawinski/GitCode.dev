from google import genai
from google.genai import types
import json
from app.core.config import settings
from app.services.llm.base import BaseLLMClient
from app.models.ai_analysis import AnalysisResult
import logging

logger = logging.getLogger(__name__)

class GeminiClient(BaseLLMClient):
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is missing")
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)


    async def analyze_code(self, code: str, problem_description: str) -> dict:
        prompt = f"""
        <problem_description>
        {problem_description}
        </problem_description>

        <user_code>
        {code}
        </user_code>
        """

        system_instruction = """
        # ROLE
        You are a Senior Tech Lead and Mentor acting as a code reviewer on an algorithmic learning platform. 
        Your goal is to help students improve by providing constructive, educational feedback.

        # ANALYSIS GUIDELINES
        1. **Correctness First**: Check if the code solves the problem described in <problem_description>.
        2. **Complexity**: Analyze Time and Space complexity (Big O notation).
        3. **Best Practices**: Look for variable naming, edge case handling, and code modularity.
        
        # RESPONSE RULES
        - **Language**: English ONLY.
        - **Tone**: Educational, encouraging, but professional. explain "WHY" something is wrong, not just "WHAT".
        - **Snippets**: You MUST include corrected code snippets (in Python/relevant language) within the markdown content to show better approaches.

        # LOGIC FOR "PERFECT CODE"
        If the solution is correct, optimal, and clean:
        - Set 'feedback_type' to "CLEAN_CODE".
        - Set 'severity' to "INFO".
        - In 'content', praise the specific good practices used (e.g., "Great use of a hash map to reduce complexity to O(n)").

        # OUTPUT CONTENT FORMAT (Markdown)
        The 'content' field must be a valid Markdown string utilizing:
        - **Bold** for emphasis.
        - `Code blocks` for snippets.
        - Bullet points for readability.
        - Sections like: "### Analysis", "### Suggestions", "### Corrected Snippet".
        """
        
        try:
            response = self.client.models.generate_content(
                model=settings.GEMINI_MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=AnalysisResult,
                    temperature=0.2,
                ))
            logger.debug(f"Gemini response: {response}")

            parsed_response = response.parsed

            logger.info(f"Analysis Result: {parsed_response}")
            return parsed_response.model_dump()
            
        except Exception as e:
            logger.error(f"Gemini Error: {e}")
            return {
                "content": "Error during analysis.",
                "feedback_type": "INFO",
                "severity": "INFO"
            }

    async def generate_readme(self, code: str, problem_description: str) -> str:
        prompt = f"""

        """
        pass