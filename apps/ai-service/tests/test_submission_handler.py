from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.handler import submission_handler


@pytest.mark.asyncio
async def test_handle_submission_completed_publishes_analysis_event(monkeypatch):
	event = SimpleNamespace(
		submissionId="sub-1",
		problemId="prob-1",
		userId="user-1",
		attemptId="att-1",
		code="print('ok')",
		problemDescription="Return sum",
	)

	class FakeClient:
		async def analyze_code(self, code, problem_description):
			assert code == "print('ok')"
			assert problem_description == "Return sum"
			return {
				"content": "Looks good",
				"feedback_type": "CLEAN_CODE",
				"severity": "INFO",
			}

	publish_mock = AsyncMock()

	monkeypatch.setattr(submission_handler, "OpenRouterClient", lambda: FakeClient())
	monkeypatch.setattr(submission_handler.event_bus, "publish", publish_mock)

	await submission_handler.handle_submission_completed(event, metadata={})

	assert publish_mock.await_count == 1
	_, kwargs = publish_mock.await_args
	assert kwargs["routing_key"] == submission_handler.AIPATTERNS.ai_submission_analyzed
	payload = kwargs["event_data"]
	payload_dict = payload.model_dump()
	assert payload_dict["content"] == "Looks good"
	assert payload_dict["feedbackType"] == "CLEAN_CODE"
	assert payload_dict["severity"] == "INFO"
	assert payload_dict["submissionId"] == "sub-1"
