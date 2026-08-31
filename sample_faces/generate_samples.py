"""
Helper script to generate local high quality test face samples for offline evaluation.
"""

import os
from PIL import Image, ImageDraw


def generate_sample_faces():
    os.makedirs("sample_faces", exist_ok=True)

    # 1. Sample 1: Alpha
    img1 = Image.new("RGB", (320, 320), color=(230, 235, 245))
    d1 = ImageDraw.Draw(img1)
    d1.ellipse([(60, 50), (260, 270)], fill=(235, 195, 160), outline=(190, 150, 110), width=2)
    d1.ellipse([(100, 120), (130, 140)], fill=(30, 30, 30))
    d1.ellipse([(190, 120), (220, 140)], fill=(30, 30, 30))
    d1.polygon([(160, 150), (150, 185), (170, 185)], fill=(210, 160, 130))
    d1.arc([(120, 200), (200, 230)], start=0, end=180, fill=(170, 50, 50), width=3)
    img1.save("sample_faces/sample_1_sarah.jpg", "JPEG")

    # 2. Sample 2: Beta
    img2 = Image.new("RGB", (320, 320), color=(245, 240, 235))
    d2 = ImageDraw.Draw(img2)
    d2.ellipse([(70, 45), (250, 275)], fill=(225, 185, 150), outline=(180, 140, 100), width=2)
    d2.ellipse([(105, 115), (135, 135)], fill=(40, 40, 40))
    d2.ellipse([(185, 115), (215, 135)], fill=(40, 40, 40))
    d2.polygon([(160, 145), (152, 180), (168, 180)], fill=(200, 150, 120))
    d2.arc([(125, 205), (195, 235)], start=0, end=180, fill=(160, 60, 60), width=3)
    img2.save("sample_faces/sample_2_david.jpg", "JPEG")

    print("[SUCCESS] Local test face samples generated in sample_faces/ directory.")


if __name__ == "__main__":
    generate_sample_faces()
