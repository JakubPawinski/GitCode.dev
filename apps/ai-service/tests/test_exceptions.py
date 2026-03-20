from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.errors import register_exception_handlers
from app.exceptions.chat_exceptions import (
	MessageNotFoundError,
	SessionNotFoundError,
	UnauthorizedSessionError,
)


def create_test_app() -> FastAPI:
	app = FastAPI()
	register_exception_handlers(app)

	@app.get("/session-not-found")
	async def session_not_found():
		raise SessionNotFoundError("session missing")

	@app.get("/message-not-found")
	async def message_not_found():
		raise MessageNotFoundError("message missing")

	@app.get("/unauthorized")
	async def unauthorized():
		raise UnauthorizedSessionError("no access")

	@app.get("/general")
	async def general_error():
		raise RuntimeError("boom")

	return app


def test_session_not_found_handler_returns_404():
	client = TestClient(create_test_app(), raise_server_exceptions=False)

	response = client.get("/session-not-found")

	assert response.status_code == 404
	assert response.json() == {"detail": "session missing"}


def test_message_not_found_handler_returns_404():
	client = TestClient(create_test_app(), raise_server_exceptions=False)

	response = client.get("/message-not-found")

	assert response.status_code == 404
	assert response.json() == {"detail": "message missing"}


def test_unauthorized_handler_returns_403():
	client = TestClient(create_test_app(), raise_server_exceptions=False)

	response = client.get("/unauthorized")

	assert response.status_code == 403
	assert response.json() == {"detail": "no access"}


def test_general_exception_handler_returns_500():
	client = TestClient(create_test_app(), raise_server_exceptions=False)

	response = client.get("/general")

	assert response.status_code == 500
	assert response.json() == {"detail": "An internal server error occurred"}
