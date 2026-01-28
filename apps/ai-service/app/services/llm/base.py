from abc import ABC, abstractmethod
from typing import Any, Dict

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
    async def generate_readme(self, code: str, problem_description: str) -> str:
        """
        Generates a README.md content based on the provided code and problem description.

        :param self: Instance of the class
        :param code: The source code for which to generate the README
        :type code: str
        :param problem_description: Description of the problem the code solves
        :type problem_description: str
        :return: README content as a string
        :rtype: str
        """
        pass