"""
FaceLedger Launcher Script.
Starts the FastAPI backend server (which serves the compiled React web interface at http://127.0.0.1:8000)
or runs frontend in development mode.
"""

import os
import sys
import subprocess
import uvicorn


def main():
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")

    print("\n" + "=" * 70)
    print("  🚀 FACELEDGER — Face Scan to Blockchain Verification Pipeline")
    print("=" * 70)
    print(f"  • Web Application:     http://{host}:{port}")
    print(f"  • API Documentation:   http://{host}:{port}/docs")
    print(f"  • OpenAPI Spec:        http://{host}:{port}/openapi.json")
    print("=" * 70 + "\n")

    uvicorn.run("backend.main:app", host=host, port=port, reload=True)


if __name__ == "__main__":
    main()
