"""
Unit tests for Face Detection and Feature Encoding Engine.
"""

import io
import cv2
import numpy as np
from PIL import Image, ImageDraw
from backend.face_engine import FaceEngine


def create_synthetic_face_image() -> bytes:
    """Create a synthetic face image for testing."""
    img = Image.new("RGB", (300, 300), color=(240, 240, 240))
    draw = ImageDraw.Draw(img)
    
    # Face Oval
    draw.ellipse([(60, 40), (240, 260)], fill=(235, 195, 160), outline=(200, 160, 120), width=2)
    # Eyes
    draw.ellipse([(100, 110), (130, 130)], fill=(50, 50, 50))
    draw.ellipse([(170, 110), (200, 130)], fill=(50, 50, 50))
    # Nose
    draw.polygon([(150, 140), (140, 175), (160, 175)], fill=(210, 160, 130))
    # Mouth
    draw.arc([(115, 190), (185, 220)], start=0, end=180, fill=(180, 50, 50), width=3)
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_face_engine_processing():
    engine = FaceEngine()
    raw_bytes = create_synthetic_face_image()
    
    result = engine.process_image(raw_bytes)
    
    assert "sha256" in result
    assert len(result["sha256"]) == 64
    assert "phash" in result
    assert result["face_count"] >= 1
    assert result["primary_face"] is not None
    
    face = result["primary_face"]
    assert "embedding" in face
    assert len(face["embedding"]) == 128
    assert "landmarks" in face
    assert len(face["landmarks"]) > 0
    assert "face_crop_base64" in face
    assert face["face_crop_base64"].startswith("data:image/jpeg;base64,")
    print("[TEST PASSED] Face detection & 128-d embedding extraction succeeded.")


if __name__ == "__main__":
    test_face_engine_processing()
