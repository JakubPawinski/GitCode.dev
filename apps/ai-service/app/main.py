from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.core.config import settings
from app.api.routers import router as api_router
from contextlib import asynccontextmanager
from app.core.event_consumer import event_consumer
from app.core.event_bus import event_bus
from app.core.database import init_db
import logging
import sys
import signal
import asyncio

logging.basicConfig(
    stream=sys.stdout,
    level=logging.DEBUG,
    format='%(levelname)s - %(asctime)s - %(name)s - %(message)s'
    )

# Ensure event handlers are imported for register decorators
import app.handler.submission_handler 

@asynccontextmanager
async def lifespan(app: FastAPI):
    await event_consumer.connect()
    await event_bus.connect()
    await init_db()
    yield
    await event_consumer.close()
    await event_bus.close()

app = FastAPI(
    title="AI Service",
    description="AI Service for GitCode Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

"""Include API routers"""
app.include_router(api_router, prefix="/ai")


if __name__ == "__main__":
    config = uvicorn.Config(
        "app.main:app",
        host="0.0.0.0",
        port=settings.AI_PORT,
        reload=(settings.ENVIRONMENT == "development"),
        lifespan="on"
    )
    server = uvicorn.Server(config)
    
    def handle_shutdown(signum, frame):
        logging.info("Shutting down gracefully...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)
    
    asyncio.run(server.serve())