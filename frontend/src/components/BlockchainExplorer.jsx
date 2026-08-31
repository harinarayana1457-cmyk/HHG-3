import React, { useState, useEffect } from 'react';
import { Database, Hash, Layers, ShieldCheck, Search, Copy, Check, Clock, Cpu, Key, ExternalLink, RefreshCw } from 'lucide-react';

export default function BlockchainExplorer() {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHash, setCopiedHash] = useState(null);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blockchain/ledger");
      const data = await res.json();
      setLedger(data);
    } catch (err) {
      console.error("Error fetching ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredBlocks = (ledger?.blocks || []).filter(block => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchesBlock = block.hash.toLowerCase().includes(q) ||
                         block.previous_hash.toLowerCase().includes(q) ||
                         block.merkle_root.toLowerCase().includes(q) ||
                         block.index.toString() === q;
    const matchesTx = (block.transactions || []).some(tx => 
      tx.tx_id.toLowerCase().includes(q) ||
      tx.record_id.toLowerCase().includes(q) ||
      tx.post_url.toLowerCase().includes(q) ||
      tx.author.toLowerCase().includes(q)
    );
    return matchesBlock || matchesTx;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-sm font-semibold tracking-wider uppercase">
            <Database className="h-4 w-4" />
            <span>Immutable Ledger State</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">Blockchain Ledger Explorer</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time inspection of cryptographic blocks, Proof-of-Work headers, Merkle roots, and validator signatures.
          </p>
        </div>

        <button
          onClick={fetchLedger}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium self-start md:self-auto transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Chain</span>
        </button>
      </div>

      {/* Network Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Block Height</span>
            <Layers className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            #{ledger?.block_height || 0}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Genesis + Mined</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Anchored Records</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {ledger?.total_transactions || 0}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Tamper-evident</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mining Target</span>
            <Cpu className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono truncate">
            {ledger?.difficulty || 2} Zeros
          </div>
          <span className="text-[10px] text-purple-400 font-mono">SHA-256 PoW</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Validator Node</span>
            <Key className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xs font-bold text-slate-200 font-mono truncate">
            {ledger?.validator_public_key?.slice(0, 16)}...
          </div>
          <span className="text-[10px] text-amber-400 font-mono">secp256k1 Active</span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Block Number, Block Hash, Tx ID, Record ID, or Author..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Blocks List */}
      <div className="space-y-4">
        {filteredBlocks.length === 0 ? (
          <div className="text-center py-12 border border-slate-800 rounded-2xl bg-slate-900/40 text-slate-500 text-sm">
            No matching blocks or transactions found.
          </div>
        ) : (
          filteredBlocks.map((block) => (
            <div
              key={block.index}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 hover:border-slate-700 transition-colors"
            >
              {/* Block Header Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
                    #{block.index}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>{block.index === 0 ? "Genesis Block (Anchor Root)" : `Block #${block.index}`}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                        Nonce: {block.nonce}
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs text-slate-400 font-mono">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{block.timestamp}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-semibold border border-emerald-800/60">
                    {block.transactions_count} Evidence Tx
                  </span>
                </div>
              </div>

              {/* Hashes Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Block Hash</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-300 text-[11px] truncate mr-2">{block.hash}</span>
                    <button
                      onClick={() => handleCopy(block.hash)}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      {copiedHash === block.hash ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Previous Hash</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-400 text-[11px] truncate mr-2">{block.previous_hash}</span>
                    <button
                      onClick={() => handleCopy(block.previous_hash)}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      {copiedHash === block.previous_hash ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Merkle Root</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-purple-300 text-[11px] truncate mr-2">{block.merkle_root}</span>
                    <button
                      onClick={() => handleCopy(block.merkle_root)}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      {copiedHash === block.merkle_root ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Transactions in Block */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Transactions Recorded ({block.transactions?.length || 0})
                </span>

                <div className="space-y-2">
                  {(block.transactions || []).map((tx, tIdx) => (
                    <div
                      key={tIdx}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded text-[11px] border border-emerald-800/60">
                            {tx.record_id}
                          </span>
                          <span className="text-slate-200 font-semibold">{tx.title}</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">By {tx.author}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                        <div className="truncate">
                          <span className="text-slate-500">Tx ID: </span>
                          <span className="text-slate-300">{tx.tx_id}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">Image SHA-256: </span>
                          <span className="text-cyan-400">{tx.image_hash_sha256}</span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate max-w-sm">Source: {tx.post_url}</span>
                        <a
                          href={tx.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                        >
                          <span>Open Post</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
