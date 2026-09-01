from backend.blockchain_engine import blockchain

# Anchor a record
anchor_res = blockchain.anchor_evidence(
    record_id="rec_test123",
    post_url="https://x.com/michaeljackson",
    author="x.com",
    title="Michael Jackson Official",
    content_snippet="Test snippet",
    image_hash_sha256="rec_test123",
    phash="1234567890abcdef",
    face_embedding_digest="0.1,0.2,0.3",
    source_platform="Twitter/X"
)

receipt = anchor_res["receipt"]
print("Anchor receipt:", receipt)

# Verify exact same record
verify_res = blockchain.verify_evidence(
    candidate_record_id="rec_test123",
    candidate_tx_id=receipt["tx_id"],
    candidate_post_url="https://x.com/michaeljackson",
    candidate_author="x.com",
    candidate_title="Michael Jackson Official",
    candidate_content_snippet="Test snippet",
    candidate_image_hash="rec_test123",
    candidate_phash="1234567890abcdef",
    candidate_face_digest="0.1,0.2,0.3"
)

print("\nVerify result verified:", verify_res["verified"])
print("Status:", verify_res["status"])
print("Tampered fields:", verify_res.get("tampered_fields"))
for b in verify_res.get("audit_breakdown", []):
    print(" Check:", b["check"], "Passed:", b["passed"])
