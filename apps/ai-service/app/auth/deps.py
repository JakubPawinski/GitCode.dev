from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from app.models.generated import AuthenticatedUser, AppPermission
from app.core.config import settings
import jwt
from jwt import PyJWTError, ExpiredSignatureError
import logging

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

logger = logging.getLogger(__name__)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> AuthenticatedUser:
    """
    Decode JWT token and return the authenticated user
    
    :param token: JWT token
    :type token: str
    :return: Authenticated user object
    :rtype: AuthenticatedUser
    :raises HTTPException: If token is invalid or expired
    """

    try:
        payload = jwt.decode(token, 
                             settings.JWT_SECRET, 
                             algorithms=[settings.JWT_ALGORITHM])
        
        return AuthenticatedUser(
            id=payload.get("sub"),
            email=payload.get("email"),
            username=payload.get("username"),
            roles=payload.get("roles", []),
            permissions=payload.get("permissions", [])
        )
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except PyJWTError as e:
        logger.error(f"JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Auth error: {e}")
    
class RequiredPermission:
    """
    Dependency to check if the current user has the required permission
    """
    def __init__(self, required_permission: AppPermission):
        self.required_permission = required_permission

    async def __call__(self, current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        """
        Check if the current user has the required permission

        :param current_user: Current authenticated user
        :type current_user: AuthenticatedUser
        :return: Current user if permission is granted
        :rtype: AuthenticatedUser
        :raises HTTPException: If user lacks required permission
        """
        if self.required_permission.value not in current_user.permissions:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"message": "Permission denied", "success": False}
            )
        return current_user