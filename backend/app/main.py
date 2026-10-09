import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.services.traffic_scheduler import (
    traffic_collection_loop,
)


# ---------------------------------------------
# Background Traffic Collector
# ---------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):

    # Start the automatic traffic collector
    scheduler_task = asyncio.create_task(
        traffic_collection_loop()
    )

    print(
        "M-TRADA traffic scheduler started."
    )

    try:

        yield

    finally:

        # Stop scheduler when FastAPI shuts down
        scheduler_task.cancel()

        try:
            await scheduler_task

        except asyncio.CancelledError:

            print(
                "M-TRADA traffic scheduler stopped."
            )


# ---------------------------------------------
# FastAPI Application
# ---------------------------------------------

app = FastAPI(
    title="M-TRADA API",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------
# CORS
# ---------------------------------------------

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ---------------------------------------------
# API Routes
# ---------------------------------------------

app.include_router(
    api_router
)


# ---------------------------------------------
# Root
# ---------------------------------------------

@app.get("/")
def root():

    return {
        "message": "M-TRADA API Running"
    }