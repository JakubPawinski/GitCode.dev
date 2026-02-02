from google import genai
from google.genai import types
from app.core.config import settings
from app.services.llm.base import BaseLLMClient
from app.models.ai_analysis import AnalysisResult
from app.models.ai_readme_content import AIReadmeContent
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
                "content": "Error during analysis. Please try again later.",
                "feedback_type": "INFO",
                "severity": "ERROR"
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

    async def generate_readme_content(self, stats: dict) -> AIReadmeContent:
        """
        Generate personalized README content based on user statistics using Gemini.
        
        :param stats: Extended user statistics dictionary
        :return: AIReadmeContent with generated content
        """
        system_instruction = """
        # ROLE
        You are a developer profile analyst and technical writer specializing in creating 
        compelling GitHub README profiles. Your goal is to analyze coding statistics and 
        generate personalized, encouraging, and professional content.

        # GUIDELINES
        1. **Be Authentic**: Base all content on actual statistics provided. Don't exaggerate.
        2. **Be Encouraging**: Highlight achievements while being honest about growth areas.
        3. **Be Specific**: Reference actual numbers and topics from the data.
        4. **Be Professional**: Use appropriate technical terminology.
        5. **Be Concise**: Keep content impactful but not verbose.

        # CONTENT RULES
        - **Headline**: Max 100 characters. Catchy and professional.
        - **Bio**: 2-3 sentences. Mention key achievements and coding style.
        - **Key Strengths**: Based on high success rate topics and consistent patterns.
        - **Growth Areas**: Based on low success rate topics or areas with few attempts.
        - **Motivational Quote**: Personalized based on their journey stage.
        - **Code Quality Analysis**: Based on AI feedback distribution (bugs, performance, etc.)
        - **Recommendations**: Actionable, specific next steps.

        # TONE
        - Professional but warm
        - Encouraging without being patronizing
        - Data-driven insights
        - Appropriate use of emojis (sparingly)
        """

        prompt = self._build_readme_prompt(stats)
        
        try:
            response = self.client.models.generate_content(
                model=settings.GEMINI_MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=AIReadmeContent,
                    temperature=0.7,
                )
            )
            
            logger.debug(f"Gemini README response: {response}")
            
            if response.parsed:
                logger.info("Successfully generated README content")
                return response.parsed
            else:
                logger.warning("Gemini returned unparsed response, using fallback")
                return self._get_fallback_content(stats)
                
        except Exception as e:
            logger.error(f"Gemini README Generation Error: {e}")
            return self._get_fallback_content(stats)

    def _build_readme_prompt(self, stats: dict) -> str:
        """Build comprehensive prompt for README generation."""
        
        # Format topics
        top_topics = self._format_topics(stats.get('topicStats', [])[:5])
        weak_topics = self._format_topics(
            sorted(stats.get('topicStats', []), key=lambda x: x.get('successRate', 0))[:3]
        )
        languages = self._format_languages(stats.get('languageStats', [])[:3])
        
        # Get achieved milestones
        achieved_milestones = [
            m.get('name') for m in stats.get('milestones', []) if m.get('achieved')
        ]
        
        # Calculate feedback percentages for context
        total_feedback = stats.get('aiFeedbackByType', {}).get('total', 0)
        feedback_context = ""
        if total_feedback > 0:
            fb = stats.get('aiFeedbackByType', {})
            feedback_context = f"""
            - Bug issues: {fb.get('bug', 0)} ({round(fb.get('bug', 0)/total_feedback*100, 1)}%)
            - Performance issues: {fb.get('performance', 0)} ({round(fb.get('performance', 0)/total_feedback*100, 1)}%)
            - Security concerns: {fb.get('security', 0)} ({round(fb.get('security', 0)/total_feedback*100, 1)}%)
            - Clean code suggestions: {fb.get('cleanCode', 0)} ({round(fb.get('cleanCode', 0)/total_feedback*100, 1)}%)
            - Logic issues: {fb.get('logic', 0)} ({round(fb.get('logic', 0)/total_feedback*100, 1)}%)
            - Best practices: {fb.get('bestPractices', 0)} ({round(fb.get('bestPractices', 0)/total_feedback*100, 1)}%)
            """
        
        return f"""
Analyze the following developer statistics and generate personalized README content.

## 📊 CORE STATISTICS
| Metric | Value |
|--------|-------|
| Problems Attempted | {stats.get('problemsAttempted', 0)} |
| Problems Solved | {stats.get('problemsSolved', 0)} |
| Success Rate | {stats.get('successRate', 0)}% |
| Total Submissions | {stats.get('totalSubmissions', 0)} |

## 🔥 ACTIVITY & STREAKS
| Metric | Value |
|--------|-------|
| Current Streak | {stats.get('streak', {}).get('currentStreak', 0)} days |
| Longest Streak | {stats.get('streak', {}).get('longestStreak', 0)} days |
| Active Today | {'Yes' if stats.get('streak', {}).get('activeToday') else 'No'} |
| Consistency Score | {stats.get('consistencyScore', 0)}/100 |

## 📈 GROWTH METRICS
| Metric | Value |
|--------|-------|
| Average Difficulty | {stats.get('averageDifficultyScore', 0)}/3.0 (1=Easy, 3=Hard) |
| Growth Rate (MoM) | {stats.get('growthRate', 0)}% |

## 🎯 DIFFICULTY BREAKDOWN
| Difficulty | Solved | Percentage |
|------------|--------|------------|
| Easy | {stats.get('difficultyBreakdown', {}).get('easy', 0)} | {stats.get('difficultyPercentage', {}).get('easy', 0)}% |
| Medium | {stats.get('difficultyBreakdown', {}).get('medium', 0)} | {stats.get('difficultyPercentage', {}).get('medium', 0)}% |
| Hard | {stats.get('difficultyBreakdown', {}).get('hard', 0)} | {stats.get('difficultyPercentage', {}).get('hard', 0)}% |

## 💪 TOP PERFORMING TOPICS (Highest Success Rate)
{top_topics if top_topics else "No topic data available"}

## 📚 TOPICS NEEDING IMPROVEMENT (Lowest Success Rate)
{weak_topics if weak_topics else "No topic data available"}

## 💻 PREFERRED LANGUAGES
{languages if languages else "No language data available"}

## 🤖 AI CODE REVIEW FEEDBACK SUMMARY
Total Reviews: {total_feedback}
{feedback_context if feedback_context else "No feedback data available"}

Severity Distribution:
- Info: {stats.get('aiFeedbackBySeverity', {}).get('info', 0)}
- Warning: {stats.get('aiFeedbackBySeverity', {}).get('warning', 0)}
- Critical: {stats.get('aiFeedbackBySeverity', {}).get('critical', 0)}

## ✅ IDENTIFIED STRENGTHS
{stats.get('strengthsWeaknesses', {}).get('strengths', ['Not yet determined'])}

## ⚠️ IDENTIFIED WEAKNESSES
{stats.get('strengthsWeaknesses', {}).get('weaknesses', ['Not yet determined'])}

## 🏆 ACHIEVED MILESTONES
{achieved_milestones if achieved_milestones else ['No milestones achieved yet']}

## ⏱️ PERFORMANCE METRICS
| Metric | Value |
|--------|-------|
| Avg Execution Time | {stats.get('performanceMetrics', {}).get('avgExecutionTime', 'N/A')} ms |
| Best Execution Time | {stats.get('performanceMetrics', {}).get('bestExecutionTime', 'N/A')} ms |
| Avg Memory Usage | {stats.get('performanceMetrics', {}).get('avgMemoryUsed', 'N/A')} MB |
| Best Memory Usage | {stats.get('performanceMetrics', {}).get('bestMemoryUsed', 'N/A')} MB |

---

Based on all the above data, generate the AIReadmeContent JSON with:
1. A compelling headline that captures their coding journey
2. A professional bio highlighting key achievements
3. 3-5 specific key strengths based on their best topics and patterns
4. 2-3 growth areas based on weak topics or feedback patterns
5. 2-3 actionable recommended focus items
6. A motivational quote that fits their current stage
7. Code quality analysis based on AI feedback distribution
8. Personalized recommendations in markdown format
9. A summary that would make them proud of their progress
"""

    def _format_topics(self, topics: list) -> str:
        """Format topics list for prompt."""
        if not topics:
            return ""
        return "\n".join([
            f"- **{t.get('topic', 'Unknown')}**: {t.get('successRate', 0)}% success rate "
            f"({t.get('solved', 0)}/{t.get('attempted', 0)} solved)"
            for t in topics
        ])
    
    def _format_languages(self, languages: list) -> str:
        """Format languages list for prompt."""
        if not languages:
            return ""
        return "\n".join([
            f"- **{l.get('language', 'Unknown').capitalize()}**: "
            f"{l.get('submissions', 0)} submissions, {l.get('successRate', 0)}% success rate, "
            f"avg {l.get('avgExecutionTime', 'N/A')} ms"
            for l in languages
        ])
    
    def _get_fallback_content(self, stats: dict) -> AIReadmeContent:
        """Generate fallback content if AI generation fails."""
        problems_solved = stats.get('problemsSolved', 0)
        current_streak = stats.get('streak', {}).get('currentStreak', 0)
        success_rate = stats.get('successRate', 0)
        
        # Dynamic headline based on progress
        if problems_solved >= 100:
            headline = "Seasoned Problem Solver | Algorithm Enthusiast"
        elif problems_solved >= 50:
            headline = "Growing Developer | Consistent Learner"
        elif problems_solved >= 10:
            headline = "Emerging Coder | Building Strong Foundations"
        else:
            headline = "Aspiring Developer | Beginning the Journey"
        
        # Dynamic strengths based on stats
        strengths = []
        if current_streak >= 7:
            strengths.append(f"Impressive {current_streak}-day coding streak")
        if success_rate >= 70:
            strengths.append(f"High success rate of {success_rate}%")
        if stats.get('difficultyBreakdown', {}).get('hard', 0) > 0:
            strengths.append("Tackles challenging problems")
        
        # Add default strengths if needed
        if len(strengths) < 3:
            default_strengths = [
                "Consistent practice habits",
                "Growing problem-solving skills",
                "Commitment to continuous improvement"
            ]
            strengths.extend(default_strengths[:3 - len(strengths)])
        
        return AIReadmeContent(
            headline=headline,
            bio=f"A dedicated problem solver with {problems_solved} problems solved "
                f"and a {success_rate}% success rate. "
                f"Currently on a {current_streak}-day coding streak.",
            keyStrengths=strengths[:5],
            growthAreas=[
                "Exploring more advanced algorithms",
                "Tackling harder difficulty problems"
            ],
            recommendedFocus=[
                "Continue daily practice to maintain streak",
                "Try medium-difficulty problems for growth",
                "Review AI feedback to improve code quality"
            ],
            motivationalQuote="Every expert was once a beginner. Keep coding, keep growing!",
            codeQualityAnalysis="Continue focusing on writing clean, efficient code. "
                               "Each code review is an opportunity to learn and improve.",
            personalizedRecommendations=(
                "- 📅 **Daily Practice**: Solve at least one problem per day\n"
                "- 📈 **Level Up**: Attempt medium difficulty problems\n"
                "- 🔍 **Learn from Feedback**: Review AI suggestions carefully\n"
                "- 🎯 **Focus Topics**: Work on areas with lower success rates"
            ),
            summary=f"A developer making steady progress with {problems_solved} problems solved "
                   f"and a commitment to continuous learning."
        )