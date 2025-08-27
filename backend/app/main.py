from fastapi import FastAPI
from app.api import routes

app = FastAPI(title="SmartHealthcare API")

# No prefix — Vercel will add /api externally
app.include_router(routes.router)
