from backend.search_engine import search_engine
from PIL import Image
import io, base64

img_path = r'C:/Users/Avvari/.gemini/antigravity/brain/057bf875-5d15-4e0d-a135-1d159e63dcf9/.user_uploaded/media_1788200151170.png'

img = Image.open(img_path).convert('RGB')
img.thumbnail((600, 600))
buf = io.BytesIO()
img.save(buf, format='JPEG', quality=85)
img_bytes = buf.getvalue()

b64 = 'data:image/jpeg;base64,' + base64.b64encode(img_bytes).decode()

results = search_engine.search_by_face(b64, [0.1]*128, 'phash123')

exact = [r for r in results if r.get('is_exact')]
similar = [r for r in results if not r.get('is_exact')]

print(f'EXACT matches from Sites: {len(exact)}')
for i, r in enumerate(exact):
    print(f'[EXACT {i+1}]')
    print(f'  Platform: {r["platform"]}')
    print(f'  Image:    {r["image_url"][:100]}')
    print(f'  Source:   {r["post_url"][:100]}')
    print(f'  Engine:   {r["search_engine"]}')
    print()

print(f'SIMILAR matches: {len(similar)}')
print('First 3:')
for r in similar[:3]:
    print(f'  Image: {r["image_url"][:80]}')
    print(f'  URL:   {r["post_url"][:80]}')
    print()
