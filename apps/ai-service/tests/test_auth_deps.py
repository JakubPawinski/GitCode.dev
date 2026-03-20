from unittest.mock import patch

import pytest
from fastapi import HTTPException
from jwt import ExpiredSignatureError, PyJWTError

from app.auth.deps import RequiredPermission, get_current_user
from app.models.generated import AppPermission, AuthenticatedUser


@pytest.mark.asyncio
async def test_get_current_user_decodes_valid_token(monkeypatch):
    payload = {
        "sub": "user-1",
        "email": "u@example.com",
        "username": "user",
        "roles": ["user"],
        "permissions": ["ai:tutor:chat"],
    }

    with patch("app.auth.deps.jwt.decode", return_value=payload):
        user = await get_current_user("token")

    assert user.id == "user-1"
    assert user.email == "u@example.com"


@pytest.mark.asyncio
async def test_get_current_user_expired_token_raises_401():
    with patch("app.auth.deps.jwt.decode", side_effect=ExpiredSignatureError()):
        with pytest.raises(HTTPException) as exc:
            await get_current_user("token")

    assert exc.value.status_code == 401
    assert exc.value.detail == "Token has expired"


@pytest.mark.asyncio
async def test_get_current_user_decode_error_raises_401():
    with patch("app.auth.deps.jwt.decode", side_effect=PyJWTError("bad token")):
        with pytest.raises(HTTPException) as exc:
            await get_current_user("token")

    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_required_permission_allows_user_with_permission():
    dep = RequiredPermission(AppPermission.ai_tutor_chat)
    user = AuthenticatedUser(
        id="u1",
        email="u@example.com",
        username="user",
        roles=[],
        permissions=[AppPermission.ai_tutor_chat.value],
    )

    result = await dep(user)

    assert result is user


@pytest.mark.asyncio
async def test_required_permission_rejects_without_permission():
    dep = RequiredPermission(AppPermission.ai_tutor_chat)
    user = AuthenticatedUser(
        id="u1",
        email="u@example.com",
        username="user",
        roles=[],
        permissions=[],
    )

    with pytest.raises(HTTPException) as exc:
        await dep(user)

    assert exc.value.status_code == 403
    assert "Missing permission" in exc.value.detail