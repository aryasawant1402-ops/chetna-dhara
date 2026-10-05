from typing import Literal

from pydantic import BaseModel, Field, field_validator


Condition = Literal["asd", "adhd", "dyslexia", "dyspraxia", "idd"]
Pace = Literal["judging", "clinical"]


class SessionCreate(BaseModel):
    display_name: str = "Friend"
    age_years: int
    condition: Condition
    pace: Pace = "judging"

    @field_validator("age_years")
    @classmethod
    def check_age(cls, value: int) -> int:
        if value not in (6, 7, 8):
            raise ValueError("This prototype supports ages 6, 7, and 8.")
        return value

    @field_validator("display_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = " ".join(value.split())[:40]
        return cleaned or "Friend"


class TrialIn(BaseModel):
    correct: bool
    prompt_level: int = Field(ge=0, le=2)


class SessionComplete(BaseModel):
    end_reason: Literal["timer", "stress"]
    warmup_taps: int = Field(ge=0)
    warmup_completed: bool
    stress_stage: Literal["warmup", "activity"] | None = None
    trials: list[TrialIn]
