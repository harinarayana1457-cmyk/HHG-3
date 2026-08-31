"""
FastAPI Application Server for Face Scan to Blockchain Verification Pipeline.
Provides endpoints for face detection, reverse web search, blockchain evidence anchoring,
re-verification, and ledger exploration.
"""

import io
import os
import base64
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.face_engine import face_engine
from backend.search_engine import search_engine
from backend.blockchain_engine import blockchain

app = FastAPI(
    title="Face Scan to Blockchain Verification API",
    description="End-to-end pipeline connecting facial biometric recognition, web/social media discovery, and tamper-evident blockchain verification.",
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request & Response Schemas
class SearchRequest(BaseModel):
    face_crop_base64: str
    embedding: Optional[List[float]] = None
    phash: Optional[str] = None
    query: Optional[str] = None


class AnchorRequest(BaseModel):
    record_id: str
    post_url: str
    author: str
    title: str
    content_snippet: str
    image_hash_sha256: str
    phash: str
    face_embedding_digest: str
    source_platform: Optional[str] = "Web"


class VerifyRequest(BaseModel):
    candidate_record_id: Optional[str] = None
    candidate_tx_id: Optional[str] = None
    candidate_post_url: Optional[str] = None
    candidate_author: Optional[str] = None
    candidate_title: Optional[str] = None
    candidate_content_snippet: Optional[str] = None
    candidate_image_hash: Optional[str] = None
    candidate_phash: Optional[str] = None
    candidate_face_digest: Optional[str] = None


class TamperDemoRequest(BaseModel):
    tx_id: str
    field_to_alter: str
    altered_value: str


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "blockchain_height": len(blockchain.chain),
        "latest_block_hash": blockchain.latest_block.hash,
        "validator_pubkey": blockchain.authority.public_key_hex[:16] + "...",
        "modules": ["face_engine", "search_engine", "blockchain_engine"],
    }


@app.post("/api/face/detect")
async def detect_face(
    image: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None)
):
    """
    Process input face image:
    Detects faces, landmarks, 128-d embeddings, pHash, and SHA-256 fingerprint.
    """
    try:
        image_bytes = None
        if image is not None:
            image_bytes = await image.read()
        elif image_base64:
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            image_bytes = base64.b64decode(image_base64)
        else:
            raise HTTPException(status_code=400, detail="No image provided.")

        result = face_engine.process_image(image_bytes)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search/web")
async def search_web(payload: SearchRequest):
    """
    Reverse search web and social media for matching posts given the face scan.
    """
    try:
        results = search_engine.search_by_face(
            face_crop_base64=payload.face_crop_base64,
            embedding=payload.embedding or [],
            phash=payload.phash or "",
            custom_query=payload.query
        )
        return {"success": True, "count": len(results), "matches": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/blockchain/anchor")
async def anchor_evidence(payload: AnchorRequest):
    """
    Anchor a discovered post + face evidence onto the blockchain.
    Mines a new block and returns the transaction receipt.
    """
    try:
        result = blockchain.anchor_evidence(
            record_id=payload.record_id,
            post_url=payload.post_url,
            author=payload.author,
            title=payload.title,
            content_snippet=payload.content_snippet,
            image_hash_sha256=payload.image_hash_sha256,
            phash=payload.phash,
            face_embedding_digest=payload.face_embedding_digest,
            source_platform=payload.source_platform or "Web",
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/blockchain/verify")
async def verify_evidence(payload: VerifyRequest):
    """
    Re-verify candidate data against on-chain blockchain records.
    Detects any tampering in URL, author, content, image hash, or face digest.
    """
    try:
        result = blockchain.verify_evidence(
            candidate_record_id=payload.candidate_record_id,
            candidate_tx_id=payload.candidate_tx_id,
            candidate_post_url=payload.candidate_post_url,
            candidate_author=payload.candidate_author,
            candidate_title=payload.candidate_title,
            candidate_content_snippet=payload.candidate_content_snippet,
            candidate_image_hash=payload.candidate_image_hash,
            candidate_phash=payload.candidate_phash,
            candidate_face_digest=payload.candidate_face_digest,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/blockchain/tamper-demo")
async def tamper_demo(payload: TamperDemoRequest):
    """
    Demonstrate real-time cryptographic failure when modifying a recorded post.
    """
    try:
        result = blockchain.simulate_tamper_demo(
            tx_id=payload.tx_id,
            field_to_alter=payload.field_to_alter,
            altered_value=payload.altered_value
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/blockchain/ledger")
async def get_ledger():
    """
    Get all blocks, transactions, and state for the Blockchain Explorer.
    """
    try:
        return blockchain.get_ledger_state()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sample-faces")
async def get_sample_faces():
    """
    Return built-in sample face presets for quick one-click testing.
    """
    samples = [
        {
            "id": "sample-1",
            "name": "Sarah Connor (Tech Leader)",
            "description": "Public speaker & keynote portrait",
            "image_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
        },
        {
            "id": "sample-2",
            "name": "David Chen (Software Architect)",
            "description": "Developer advocate and open source contributor",
            "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
        },
        {
            "id": "sample-3",
            "name": "Elena Rostova (Forensic Researcher)",
            "description": "Digital media forensics researcher",
            "image_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80",
        },
        {
            "id": "sample-4",
            "name": "Marcus Vance (AI Specialist)",
            "description": "Biometric systems analyst",
            "image_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
        }
    ]
    return {"samples": samples}


# Serve built frontend static files if present
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    from fastapi.responses import FileResponse
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
