"""
End-to-end integration tests for FastAPI REST API endpoints.
"""

import asyncio
import base64
import httpx
from backend.main import app
from tests.test_face_engine import create_synthetic_face_image


async def run_api_tests():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["blockchain_height"] >= 1
        print("[API TEST PASSED] Health check endpoint OK.")

        # 2. Face detection
        img_bytes = create_synthetic_face_image()
        b64_str = base64.b64encode(img_bytes).decode("utf-8")
        
        face_resp = await client.post(
            "/api/face/detect",
            data={"image_base64": b64_str}
        )
        assert face_resp.status_code == 200
        face_json = face_resp.json()
        assert face_json["success"] is True
        assert "data" in face_json
        assert face_json["data"]["face_count"] >= 1
        print("[API TEST PASSED] Face detection endpoint OK.")

        face_data = face_json["data"]
        primary = face_data["primary_face"]

        # 3. Web & Social Media Search
        search_resp = await client.post(
            "/api/search/web",
            json={
                "face_crop_base64": primary["face_crop_base64"],
                "embedding": primary["embedding"],
                "phash": face_data["phash"],
                "query": "biometrics identity"
            }
        )
        assert search_resp.status_code == 200
        search_json = search_resp.json()
        assert search_json["success"] is True
        assert len(search_json["matches"]) >= 1
        match = search_json["matches"][0]
        print(f"[API TEST PASSED] Web & Social Search OK (found {len(search_json['matches'])} matches).")

        # 4. Anchor to blockchain
        rec_id = f"REC-E2E-{match['id']}"
        anchor_resp = await client.post(
            "/api/blockchain/anchor",
            json={
                "record_id": rec_id,
                "post_url": match["post_url"],
                "author": match["author"],
                "title": match["title"],
                "content_snippet": match["content_snippet"],
                "image_hash_sha256": face_data["sha256"],
                "phash": face_data["phash"],
                "face_embedding_digest": primary["embedding_digest"],
                "source_platform": match["platform"]
            }
        )
        assert anchor_resp.status_code == 200
        anchor_json = anchor_resp.json()
        assert anchor_json["success"] is True
        receipt = anchor_json["receipt"]
        assert receipt["block_number"] >= 1
        print(f"[API TEST PASSED] Blockchain Anchoring OK (Mined Block #{receipt['block_number']}).")

        # 5. Verify authentic record
        verify_resp = await client.post(
            "/api/blockchain/verify",
            json={
                "candidate_record_id": receipt["record_id"],
                "candidate_post_url": match["post_url"],
                "candidate_author": match["author"],
                "candidate_content_snippet": match["content_snippet"],
                "candidate_image_hash": face_data["sha256"],
                "candidate_face_digest": primary["embedding_digest"],
            }
        )
        assert verify_resp.status_code == 200
        verify_json = verify_resp.json()
        assert verify_json["verified"] is True
        assert verify_json["status"] == "VERIFIED_AUTHENTIC"
        print("[API TEST PASSED] Blockchain Authentic Re-verification OK.")

        # 6. Tamper Detection: Modify author
        tamper_resp = await client.post(
            "/api/blockchain/verify",
            json={
                "candidate_record_id": receipt["record_id"],
                "candidate_post_url": match["post_url"],
                "candidate_author": "@unauthorized_spoofer",
                "candidate_content_snippet": match["content_snippet"],
                "candidate_image_hash": face_data["sha256"],
                "candidate_face_digest": primary["embedding_digest"],
            }
        )
        assert tamper_resp.status_code == 200
        tamper_json = tamper_resp.json()
        assert tamper_json["verified"] is False
        assert tamper_json["status"] == "TAMPER_DETECTED"
        assert "author" in tamper_json["tampered_fields"]
        print("[API TEST PASSED] Cryptographic Tamper Alert OK (Tampered author flagged).")

        # 7. Ledger state
        ledger_resp = await client.get("/api/blockchain/ledger")
        assert ledger_resp.status_code == 200
        ledger_json = ledger_resp.json()
        assert ledger_json["block_height"] >= 2
        print(f"[API TEST PASSED] Blockchain Ledger OK (Current Height: {ledger_json['block_height']}).")


if __name__ == "__main__":
    asyncio.run(run_api_tests())
