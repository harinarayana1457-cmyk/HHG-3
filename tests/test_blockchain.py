"""
Unit tests for Cryptographic Blockchain Ledger, Merkle Trees, and Tamper Verification.
"""

import os
import hashlib
from backend.blockchain_engine import BlockchainLedger, MerkleTree, VerifierAuthority


def test_merkle_tree():
    leaves = ["leaf1", "leaf2", "leaf3", "leaf4"]
    tree = MerkleTree(leaves)
    assert tree.root is not None
    assert len(tree.root) == 64
    
    # Audit proof test
    proof = tree.get_proof(1)
    is_valid = MerkleTree.verify_proof(leaves[1], proof, tree.root)
    assert is_valid is True
    
    # Invalid proof test
    is_invalid = MerkleTree.verify_proof("fake_leaf", proof, tree.root)
    assert is_invalid is False
    print("[TEST PASSED] Merkle Tree creation and audit path verification succeeded.")


def test_verifier_authority():
    auth = VerifierAuthority(key_file="test_key.pem")
    msg = "Test blockchain transaction data"
    sig = auth.sign(msg)
    assert auth.verify(msg, sig) is True
    assert auth.verify(msg + " altered", sig) is False
    if os.path.exists("test_key.pem"):
        os.remove("test_key.pem")
    print("[TEST PASSED] ECDSA digital signature creation and verification succeeded.")


def test_blockchain_anchoring_and_verification():
    test_storage = "test_ledger.json"
    if os.path.exists(test_storage):
        os.remove(test_storage)
        
    bc = BlockchainLedger(storage_path=test_storage)
    assert len(bc.chain) == 1  # Genesis block
    
    # Anchor evidence
    res = bc.anchor_evidence(
        record_id="REC-TEST-2026-001",
        post_url="https://x.com/techuser/status/123456789",
        author="@techuser",
        title="AI Biometric Verification Summit",
        content_snippet="Presenting blockchain verification for social media images.",
        image_hash_sha256="a" * 64,
        phash="12345678abcdef00",
        face_embedding_digest="b" * 64,
        source_platform="Twitter/X"
    )
    
    assert res["success"] is True
    receipt = res["receipt"]
    assert receipt["block_number"] == 1
    assert receipt["block_hash"].startswith("00")  # Difficulty 2
    
    # Verify Authentic Evidence
    verify_res = bc.verify_evidence(
        candidate_record_id="REC-TEST-2026-001",
        candidate_post_url="https://x.com/techuser/status/123456789",
        candidate_author="@techuser",
        candidate_content_snippet="Presenting blockchain verification for social media images.",
        candidate_image_hash="a" * 64,
        candidate_face_digest="b" * 64,
    )
    assert verify_res["verified"] is True
    assert verify_res["status"] == "VERIFIED_AUTHENTIC"
    assert len(verify_res["tampered_fields"]) == 0
    
    # Test Tamper Detection (e.g. Altered Image Hash)
    tamper_res = bc.verify_evidence(
        candidate_record_id="REC-TEST-2026-001",
        candidate_post_url="https://x.com/techuser/status/123456789",
        candidate_author="@techuser",
        candidate_content_snippet="Presenting blockchain verification for social media images.",
        candidate_image_hash="f" * 64,  # TAMPERED HASH!
        candidate_face_digest="b" * 64,
    )
    assert tamper_res["verified"] is False
    assert tamper_res["status"] == "TAMPER_DETECTED"
    assert "image_hash_sha256" in tamper_res["tampered_fields"]
    
    # Cleanup
    if os.path.exists(test_storage):
        os.remove(test_storage)
    print("[TEST PASSED] Blockchain evidence anchoring, mining, and tamper detection succeeded.")


if __name__ == "__main__":
    test_merkle_tree()
    test_verifier_authority()
    test_blockchain_anchoring_and_verification()
