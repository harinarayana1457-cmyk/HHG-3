"""
Generate 4 distinct test portrait samples.
"""

import os
import io
import base64
from PIL import Image, ImageDraw


def generate_all_samples():
    os.makedirs("sample_faces", exist_ok=True)

    samples = [
        ("sample_1_sarah.jpg", (230, 235, 245), (235, 195, 160), "Sarah Connor"),
        ("sample_2_david.jpg", (245, 240, 235), (225, 185, 150), "David Chen"),
        ("sample_3_elena.jpg", (235, 245, 240), (240, 205, 175), "Elena Rostova"),
        ("sample_4_marcus.jpg", (240, 235, 245), (210, 165, 130), "Marcus Vance"),
    ]

    for fname, bg_color, skin_color, name in samples:
        img = Image.new("RGB", (320, 320), color=bg_color)
        d = ImageDraw.Draw(img)
        # Face Oval
        d.ellipse([(60, 50), (260, 270)], fill=skin_color, outline=(170, 130, 90), width=2)
        # Hair
        d.ellipse([(55, 40), (265, 130)], fill=(50, 40, 35))
        d.ellipse([(70, 60), (250, 270)], fill=skin_color)
        # Eyes
        d.ellipse([(100, 120), (130, 140)], fill=(30, 30, 30))
        d.ellipse([(190, 120), (220, 140)], fill=(30, 30, 30))
        # Eyebrows
        d.line([(95, 110), (135, 110)], fill=(40, 30, 25), width=3)
        d.line([(185, 110), (225, 110)], fill=(40, 30, 25), width=3)
        # Nose
        d.polygon([(160, 145), (150, 185), (170, 185)], fill=(190, 145, 110))
        # Mouth
        d.arc([(120, 205), (200, 235)], start=0, end=180, fill=(170, 50, 50), width=4)
        
        filepath = os.path.join("sample_faces", fname)
        img.save(filepath, "JPEG")
        print(f"Generated {filepath}")


if __name__ == "__main__":
    generate_all_samples()
