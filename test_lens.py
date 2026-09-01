"""
Extract full matched results from Yandex CbirSection - parse site URLs and image thumbnails.
"""
import requests
from PIL import Image
import io, re, json
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs, unquote

img_path = r'C:/Users/Avvari/.gemini/antigravity/brain/057bf875-5d15-4e0d-a135-1d159e63dcf9/.user_uploaded/media_1788200151170.png'

img = Image.open(img_path).convert('RGB')
img.thumbnail((600, 600))
buf = io.BytesIO()
img.save(buf, format='JPEG', quality=85)
img_bytes = buf.getvalue()

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
})

r = session.post(
    'https://yandex.com/images/search',
    params={'rpt': 'imageview'},
    files={'upfile': ('face.jpg', img_bytes, 'image/jpeg')},
    data={'prg': '1'},
    timeout=20,
    allow_redirects=True
)

text = r.text
soup = BeautifulSoup(text, 'html.parser')

# 1. Extract the "Sites with this image" section
print('=== Sites with this image ===')
sites_section = soup.find(class_=re.compile(r'CbirSites'))
if sites_section:
    site_items = sites_section.find_all(class_=re.compile(r'CbirSites-Item|Link'))
    print('Site items:', len(site_items))
    for item in site_items:
        href = item.get('href', '')
        text_content = item.get_text(strip=True)
        print(f'  {text_content[:40]} -> {href[:100]}')

# 2. Extract the "Similar Images" section  
print('\n=== Similar Images ===')
similar_section = soup.find('section', class_=re.compile(r'CbirSimilar'))
if similar_section:
    # Find all image links in this section
    img_links = similar_section.find_all('a', href=True)
    print('Image links in similar section:', len(img_links))
    for a in img_links[:10]:
        href = a['href']
        # Decode URL param
        if 'url=' in href:
            url_match = re.search(r'url=([^&]+)', href)
            if url_match:
                decoded = unquote(url_match.group(1))
                print('  Image URL:', decoded[:120])
    
    # Also find page_url params
    all_hrefs = [a['href'] for a in similar_section.find_all('a', href=True)]
    print('\nAll hrefs in similar section:')
    for h in all_hrefs[:10]:
        print(' ', h[:150])

# 3. Extract image thumbs and page source URLs from main body
print('\n=== All external links (sources) ===')
all_a = soup.find_all('a', href=True)
for a in all_a:
    href = a['href']
    if href.startswith('http') and 'yandex' not in href:
        print('Source link:', href[:120])
        print('  Text:', a.get_text(strip=True)[:60])

# 4. Try fetching the "sites" tab specifically using cbir_id
cbir_id = re.search(r'cbir_id=([^&]+)', r.url)
if cbir_id:
    cbir = cbir_id.group(1)
    print(f'\nFetching sites tab for cbir_id={cbir}...')
    sites_r = session.get(
        'https://yandex.com/images/search',
        params={
            'cbir_id': unquote(cbir),
            'rpt': 'imageview',
            'format': 'json',
            'request': json.dumps({'blocks': [{'block': 'cbir-sites', 'params': {}, 'version': 2}]})
        },
        timeout=15
    )
    print('Sites tab status:', sites_r.status_code)
    print('Response:', sites_r.text[:500])
