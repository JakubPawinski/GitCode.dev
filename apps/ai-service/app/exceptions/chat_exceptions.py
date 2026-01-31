class ChatException(Exception):
    """Base exception for chat-related errors"""
    pass


class SessionNotFoundError(ChatException):
    """Raised when a chat session is not found"""
    pass


class UnauthorizedSessionError(ChatException):
    """Raised when user doesn't have permission to access the session"""
    pass


class MessageNotFoundError(ChatException):
    """Raised when a message is not found"""
    pass