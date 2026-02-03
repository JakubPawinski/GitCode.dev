from pydantic import BaseModel
from typing import Optional

class TutorRequest(BaseModel):
    code: str
    problem_slug: str
    message: str

class TutorMessage(BaseModel):
    text: str
    done: bool
    error: Optional[str] = None