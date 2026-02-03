import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.exceptions.chat_exceptions import (
    SessionNotFoundError,
    UnauthorizedSessionError,
    MessageNotFoundError
)

logger = logging.getLogger(__name__)

def register_exception_handlers(app: FastAPI):
    @app.exception_handler(SessionNotFoundError)
    async def session_not_found_handler(request: Request, exc: SessionNotFoundError):
        return JSONResponse(
            status_code=404,
            content={"message": str(exc)}
        )

    @app.exception_handler(MessageNotFoundError)
    async def message_not_found_handler(request: Request, exc: MessageNotFoundError):
        return JSONResponse(
            status_code=404,
            content={"message": str(exc)}
        )

    @app.exception_handler(UnauthorizedSessionError)
    async def unauthorized_session_handler(request: Request, exc: UnauthorizedSessionError):
        return JSONResponse(
            status_code=403,
            content={"message": str(exc)}
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled error: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"message": "An internal server error occurred"}
        )