#!/usr/bin/env python3
"""
ModelForge AutoML Application Launcher
Starts the unified server hosting both the AutoML Backend API and the React Web Portal.
"""

import os
import sys
import uvicorn

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.append(os.path.join(base_dir, "backend"))

    print("=" * 65)
    print("      ModelForge - Autonomous AutoML & Data Modeling Engine")
    print("=" * 65)
    print("  * Web Portal: http://localhost:8000")
    print("  * API Docs:   http://localhost:8000/docs")
    print("  * Status:     Ready")
    print("=" * 65)

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
