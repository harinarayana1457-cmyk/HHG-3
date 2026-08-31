"""
FaceLedger Launcher Script.
Starts the FastAPI backend server (which serves the compiled React web interface at http://127.0.0.1:8000)
or runs frontend in development mode.
"""

import os
import sys
import webbrowser
import threading
import time
import uvicorn


def open_browser(url: str):
    time.sleep(1.2)
    try:
        webbrowser.open(url)
    except Exception:
        pass


def main():
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    url = f"http://{host}:{port}"

    print("\n" + "=" * 70)
    print("  🚀 FACELEDGER — Face Scan to Blockchain Verification Pipeline")
    print("=" * 70)
    print(f"  • Web Application:     {url}")
    print(f"  • API Documentation:   {url}/docs")
    print(f"  • OpenAPI Spec:        {url}/openapi.json")
    print("=" * 70 + "\n")

    # Launch browser automatically if not in headless environment
    if "--no-browser" not in sys.argv:
        threading.Thread(target=open_browser, args=(url,), daemon=True).start()

    # Run Uvicorn server without intrusive hot-reload restarts on ledger writes
    is_reload = "--reload" in sys.argv
    uvicorn.run("backend.main:app", host=host, port=port, reload=is_reload)


if __name__ == "__main__":
    main()
