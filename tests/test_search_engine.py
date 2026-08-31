"""
Unit tests for Reverse Search and Social Media Discovery Engine.
"""

from backend.search_engine import SearchEngine


def test_search_engine():
    engine = SearchEngine()
    results = engine.search_by_face(
        face_crop_base64="data:image/jpeg;base64,dummy",
        embedding=[0.1] * 128,
        phash="12345678abcdef00",
        custom_query="biometrics blockchain"
    )
    
    assert len(results) >= 1
    first = results[0]
    assert "post_url" in first
    assert "author" in first
    assert "platform" in first
    assert "confidence_score" in first
    assert 0.0 <= first["confidence_score"] <= 1.0
    print(f"[TEST PASSED] Search engine returned {len(results)} matches. Top match: {first['title']}")


if __name__ == "__main__":
    test_search_engine()
