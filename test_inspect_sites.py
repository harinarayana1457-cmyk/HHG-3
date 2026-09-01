"""Inspect the CbirSites HTML structure in Yandex response."""
from bs4 import BeautifulSoup

with open('yandex_response.html', 'r', encoding='utf-8', errors='replace') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
sites_section = soup.find(class_=lambda c: c and 'CbirSites' in c)

if sites_section:
    print('=== CbirSites section found ===')
    print('Class:', sites_section.get('class'))
    
    # Print all direct child elements
    all_a = sites_section.find_all('a', href=True, limit=30)
    print(f'Found {len(all_a)} <a> tags')
    for i, a in enumerate(all_a):
        href = a['href']
        text = a.get_text(strip=True)[:60]
        print(f'  [{i}] href={href[:100]}')
        print(f'       text={text}')
    
    # Show raw HTML of first 2000 chars of section
    print('\n=== First 3000 chars of section HTML ===')
    print(str(sites_section)[:3000])
else:
    print('CbirSites NOT found')
    # Check what sections exist
    all_sections = soup.find_all(class_=lambda c: c and 'Cbir' in c)
    print('All Cbir* sections:')
    for s in all_sections:
        print(' ', s.get('class'), str(s)[:80])
