from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

# CRITICAL: Import models before init_db() so Base.metadata is populated
import models  # noqa: F401

from database import init_db, SessionLocal
from seed import seed_db
from routes.auth import router as auth_router
from routes.boards import router as boards_router
from routes.cards import router as cards_router
from routes.columns import router as columns_router
from routes.ai import router as ai_router

app = FastAPI(title="Project Management API", version="0.1.0")

# Add CORS middleware for development (allow frontend on different port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables
init_db()

# Seed default user + board + columns
with SessionLocal() as db:
    seed_db(db)

# Include routers
app.include_router(auth_router)
app.include_router(boards_router)
app.include_router(cards_router)
app.include_router(columns_router)
app.include_router(ai_router)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "API is running"}


# Mount static files for Next.js frontend
static_dir = Path(__file__).parent / "static"

if static_dir.exists():
    # Mount static assets (CSS, JS, images, etc.)
    app.mount("/_next", StaticFiles(directory=str(static_dir / "_next")), name="static")

    # Serve index.html for root path
    @app.get("/", response_class=HTMLResponse)
    async def serve_index():
        index_path = static_dir / "index.html"
        if index_path.exists():
            return index_path.read_text()
        return "<h1>Frontend not found</h1>"

    # Serve login.html for /login path
    @app.get("/login", response_class=HTMLResponse)
    async def serve_login():
        login_path = static_dir / "login.html"
        if login_path.exists():
            return login_path.read_text()
        # Fallback to index.html if login.html doesn't exist
        index_path = static_dir / "index.html"
        if index_path.exists():
            return index_path.read_text()
        return "<h1>Frontend not found</h1>"
else:
    # Fallback if static build not available
    @app.get("/", response_class=HTMLResponse)
    async def hello_world():
        return """
        <!DOCTYPE html>
        <html>
            <head>
                <title>Project Management MVP</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #032147 0%, #209dd7 100%);
                    }
                    .container {
                        text-align: center;
                        background: white;
                        padding: 40px;
                        border-radius: 8px;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                    }
                    h1 {
                        color: #032147;
                        margin: 0 0 10px 0;
                    }
                    p {
                        color: #888888;
                        margin: 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Hello World</h1>
                    <p>Project Management MVP Backend is running</p>
                </div>
            </body>
        </html>
        """


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
