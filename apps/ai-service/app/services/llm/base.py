from abc import ABC, abstractmethod
from typing import Any, Dict, AsyncGenerator

class BaseLLMClient(ABC):
    @abstractmethod
    async def analyze_code(self, code: str, problem_description: str) -> Dict[str, Any]:
        """
        Analyzes the provided code and returns a dictionary with analysis results.
        
        :param self: Instance of the class
        :param code: The source code to analyze
        :type code: str
        :param problem_description: Description of the problem the code solves
        :type problem_description: str
        :return: Analysis results as a dictionary
        :rtype: Dict[str, Any]
        """
        pass

    @abstractmethod
    async def generate_readme_content(self, stats: dict) -> Any:
        """
        Generates personalized README content based on user statistics.

        :param self: Instance of the class
        :param stats: Extended user statistics dictionary containing metrics like
                      problemsSolved, successRate, topicStats, streak, etc.
        :type stats: dict
        :return: AIReadmeContent object with generated content
        :rtype: Any (AIReadmeContent)
        """
        pass

    @abstractmethod
    async def stream_tutor_chat(
        self, 
        code: str, 
        problem_description: str, 
        chat_history: list[dict], 
        user_message: str
    ) -> AsyncGenerator[str, None]:
        """
        Streams a tutor chat response based on the provided code, problem description, 
        chat history, and user message.
        
        :param self: Instance of the class
        :param code: The source code related to the chat
        :type code: str
        :param problem_description: Description of the problem the code solves
        :type problem_description: str
        :param chat_history: List of previous chat messages
        :type chat_history: list[dict]
        :param user_message: The latest message from the user
        :type user_message: str
        :return: An asynchronous generator yielding chat response strings
        :rtype: AsyncGenerator[str, None]
        """
        pass