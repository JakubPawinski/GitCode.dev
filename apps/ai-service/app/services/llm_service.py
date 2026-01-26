class LLMService:
    def __init__(self):
        self.llm_client = "pass"

    async def analyze_submission(self, submission_data: dict) -> dict:
        analysis_result = {
            "submissionId": submission_data.get("submissionId"),
            "analysis": "This is a mock analysis result."
        }
        return analysis_result

def get_llm_service() -> LLMService:
    return LLMService()