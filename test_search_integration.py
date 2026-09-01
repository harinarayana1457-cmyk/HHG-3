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
print(f'Total real results: {len(results)}')
for i, r in enumerate(results):
    platform = r['platform']
    author = r['author']
    image_url = r['image_url'][:80]
    post_url = r['post_url'][:80]
    print(f'[{i+1}] {platform} | {author}')
    print(f'     Image: {image_url}')
    print(f'     URL:   {post_url}')
    print()
