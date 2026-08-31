import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, RefreshCw, AlertTriangle, Hash, Lock, FileCode, Search, Terminal } from 'lucide-react';

export default function VerificationLab({ initialReceipt }) {
  const [recordId, setRecordId] = useState(initialReceipt?.record_id || '');
  const [txId, setTxId] = useState(initialReceipt?.tx_id || '');
  const [candidateUrl, setCandidateUrl] = useState(initialReceipt?.post_url || '');
  const [candidateAuthor, setCandidateAuthor] = useState('');
  const [candidateContent, setCandidateContent] = useState('');
  const [candidateImageHash, setCandidateImageHash] = useState(initialReceipt?.image_hash_sha256 || '');
  const [candidateFaceDigest, setCandidateFaceDigest] = useState(initialReceipt?.face_embedding_digest || '');

  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [originalRecord, setOriginalRecord] = useState(null);
  const [error, setError] = useState(null);

  // Auto-fill from initialReceipt or load ledger record
  useEffect(() => {
    if (initialReceipt) {
      setRecordId(initialReceipt.record_id || '');
      setTxId(initialReceipt.tx_id || '');
      setCandidateUrl(initialReceipt.post_url || '');
      setCandidateImageHash(initialReceipt.image_hash_sha256 || '');
      setCandidateFaceDigest(initialReceipt.face_embedding_digest || '');
      handleRunVerification(initialReceipt.record_id, initialReceipt.tx_id);
    }
  }, [initialReceipt]);

  const handleRunVerification = async (rId, tId) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        candidate_record_id: rId !== undefined ? rId : (recordId || undefined),
        candidate_tx_id: tId !== undefined ? tId : (txId || undefined),
        candidate_post_url: candidateUrl || undefined,
        candidate_author: candidateAuthor || undefined,
        candidate_content_snippet: candidateContent || undefined,
        candidate_image_hash: candidateImageHash || undefined,
        candidate_face_digest: candidateFaceDigest || undefined,
      };

      const res = await fetch("/api/blockchain/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Verification failed to execute.");
      }

      setVerificationResult(data);
      if (data.on_chain_record) {
        setOriginalRecord(data.on_chain_record);
        if (!candidateAuthor) setCandidateAuthor(data.on_chain_record.author);
        if (!candidateContent) setCandidateContent(data.on_chain_record.content_snippet);
        if (!candidateUrl) setCandidateUrl(data.on_chain_record.post_url);
        if (!candidateImageHash) setCandidateImageHash(data.on_chain_record.image_hash_sha256);
        if (!candidateFaceDigest) setCandidateFaceDigest(data.on_chain_record.face_embedding_digest);
      }
    } catch (err) {
      setError(err.message || "Verification request failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTamper = (type) => {
    if (!originalRecord) return;
    if (type === 'author') {
      setCandidateAuthor('@unauthorized_deepfake_source');
    } else if (type === 'image') {
      setCandidateImageHash('f' + candidateImageHash.slice(1));
    } else if (type === 'content') {
      setCandidateContent(candidateContent + ' [TAMPERED_MODIFICATION_STRING]');
    } else if (type === 'restore') {
      setCandidateAuthor(originalRecord.author);
      setCandidateContent(originalRecord.content_snippet);
      setCandidateUrl(originalRecord.post_url);
      setCandidateImageHash(originalRecord.image_hash_sha256);
      setCandidateFaceDigest(originalRecord.face_embedding_digest);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2 text-cyan-400 text-sm font-semibold tracking-wider uppercase">
          <ShieldCheck className="h-4 w-4" />
          <span>Step 4: Tamper-Proof Cryptographic Verification Lab</span>
        </div>
        <h2 className="text-2xl font-bold text-white mt-1">On-Chain Evidence Audit & Tamper Simulator</h2>
        <p className="text-sm text-slate-400 mt-1">
          Cryptographically re-verify candidate data against immutable blockchain blocks. Test deliberate alterations to see real-time tamper alerts.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-2">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tamper Input Controls (6 Cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span>Candidate Evidence Under Audit</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Live Input Buffer</span>
          </div>

          {/* Quick Tamper Injection Buttons */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Simulate Real-Time Tamper Attack:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyTamper('author')}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-xs font-medium transition-all"
              >
                Alter Author
              </button>
              <button
                type="button"
                onClick={() => handleApplyTamper('image')}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-xs font-medium transition-all"
              >
                Alter Image Hash (1 Byte)
              </button>
              <button
                type="button"
                onClick={() => handleApplyTamper('content')}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-xs font-medium transition-all"
              >
                Mutate Post Text
              </button>
              <button
                type="button"
                onClick={() => handleApplyTamper('restore')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/60 text-emerald-300 text-xs font-medium transition-all ml-auto"
              >
                Restore Authentic Data
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Evidence Record ID</label>
              <input
                type="text"
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
                placeholder="e.g. REC-x_post_778102a-..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Post Source URL</label>
              <input
                type="text"
                value={candidateUrl}
                onChange={(e) => setCandidateUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Author / Publisher</label>
                <input
                  type="text"
                  value={candidateAuthor}
                  onChange={(e) => setCandidateAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Transaction ID (Tx Hash)</label>
                <input
                  type="text"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  placeholder="Optional SHA256 Tx Hash"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Post Content & Headline</label>
              <textarea
                rows={2}
                value={candidateContent}
                onChange={(e) => setCandidateContent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Image SHA-256 Fingerprint</label>
              <input
                type="text"
                value={candidateImageHash}
                onChange={(e) => setCandidateImageHash(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-cyan-300 text-[11px] focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            onClick={() => handleRunVerification()}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            <span>{loading ? "Auditing On-Chain Hashes..." : "Re-Verify Against Blockchain"}</span>
          </button>
        </div>

        {/* Right: Verification Proof Audit Report (6 Cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Cryptographic Audit Status
              </span>
              {verificationResult && (
                <span className="text-xs font-mono text-slate-400">
                  Block #{verificationResult.block_number || '?'}
                </span>
              )}
            </div>

            {verificationResult ? (
              <div className="space-y-4">
                {/* Master Badge */}
                {verificationResult.verified ? (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex items-center space-x-3 glow-emerald">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-emerald-300">VERIFIED AUTHENTIC</h4>
                      <p className="text-xs text-emerald-400/80">
                        100% cryptographic match. Merkle root, image digest, and author signatures are valid.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 flex items-center space-x-3 glow-rose">
                    <div className="h-10 w-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-rose-300">TAMPER DETECTED / INVALID</h4>
                      <p className="text-xs text-rose-400/80">
                        Cryptographic violation detected in: {verificationResult.tampered_fields?.join(', ') || 'Payload mismatch'}.
                      </p>
                    </div>
                  </div>
                )}

                {/* Audit Checklist */}
                <div className="space-y-2 text-xs">
                  {(verificationResult.audit_breakdown || []).map((audit, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                        audit.passed
                          ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                          : 'bg-rose-950/30 border-rose-800/80 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {audit.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                        )}
                        <span className="font-medium">{audit.check}</span>
                      </div>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                        audit.passed ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400 font-bold'
                      }`}>
                        {audit.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Merkle Root Path info */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
                  <span className="text-slate-500 uppercase block text-[10px]">On-Chain Merkle Root</span>
                  <div className="text-purple-300 break-all">{verificationResult.merkle_root || 'N/A'}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs">
                Run verification to inspect cryptographic signatures and audit Merkle tree validity.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between">
            <span>Validator: secp256k1</span>
            <span>Tamper Sensitivity: 1-bit exact</span>
          </div>
        </div>
      </div>
    </div>
  );
}
