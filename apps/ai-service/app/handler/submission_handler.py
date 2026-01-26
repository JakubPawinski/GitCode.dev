import logging
from app.core.event_dispatcher import dispatcher
from app.models.generated import SubmissionCompletedEvent, SUBMISSIONPATTERNS, SubmissionAnalyzedEvent,AIPATTERNS
from app.services.llm_service import LLMService
from app.core.event_bus import event_bus

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
    llm_service = LLMService()
    
    logger.info(f"Processing completed submission: {event.submissionId} for problem {event.problemId}")

    logger.debug(f"Submission details: User {event.userId}, event data: {event}")

    event_payload: SubmissionAnalyzedEvent = SubmissionAnalyzedEvent(
        analysisReport="Test report",
        problemId=event.problemId,
        submissionId=event.submissionId,
        userId=event.userId
    )

    logger.info(f"Generated Analysis Report: {event_payload.analysisReport}")

    await event_bus.publish(
        routing_key=AIPATTERNS.ai_submission_analyzed,
        event_data=event_payload,
    )
    logger.info(f"Published SubmissionAnalyzedEvent for submission: {event.submissionId}")

