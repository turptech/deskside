from fastapi import FastAPI
from pydantic import BaseModel


class RootResponse(BaseModel):
    message: str


app = FastAPI()


@app.get("/", response_model=RootResponse)
async def root() -> RootResponse:
    return RootResponse(message="Hello, World!")
