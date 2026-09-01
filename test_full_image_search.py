import requests
from bs4 import BeautifulSoup
from PIL import Image
import io, re, base64
from backend.search_engine import search_engine

# Test with FULL image bytes (what user uploaded)
img_path = r'C:/Users/Avvari/.gemini/antigravity/brain/057bf875-5d15-4e0d-a135-1d159e63dcf9/.user_uploaded/media_1788200151170.png'
with open(img_path, 'rb') as f:
    full_img_bytes = f.read()

b64 = 'data:image/png;base64,' + base64.b64encode(full_img_bytes).decode()

# Run search with full image base64
results = search_engine.search_by_face(b64, [0.1]*128, 'phash123')

print(f"Results for FULL image upload: {len(results)}")
for i, r in enumerate(results[:10]):
    print(f"[{i+1}] Platform: {r['platform']} | Exact: {r.get('is_exact')}")
    print(f"     Title: {r['title']}")
    print(f"     URL:   {r['post_url']}")
    print(f"     Image: {r['image_url']}")
    print()
