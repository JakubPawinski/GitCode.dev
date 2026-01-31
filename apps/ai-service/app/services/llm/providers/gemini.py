from google import genai
from google.genai import types
import json
from app.core.config import settings
from app.services.llm.base import BaseLLMClient
from app.models.ai_analysis import AnalysisResult
import logging
from typing import AsyncGenerator

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

    async def stream_tutor_chat(self, code: str, problem_description: str, chat_history: list[dict], user_message: str) -> AsyncGenerator[str, None]:
        system_instruction = """
            # ROLE
            You are an expert Socratic Algorithmic Tutor. Your goal is to guide students through coding problems (like LeetCode) without ever giving them the answer. You help them build problem-solving muscles by asking guiding questions.

            # STRICT GUARDRAILS (MISSION CRITICAL)
            1. **NO SOLUTIONS:** Under NO circumstances are you allowed to generate the full solution code or write significant chunks of logic for the student.
            2. **REFUSAL PROTOCOL:** If a user asks for the answer, code, or a "fix" (e.g., "Just write the code for me", "Fix this error"), you must FIRMLY refuse.
            - Response template: "I cannot write the code for you, as that would hinder your learning. However, I can help you debug your logic."
            3. **NO BUG FIXING:** Do not say "You missed a semicolon on line 5." Instead, guide them: "Review the syntax on line 5. Does it match Python's requirements for loop definitions?"

            # PEDAGOGICAL STRATEGY (SOCRATIC METHOD)
            - **Analyze first:** Look at the user's code and the problem description. Identify the logical gap or syntax error.
            - **Guide, don't drive:** Lead the user to the answer with questions.
            - *Bad:* "Use a hash map here."
            - *Good:* "How could we optimize the lookup time? Is there a data structure that offers O(1) access?"
            - **One step at a time:** Focus on the immediate blocker. Do not overwhelm with future steps.

            # TONE & STYLE
            - Language: English ONLY.
            - Tone: Professional, encouraging, but strict about the "no code" rule.
            - Formatting: Use **Markdown** effectively.
            - Use `code blocks` for variable names or short snippets (only if necessary for context, not solution).
            - Use **bold** for key concepts.

            # INTERACTION EXAMPLES

            <example_error_handling>
            User: "Why isn't my loop working?"
            (Code has: `for i in range(10) print(i)`)
            Tutor: "It seems the loop syntax might be incomplete. In Python, what symbol is required at the end of a `for` statement to start the block?"
            </example_error_handling>

            <example_refusal>
            User: "I'm stuck, just give me the answer."
            Tutor: "I cannot provide the solution code directly. My goal is to help you understand the algorithm. Let's break down the problem: what is the first step your function needs to perform?"
            </example_refusal>
        """

        context_prompt = f"""
        CONTEXT:
        Problem: {problem_description}
        
        User Code:
        ```
        {code}
        ```
        
        User Message: {user_message}
        """

        try:
            gemini_history = []
            for msg in chat_history:
                gemini_history.append(types.Content(
                    role=msg['role'],
                    parts=[types.Part(text=msg['content'])]
                ))

            chat = self.client.aio.chats.create(
                model=settings.GEMINI_MODEL_NAME,
                history=gemini_history,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2,
                )
            )
            
            async for chunk in await chat.send_message_stream(context_prompt):
                if chunk.text:
                    yield chunk.text

        except Exception as e:
            logger.error(f"Gemini Streaming Error: {e}")
            yield f"[Error: {str(e)}]"

    async def generate_readme(self, code: str, problem_description: str) -> str:
        prompt = f"""

        """
        pass