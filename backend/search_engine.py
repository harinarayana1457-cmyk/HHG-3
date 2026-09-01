"""
Reverse Web and Social Media Search Engine using Yandex CBIR.
Parses REAL source page URLs from Yandex's "Sites with this image" section.
Prioritises exact matches over visually-similar images.
"""

import re
import time
import hashlib
import io
import requests
from PIL import Image
from bs4 import BeautifulSoup
from typing import Dict, List, Any, Optional
from urllib.parse import unquote, urlparse
import numpy as np


class SearchEngine:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        })

    def calculate_cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        norm_a, norm_b = np.linalg.norm(a), np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    def _image_b64_to_bytes(self, face_crop_b64: str) -> bytes:
        import base64
        if "," in face_crop_b64:
            face_crop_b64 = face_crop_b64.split(",", 1)[1]
        raw = base64.b64decode(face_crop_b64)
        if len(raw) < 1_500_000 and raw.startswith(b'\xff\xd8'):
            return raw
        try:
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            img.thumbnail((800, 800))
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=90)
            return buf.getvalue()
        except Exception:
            return raw

    def _detect_platform(self, url: str) -> str:
        u = url.lower()
        if any(x in u for x in ["twitter.com", "x.com", "twimg.com", "sotwe.com", "vanlett.net", "nitter."]):
            return "Twitter/X"
        if any(x in u for x in ["instagram.com", "cdninstagram.com"]):
            return "Instagram"
        if "reddit.com" in u:
            return "Reddit"
        if any(x in u for x in ["facebook.com", "fbcdn.net"]):
            return "Facebook"
        if any(x in u for x in ["pinterest.com", "pinimg.com"]):
            return "Pinterest"
        if any(x in u for x in ["youtube.com", "ytimg.com"]):
            return "YouTube"
        if "tiktok.com" in u:
            return "TikTok"
        if any(x in u for x in ["wikipedia.org", "wikimedia.org"]):
            return "Wikipedia"
        if any(x in u for x in ["rollingstone", "nrk.no", "nrj.fr", "standard.co.uk",
                                  "holrmagazine", "ohmymag", "epimg", "picmix"]):
            return "News / Media"
        if any(x in u for x in ["michaeljackson.com", "smehost.net"]):
            return "Official Website"
        return "Web"

    def yandex_reverse_image_search(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Upload image to Yandex CBIR and return real results.

        Priority order:
        1. "Sites with this image" – exact image matches with REAL source page URLs
        2. "Similar images"       – visually similar images
        """
        exact_results: List[Dict] = []
        similar_results: List[Dict] = []
        seen_images: set = set()
        seen_pages: set = set()

        try:
            r = self.session.post(
                "https://yandex.com/images/search",
                params={"rpt": "imageview"},
                files={"upfile": ("face.jpg", image_bytes, "image/jpeg")},
                data={"prg": "1"},
                timeout=25,
                allow_redirects=True,
            )
            if r.status_code != 200:
                print(f"[Yandex] Upload failed: {r.status_code}")
                return []

            soup = BeautifulSoup(r.text, "html.parser")

            # ----------------------------------------------------------------
            # 1. "Sites with this image" — EXACT matches with REAL source URLs
            # ----------------------------------------------------------------
            site_items = soup.select(".CbirSites-Item")
            for item in site_items:
                thumb_tag = item.select_one(".Thumb, .CbirSites-ItemThumb a, a[href*='http']")
                title_tag = item.select_one(".CbirSites-ItemTitle a, .Link_view_default, .CbirSites-ItemDomain a")

                img_url = thumb_tag["href"] if thumb_tag and thumb_tag.has_attr("href") else None
                source_url = title_tag["href"] if title_tag and title_tag.has_attr("href") else None
                title_text = title_tag.get_text(strip=True) if title_tag else ""

                if not source_url or not source_url.startswith("http") or "yandex" in source_url:
                    continue

                # Strip tracking params
                clean_url = re.sub(r'[?&]utm_[^&]*', '', source_url).rstrip('?&')
                clean_url = re.sub(r'[?&]refer=[^&]*', '', clean_url).rstrip('?&')

                if clean_url in seen_pages:
                    continue
                seen_pages.add(clean_url)

                if img_url and img_url.startswith("http"):
                    seen_images.add(img_url)
                else:
                    img_url = clean_url

                platform = self._detect_platform(clean_url)
                domain = urlparse(clean_url).netloc
                title = title_text or f"Exact match on {domain}"

                exact_results.append({
                    "id": hashlib.sha256(clean_url.encode()).hexdigest()[:16],
                    "platform": platform,
                    "post_url": clean_url,        # REAL source page URL!
                    "author": domain,
                    "title": title,
                    "content_snippet": f"Exact copy of this image found at {domain} via Yandex Reverse Search.",
                    "image_url": img_url,
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "confidence_score": 0.99,
                    "search_engine": "Yandex — Exact Image Match",
                    "is_exact": True,
                })

            # ----------------------------------------------------------------
            # 2. "Similar Images" — visually similar
            # ----------------------------------------------------------------
            similar_section = soup.find("section", class_=re.compile(r"CbirSimilar"))
            if similar_section:
                for a in similar_section.find_all("a", href=True):
                    href = a["href"]
                    url_match = re.search(r"img_url=([^&]+)", href)
                    if not url_match:
                        continue
                    img_url = unquote(url_match.group(1))
                    if not img_url.startswith("http") or img_url in seen_images:
                        continue
                    seen_images.add(img_url)
                    platform = self._detect_platform(img_url)
                    domain = urlparse(img_url).netloc
                    similar_results.append({
                        "id": hashlib.sha256(img_url.encode()).hexdigest()[:16],
                        "platform": platform,
                        "post_url": img_url,
                        "author": domain,
                        "title": f"Similar image on {domain}",
                        "content_snippet": f"Visually similar image found at {domain}.",
                        "image_url": img_url,
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        "confidence_score": 0.85,
                        "search_engine": "Yandex — Similar Images",
                        "is_exact": False,
                    })

            results = exact_results + similar_results
            print(f"[Yandex] {len(exact_results)} exact + {len(similar_results)} similar = {len(results)} total")
            return results

        except Exception as e:
            print(f"[Yandex] Error: {e}")
            return []

    def search_by_face(
        self,
        face_crop_base64: str,
        embedding: List[float],
        phash: str,
        custom_query: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        image_bytes = self._image_b64_to_bytes(face_crop_base64)
        return self.yandex_reverse_image_search(image_bytes)


# Global singleton
search_engine = SearchEngine()
