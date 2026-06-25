from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings

app = FastAPI(
    title="工厂AI SaaS平台 - AI核价引擎",
    description="Factory AI Pricing Engine API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
@app.get("/health")
async def health_check():
    return {
        "code": 200,
        "data": {
            "status": "ok",
            "service": "ai-pricing-engine",
            "version": "0.1.0",
        },
        "message": "success",
    }


@app.get("/api/v1/pricing/calculate")
async def calculate_price_demo():
    return {
        "code": 200,
        "data": {
            "materialCost": 150.0,
            "laborCost": 80.0,
            "manufacturingCost": 50.0,
            "totalCost": 280.0,
            "suggestedPrice": 350.0,
            "marginRate": 0.2,
            "details": {
                "materialBreakdown": [],
                "processBreakdown": [],
            },
        },
        "message": "success",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
