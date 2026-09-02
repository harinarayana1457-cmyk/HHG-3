"""
Unit tests for Reverse Search and Social Media Discovery Engine.
"""

import base64
from backend.search_engine import SearchEngine

# Valid minimal JPEG base64
MINIMAL_JPEG_B64 = (
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP"
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAA/9sAQwEAAAAAAAAAAAAAAAAAAAAA"
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    "AAAAAA/8AAEQgAAQABAiEDEQADEQH/xAAWAAEBAQAAAAAAAAAAAAAAAAAA"
    "AAEC/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAA"
    "AAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCv"
    "9P/Z"
)


def test_search_engine():
    engine = SearchEngine()
    results = engine.search_by_face(
        face_crop_base64=MINIMAL_JPEG_B64,
        embedding=[0.1] * 128,
        phash="12345678abcdef00",
        custom_query="biometrics blockchain"
    )
    
    assert isinstance(results, list)
    print(f"[TEST PASSED] Search engine execution succeeded. Returned {len(results)} matches.")


if __name__ == "__main__":
    test_search_engine()
