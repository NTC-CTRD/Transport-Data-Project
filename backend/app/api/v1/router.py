from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router

from app.api.v1.endpoints.users import router as users_router

from app.api.v1.endpoints.projects import router as projects_router

from app.api.v1.endpoints.corridors import router as corridors_router

from app.api.v1.endpoints.routes import router as routes_router

from app.api.v1.endpoints.observations import router as observations_router

from app.api.v1.endpoints.segment_observations import (
    router as segment_observations_router,
)

from app.api.v1.endpoints.analytics import (
    router as analytics_router,
)

from app.api.v1.endpoints import exports


api_router = APIRouter()


api_router.include_router(
    auth_router
)

api_router.include_router(
    analytics_router
)

api_router.include_router(
    users_router
)

api_router.include_router(
    projects_router
)

api_router.include_router(
    corridors_router
)

api_router.include_router(
    routes_router
)

api_router.include_router(
    observations_router
)

api_router.include_router(
    segment_observations_router
)

api_router.include_router(
    exports.router
)