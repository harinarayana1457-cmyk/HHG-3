"""
FaceLedger Launcher Script.
Starts the FastAPI backend server (which serves the compiled React web interface)
with automatic free-port detection and browser launcher.
"""

import os
import sys
import socket
import webbrowser
import threading
import time
import uvicorn

# Ensure UTF-8 stdout on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def is_port_in_use(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0


def find_available_port(host: str, starting_port: int) -> int:
    port = starting_port
    while is_port_in_use(host, port):
        port += 1
    return port


def open_browser(url: str):
    time.sleep(1.2)
    try:
        webbrowser.open(url)
    except Exception:
        pass


def main():
    host = os.environ.get("HOST", "127.0.0.1")
    requested_port = int(os.environ.get("PORT", 8000))
    port = find_available_port(host, requested_port)
    url = f"http://{host}:{port}"

    print("\n" + "=" * 70)
    print("  [FACELEDGER] Face Scan to Blockchain Verification Pipeline")
    print("=" * 70)
    print(f"  * Web Application:     {url}")
    print(f"  * API Documentation:   {url}/docs")
    print(f"  * OpenAPI Spec:        {url}/openapi.json")
    print("=" * 70 + "\n")

    # Launch browser automatically if not in headless environment
    if "--no-browser" not in sys.argv:
        threading.Thread(target=open_browser, args=(url,), daemon=True).start()

    is_reload = "--reload" in sys.argv
    uvicorn.run("backend.main:app", host=host, port=port, reload=is_reload)


if __name__ == "__main__":
    main()
