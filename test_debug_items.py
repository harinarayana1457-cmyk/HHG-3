import requests
from bs4 import BeautifulSoup
from PIL import Image
import io, re

img_path = r'C:/Users/Avvari/.gemini/antigravity/brain/057bf875-5d15-4e0d-a135-1d159e63dcf9/.user_uploaded/media_1788200151170.png'
img = Image.open(img_path).convert('RGB')
img.thumbnail((600, 600))
buf = io.BytesIO()
img.save(buf, format='JPEG', quality=85)
img_bytes = buf.getvalue()

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
})

r = session.post(
    "https://yandex.com/images/search",
    params={"rpt": "imageview"},
    files={"upfile": ("face.jpg", img_bytes, "image/jpeg")},
    data={"prg": "1"},
    timeout=25,
)

soup = BeautifulSoup(r.text, "html.parser")

items = soup.find_all(class_=re.compile(r"CbirSites-Item"))
print(f"Total CbirSites-Item elements: {len(items)}")

for i, item in enumerate(items):
    print(f"\n--- Item {i+1} ---")
    for a in item.find_all("a", href=True):
        print(f"  class={a.get('class')} | href={a['href']} | text={a.get_text(strip=True)[:50]}")
