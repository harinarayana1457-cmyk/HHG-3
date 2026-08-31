import React, { useState } from 'react';
import { Database, ShieldCheck, Cpu, ArrowLeft, ArrowRight, CheckCircle2, Lock, Hash, Sparkles, Key, FileCode } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BlockchainAnchor({ scanData, selectedPost, onAnchorComplete, onBack }) {
  const [mining, setMining] = useState(false);
  const [nonceDisplay, setNonceDisplay] = useState(0);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);

  const recordId = `REC-${selectedPost?.id || '2026'}-${Date.now().toString(36).toUpperCase()}`;

  const handleMineAndAnchor = async () => {
    if (!scanData || !selectedPost) return;
    setMining(true);
    setError(null);

    // Animate nonce search
    const nonceInterval = setInterval(() => {
      setNonceDisplay(prev => prev + Math.floor(Math.random() * 85 + 15));
    }, 40);

    try {
      const res = await fetch("/api/blockchain/anchor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_id: recordId,
          post_url: selectedPost.post_url,
          author: selectedPost.author,
          title: selectedPost.title,
          content_snippet: selectedPost.content_snippet,
          image_hash_sha256: scanData.sha256,
          phash: scanData.phash,
          face_embedding_digest: scanData.primary_face?.embedding_digest || "0".repeat(64),
          source_platform: selectedPost.platform,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || "Failed to anchor evidence to blockchain.");
      }

      // Small delay for dramatic effect
      setTimeout(() => {
        clearInterval(nonceInterval);
        setReceipt(data.receipt);
        setMining(false);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }, 700);

    } catch (err) {
      clearInterval(nonceInterval);
      setMining(false);
      setError(err.message || "Mining operation failed.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold tracking-wider uppercase">
            <Database className="h-4 w-4" />
            <span>Step 3: Blockchain Anchoring & Merkle Proof Generation</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">Immutable Ledger Evidence Anchoring</h2>
          <p className="text-sm text-slate-400 mt-1">
            Commit the discovered post, source author, facial biometric vectors, and raw image hashes to the tamper-evident blockchain.
          </p>
        </div>

        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium self-start md:self-auto transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Matches</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {!receipt ? (
        /* Pre-Mining Preparation View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Transaction Payload Elements (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <FileCode className="h-4 w-4 text-emerald-400" />
                <span>Evidence Transaction Envelope</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                {recordId}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Post and URL */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium block">Source Web Evidence</span>
                <div className="text-white font-semibold">{selectedPost?.title}</div>
                <div className="text-slate-400 text-[11px] truncate">By {selectedPost?.author} • {selectedPost?.post_url}</div>
              </div>

              {/* Hashes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono">Image SHA-256 Fingerprint</span>
                  <div className="text-cyan-300 font-mono text-[11px] truncate">{scanData?.sha256}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono">Biometric Embedding Digest</span>
                  <div className="text-purple-300 font-mono text-[11px] truncate">
                    {scanData?.primary_face?.embedding_digest}
                  </div>
                </div>
              </div>

              {/* Merkle Leaf Preview */}
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-300 font-semibold flex items-center space-x-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Cryptographic Merkle Leaf Hash</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">SHA256(Tx + Img + Face)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Binds post metadata and raw biometric features into an immutable hash tree node. Any post manipulation will invalidate this root.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Mining & Submission Trigger (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Cpu className="h-4 w-4 text-emerald-400" />
                <span>Proof-of-Work & ECDSA Consensus</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Difficulty:</span>
                  <span className="text-emerald-400 font-mono font-semibold">2 Leading Zeros (0x00...)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Validator Authority:</span>
                  <span className="text-slate-200 font-mono">ECDSA secp256k1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Smart Contract Compatibility:</span>
                  <span className="text-cyan-400 font-mono">EVM Solidity ^0.8.20</span>
                </div>
              </div>

              {mining && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-emerald-400 text-sm font-semibold">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400" />
                    <span>Mining Block... Nonce: {nonceDisplay}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Computing SHA-256 Proof-of-Work hash collision...</p>
                </div>
              )}
            </div>

            <button
              onClick={handleMineAndAnchor}
              disabled={mining}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {mining ? (
                <span>Mining & Broadcasting...</span>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  <span>Mine Block & Anchor to Blockchain</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Mined Receipt View */
        <div className="rounded-2xl border border-emerald-500/40 bg-slate-900/80 p-6 md:p-8 space-y-6 shadow-2xl shadow-emerald-500/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <span className="text-xs uppercase font-mono text-emerald-400 tracking-wider">Blockchain Receipt Confirmed</span>
                <h3 className="text-xl font-bold text-white">Block #{receipt.block_number} Successfully Mined</h3>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Mining Duration</span>
              <span className="text-sm font-mono text-emerald-400 font-semibold">{receipt.mining_duration_ms} ms (Nonce: {receipt.nonce})</span>
            </div>
          </div>

          {/* Receipt Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Transaction Hash */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block font-mono uppercase text-[10px]">Transaction ID (Tx Hash)</span>
              <div className="font-mono text-emerald-300 break-all">{receipt.tx_id}</div>
            </div>

            {/* Block Hash */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block font-mono uppercase text-[10px]">Mined Block Hash</span>
              <div className="font-mono text-cyan-300 break-all">{receipt.block_hash}</div>
            </div>

            {/* Merkle Root */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block font-mono uppercase text-[10px]">Merkle Tree Root</span>
              <div className="font-mono text-purple-300 break-all">{receipt.merkle_root}</div>
            </div>

            {/* Previous Hash */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block font-mono uppercase text-[10px]">Previous Block Hash</span>
              <div className="font-mono text-slate-400 break-all">{receipt.previous_hash}</div>
            </div>

            {/* Validator Signature */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 md:col-span-2">
              <span className="text-slate-500 block font-mono uppercase text-[10px]">Validator ECDSA secp256k1 Signature</span>
              <div className="font-mono text-slate-300 break-all text-[11px]">{receipt.tx_signature}</div>
            </div>
          </div>

          {/* Action to proceed to verification */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-xs text-slate-400">
              Evidence is now permanently recorded and verifiable against any attempted tampering.
            </span>

            <button
              onClick={() => onAnchorComplete(receipt)}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
            >
              <span>Test Re-Verification in Tamper Lab</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
