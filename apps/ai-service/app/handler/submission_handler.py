import logging
from app.core.event_dispatcher import dispatcher
from app.models.generated import SubmissionCompletedEvent, SUBMISSIONPATTERNS, SubmissionAnalyzedEvent,AIPATTERNS
from app.core.event_bus import event_bus
from app.services.llm.providers.open_router import OpenRouterClient

logger = logging.getLogger(__name__)

@dispatcher.subscribe(routing_key=SUBMISSIONPATTERNS.submission_completed, model=SubmissionCompletedEvent)
async def handle_submission_completed(event: SubmissionCompletedEvent, metadata: dict):
    """
    Handle a completed submission by analyzing it using the LLM service and publishing the analysis result.

    Args:
        event (SubmissionCompletedEvent): The event data for the completed submission.
        metadata (dict): Additional metadata associated with the event.
    Returns:
        None
    """

    # Perform analysis using LLM service
    llm_client = OpenRouterClient()
    
    logger.info(f"Processing completed submission: {event.submissionId} for problem {event.problemId}")
    logger.info(f"Event: {event}")

    analysis_result = await llm_client.analyze_code(
        code=event.code,
        problem_description=event.problemDescription
        )
    logger.info(f"Analysis Result: {analysis_result}")

    event_payload: SubmissionAnalyzedEvent = SubmissionAnalyzedEvent(
        content=analysis_result["content"],
        feedbackType=analysis_result["feedback_type"],
        severity=analysis_result["severity"],
        problemId=event.problemId,
        submissionId=event.submissionId,
        userId=event.userId,
        attemptId=event.attemptId,
    )

    # logger.info(f"Generated Analysis Report: {event_payload}")
    logger.debug(f"Event payload: {event_payload.model_dump_json()}")

    await event_bus.publish(
        routing_key=AIPATTERNS.ai_submission_analyzed,
        event_data=event_payload,
    )
    logger.info(f"Published SubmissionAnalyzedEvent for submission: {event.submissionId}")

