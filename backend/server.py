# ==============================================================================
# CodeExplain - Summer Training Internship Project (LPU submission candidate)
# Developed by: Mohammad Fayas Khan (BTech CSE 3rd Year student)
# File: backend/server.py
# Purpose: Entry point for starting the FastAPI application server.
# ==============================================================================

"""
Supervisor / Uvicorn Server Entrypoint.

This python script acts as the main gateway (entry point) for running our backend API.
When we deploy our project or run it locally, the ASGI server tool called Uvicorn
needs to know where to find the application instance.

By default, the Uvicorn command runs:
`uvicorn server:app --host 0.0.0.0 --port 8000`

This means: "Look inside a file named `server.py` (this file) and load the object named `app`".
To keep our code modular, clean, and organized like standard enterprise software,
we write our actual application logic inside the 'app' subdirectory (a Python package).
This entrypoint file simply imports the application object from that package and re-exports it.
"""

# Import the FastAPI application object 'app' from our 'app' package's 'main' module.
# The 'from app.main import app' search looks in app/main.py for the FastAPI() instance variable.
# We add '# noqa: F401' to tell standard linting tools (like Flake8) to ignore the warning
# that we imported the 'app' variable but never directy read or executed it in this file.
from app.main import app  # noqa: F401

# The '__all__' list tells Python what objects should be exported if another script writes
# 'from server import *'. In this case, we only want to expose our 'app' instance.
__all__ = ["app"]
