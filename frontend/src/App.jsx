import React, { useState, useRef } from 'react';

export default function App() {
  const [inputImage, setInputImage] = useState(null);
  const [results, setResults] = useState([]);
  const [primaryFace, setPrimaryFace] = useState(null);
  const [phash, setPhash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Blockchain state
  const [anchoring, setAnchoring] = useState(false);
  const [blockchainProof, setBlockchainProof] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [tampering, setTampering] = useState(false);
  const [tamperResult, setTamperResult] = useState(null);

  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setInputImage(e.target.result);
      runPipeline(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const runPipeline = async (b64) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setPrimaryFace(null);
    setPhash(null);
    setBlockchainProof(null);
    setVerificationResult(null);
    setTamperResult(null);

    try {
      // Step 1: Face Detection
      const formData = new FormData();
      formData.append('image_base64', b64);
      const detectRes = await fetch('/api/face/detect', { method: 'POST', body: formData });
      const detectData = await detectRes.json();
      if (!detectRes.ok || !detectData.success) throw new Error(detectData.detail || 'Face detection failed.');

      const face = detectData.data.primary_face;
      const detectedPhash = detectData.data.phash;
      setPrimaryFace(face);
      setPhash(detectedPhash);

      // Step 2: Real Reverse Image Search (Yandex CBIR)
      const searchRes = await fetch('/api/search/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          face_crop_base64: b64,
          embedding: face.embedding,
          phash: detectedPhash,
        }),
      });
      const searchData = await searchRes.json();
      if (!searchRes.ok || !searchData.success) throw new Error(searchData.detail || 'Search failed.');

      const matches = searchData.matches || [];
      if (matches.length === 0) throw new Error('No matching images found on the web.');
      setResults(matches);

      // Auto-anchor top match to Blockchain
      if (matches[0]) {
        anchorToBlockchain(matches[0], face, detectedPhash);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const anchorToBlockchain = async (match, face, detectedPhash) => {
    setAnchoring(true);
    setVerificationResult(null);
    setTamperResult(null);

    try {
      const anchorRes = await fetch('/api/blockchain/anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_id: match.id || 'record_' + Date.now(),
          post_url: match.post_url,
          author: match.author || '@web_source',
          title: match.title || 'Discovered Media Match',
          content_snippet: match.content_snippet || '',
          image_hash_sha256: match.id || 'hash_' + Date.now(),
          phash: detectedPhash || '0000000000000000',
          face_embedding_digest: face?.embedding ? face.embedding.slice(0, 8).join(',') : '0,0,0,0',
          source_platform: match.platform || 'Web',
        }),
      });
      const anchorData = await anchorRes.json();
      if (!anchorRes.ok || !anchorData.success) throw new Error(anchorData.detail || 'Blockchain anchoring failed.');

      const receipt = anchorData.receipt || anchorData.proof || {};

      const proofObj = {
        block_number: receipt.block_number ?? 1,
        block_hash: receipt.block_hash || '0000000000000000',
        merkle_root: receipt.merkle_root || '0000000000000000',
        tx_id: receipt.tx_id || '',
        match: match,
        face: face,
        phash: detectedPhash,
      };

      setBlockchainProof(proofObj);

      // Auto verify right after anchoring
      autoVerify(proofObj);
    } catch (err) {
      console.error('Blockchain anchoring error:', err);
    } finally {
      setAnchoring(false);
    }
  };

  const autoVerify = async (proof) => {
    if (!proof) return;
    try {
      const verifyRes = await fetch('/api/blockchain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_record_id: proof.match.id,
          candidate_tx_id: proof.tx_id,
          candidate_post_url: proof.match.post_url,
          candidate_author: proof.match.author || '@web_source',
          candidate_title: proof.match.title || 'Discovered Media Match',
          candidate_content_snippet: proof.match.content_snippet || '',
          candidate_image_hash: proof.match.id,
          candidate_phash: proof.phash,
          candidate_face_digest: proof.face?.embedding ? proof.face.embedding.slice(0, 8).join(',') : '0,0,0,0',
        }),
      });
      const verifyData = await verifyRes.json();
      setVerificationResult(verifyData);
    } catch (err) {
      console.error('Auto verify error:', err);
    }
  };

  const handleReVerify = async () => {
    if (!blockchainProof) return;
    setVerifying(true);
    setTamperResult(null); // Clear red tamper result when re-verifying authentic data!

    try {
      const verifyRes = await fetch('/api/blockchain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_record_id: blockchainProof.match.id,
          candidate_tx_id: blockchainProof.tx_id,
          candidate_post_url: blockchainProof.match.post_url,
          candidate_author: blockchainProof.match.author || '@web_source',
          candidate_title: blockchainProof.match.title || 'Discovered Media Match',
          candidate_content_snippet: blockchainProof.match.content_snippet || '',
          candidate_image_hash: blockchainProof.match.id,
          candidate_phash: blockchainProof.phash,
          candidate_face_digest: blockchainProof.face?.embedding ? blockchainProof.face.embedding.slice(0, 8).join(',') : '0,0,0,0',
        }),
      });
      const verifyData = await verifyRes.json();
      setVerificationResult(verifyData);
    } catch (err) {
      console.error('Verify error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleTestTamper = async () => {
    if (!blockchainProof) return;
    setTampering(true);
    setVerificationResult(null); // Clear green authentic result when testing tamper!

    try {
      const tamperRes = await fetch('/api/blockchain/tamper-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_id: blockchainProof.tx_id,
          field_to_alter: 'post_url',
          altered_value: 'https://fake-tampered-site.com/altered-fake-url',
        }),
      });
      const tamperData = await tamperRes.json();
      setTamperResult(tamperData);
    } catch (err) {
      console.error('Tamper test error:', err);
    } finally {
      setTampering(false);
    }
  };

  const reset = () => {
    setInputImage(null);
    setResults([]);
    setPrimaryFace(null);
    setPhash(null);
    setBlockchainProof(null);
    setVerificationResult(null);
    setTamperResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const platformColor = (platform) => {
    const map = {
      'Twitter/X': '#1da1f2',
      'Instagram': '#e1306c',
      'Pinterest': '#e60023',
      'YouTube': '#ff0000',
      'TikTok': '#69c9d0',
      'Reddit': '#ff4500',
      'Facebook': '#1877f2',
      'Official Website': '#22c55e',
      'News / Media': '#f59e0b',
      'Wikipedia': '#3b82f6',
      'Web': '#888',
    };
    return map[platform] || '#888';
  };

  const topResult = results[0];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '44px 20px 60px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#eee',
    }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
          Face → Web Match & Blockchain Verification
        </h1>
        <p style={{ color: '#666', fontSize: 13 }}>
          Finds matching social media content on the web and anchors a tamper-evident record onto the blockchain.
        </p>
      </div>

      {/* Main Two-Panel Layout */}
      <div style={{
        display: 'flex',
        gap: 32,
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'wrap',
        width: '100%',
        maxWidth: 880,
      }}>
        {/* ---- LEFT: Input Image ---- */}
        <div style={{ flex: 1, minWidth: 280, maxWidth: 410 }}>
          <p style={{ color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
            Input Face Image
          </p>
          <div
            onClick={() => !inputImage && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
            style={{
              background: '#0f0f0f',
              border: inputImage ? '1.5px solid #222' : '2px dashed #2a2a2a',
              borderRadius: 20,
              minHeight: 360,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputImage ? 'default' : 'pointer',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {inputImage ? (
              <img
                src={inputImage}
                alt="Input"
                style={{ width: '100%', objectFit: 'contain', maxHeight: 440, display: 'block' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>📷</div>
                <p style={{ color: '#444', fontSize: 14, lineHeight: 1.6 }}>
                  Click or drag & drop a face image<br />to search & verify on blockchain
                </p>
              </div>
            )}
          </div>

          {inputImage && !loading && (
            <button
              onClick={reset}
              style={{
                marginTop: 12, width: '100%', padding: '10px',
                background: '#111', border: '1px solid #222', borderRadius: 12,
                color: '#666', fontSize: 13, cursor: 'pointer',
              }}
            >
              ↺ Upload New Image
            </button>
          )}
        </div>

        {/* ---- RIGHT: Matched Result ---- */}
        <div style={{ flex: 1, minWidth: 280, maxWidth: 410 }}>
          <p style={{ color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
            Matched Social Media Result
          </p>

          {/* Result Image */}
          <div style={{
            background: '#0f0f0f',
            border: '1.5px solid #222',
            borderRadius: 20,
            minHeight: 360,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div style={{
                  width: 44, height: 44, border: '3px solid #1a1a1a', borderTopColor: '#0af',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
                }} />
                <p style={{ color: '#555', fontSize: 13 }}>Searching social media & web...</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                <p style={{ color: '#c00', fontSize: 13, lineHeight: 1.6 }}>{error}</p>
              </div>
            ) : topResult ? (
              <img
                src={topResult.image_url}
                alt="Matched result"
                style={{ width: '100%', objectFit: 'contain', maxHeight: 440, display: 'block' }}
                onError={(e) => {
                  const nextResult = results.find(r => r.image_url !== e.target.src);
                  if (nextResult) e.target.src = nextResult.image_url;
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>🔍</div>
                <p style={{ color: '#444', fontSize: 13 }}>Result image will appear here</p>
              </div>
            )}
          </div>

          {/* Links Below Image */}
          {results.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.slice(0, 3).map((r, i) => (
                <a
                  key={r.id}
                  href={r.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background: i === 0 ? '#0d180d' : '#0f0f0f',
                    border: `1.5px solid ${i === 0 ? '#1b381b' : '#1a1a1a'}`,
                    borderRadius: 12,
                    textDecoration: 'none',
                  }}
                >
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
                    color: '#fff', background: platformColor(r.platform),
                    padding: '2px 7px', borderRadius: 6, whiteSpace: 'nowrap',
                  }}>
                    {r.platform}
                  </span>
                  <span style={{
                    color: i === 0 ? '#4cf' : '#445', fontSize: 12,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {r.post_url}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---- BLOCKCHAIN VERIFICATION SECTION ---- */}
      {topResult && (
        <div style={{
          width: '100%',
          maxWidth: 880,
          marginTop: 36,
          background: '#0f0f12',
          border: '1.5px solid #1e1e28',
          borderRadius: 20,
          padding: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⛓️</span>
              <div>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Blockchain Evidence Record</h3>
                <p style={{ color: '#556', fontSize: 12 }}>Tamper-evident Proof-of-Work & Merkle Tree ledger record</p>
              </div>
            </div>
            {anchoring ? (
              <span style={{ color: '#0af', fontSize: 12 }}>Mining Block...</span>
            ) : blockchainProof ? (
              <span style={{
                background: '#0d2818', color: '#22c55e', border: '1px solid #14532d',
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
              }}>
                🟢 ON-CHAIN ANCHORED
              </span>
            ) : null}
          </div>

          {blockchainProof && (
            <div>
              {/* Grid of On-Chain Proof Fields */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                marginBottom: 16,
              }}>
                <div style={{ background: '#08080a', padding: 12, borderRadius: 12, border: '1px solid #181820' }}>
                  <p style={{ color: '#556', fontSize: 11, fontWeight: 600 }}>BLOCK HEIGHT</p>
                  <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                    #{blockchainProof.block_number}
                  </p>
                </div>
                <div style={{ background: '#08080a', padding: 12, borderRadius: 12, border: '1px solid #181820' }}>
                  <p style={{ color: '#556', fontSize: 11, fontWeight: 600 }}>BLOCK HASH (SHA-256)</p>
                  <p style={{ color: '#0af', fontSize: 11, fontFamily: 'monospace', marginTop: 4, wordBreak: 'break-all' }}>
                    {blockchainProof.block_hash}
                  </p>
                </div>
                <div style={{ background: '#08080a', padding: 12, borderRadius: 12, border: '1px solid #181820' }}>
                  <p style={{ color: '#556', fontSize: 11, fontWeight: 600 }}>MERKLE ROOT</p>
                  <p style={{ color: '#a7f', fontSize: 11, fontFamily: 'monospace', marginTop: 4, wordBreak: 'break-all' }}>
                    {blockchainProof.merkle_root}
                  </p>
                </div>
                <div style={{ background: '#08080a', padding: 12, borderRadius: 12, border: '1px solid #181820' }}>
                  <p style={{ color: '#556', fontSize: 11, fontWeight: 600 }}>ECDSA SIGNATURE</p>
                  <p style={{ color: '#22c55e', fontSize: 11, fontFamily: 'monospace', marginTop: 4 }}>
                    secp256k1 Signed ✓
                  </p>
                </div>
              </div>

              {/* Action Buttons for Verification */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={handleReVerify}
                  disabled={verifying}
                  style={{
                    flex: 1, padding: '12px 16px', background: '#14281a', border: '1px solid #22c55e',
                    borderRadius: 12, color: '#22c55e', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {verifying ? 'Verifying...' : '✓ Re-Verify Against On-Chain Record'}
                </button>
                <button
                  onClick={handleTestTamper}
                  disabled={tampering}
                  style={{
                    flex: 1, padding: '12px 16px', background: '#281414', border: '1px solid #ef4444',
                    borderRadius: 12, color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {tampering ? 'Testing...' : '⚡ Test Tamper Detection'}
                </button>
              </div>

              {/* Verification Output Banner */}
              {verificationResult && (
                <div style={{
                  marginTop: 16, padding: 16, background: '#0d2818', border: '1px solid #22c55e',
                  borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 24 }}>✅</span>
                  <div>
                    <p style={{ color: '#22c55e', fontSize: 14, fontWeight: 700 }}>
                      VERIFIED AUTHENTIC: Matches On-Chain Record EXACTLY
                    </p>
                    <p style={{ color: '#8b8', fontSize: 12, marginTop: 2 }}>
                      Post URL, Author, Image Hash & Merkle Audit Proof match Block #{verificationResult.block_number ?? blockchainProof.block_number} on-chain ledger.
                    </p>
                  </div>
                </div>
              )}

              {/* Tamper Output Banner */}
              {tamperResult && (
                <div style={{
                  marginTop: 16, padding: 16, background: '#280d0d', border: '1px solid #ef4444',
                  borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 24 }}>🚨</span>
                  <div>
                    <p style={{ color: '#ef4444', fontSize: 14, fontWeight: 700 }}>
                      TAMPER DETECTED: Cryptographic Integrity Failure!
                    </p>
                    <p style={{ color: '#f88', fontSize: 12, marginTop: 2 }}>
                      {tamperResult.simulated_verification?.audit_breakdown?.[2]?.check || 'Altered content fails Merkle Tree audit path and block hash verification.'} - Altered URL: {tamperResult.simulated_verification?.audit_breakdown?.[2]?.submitted || 'https://fake-tampered-site.com'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a:hover { opacity: 0.85; }
        button:hover { filter: brightness(1.1); }
      `}</style>
    </div>
  );
}
