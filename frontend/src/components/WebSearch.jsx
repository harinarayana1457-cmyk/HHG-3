import React, { useState, useEffect } from 'react';
import { Search, Globe, ExternalLink, ShieldCheck, ArrowLeft, ArrowRight, Check, Sparkles, Filter, AlertCircle } from 'lucide-react';

export default function WebSearch({ scanData, onSelectPostForAnchor, onBack }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [customQuery, setCustomQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [error, setError] = useState(null);

  // Execute initial search when scanData is provided
  useEffect(() => {
    if (scanData) {
      handleExecuteSearch();
    }
  }, [scanData]);

  const handleExecuteSearch = async (queryOverride) => {
    if (!scanData?.primary_face) return;
    setLoading(true);
    setError(null);
    try {
      const q = (queryOverride !== undefined ? queryOverride : customQuery).trim();
      const res = await fetch("/api/search/web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          face_crop_base64: scanData.primary_face.face_crop_base64,
          embedding: scanData.primary_face.embedding,
          phash: scanData.phash,
          query: q || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || "Search request failed.");
      }

      setResults(data.matches || []);
      if (data.matches && data.matches.length > 0) {
        setSelectedPost(data.matches[0]);
      }
    } catch (err) {
      setError(err.message || "Failed to complete reverse web search.");
    } finally {
      setLoading(false);
    }
  };

  const getPlatformBadge = (platform) => {
    const map = {
      'Twitter/X': 'bg-sky-950 text-sky-400 border-sky-800',
      'Reddit': 'bg-orange-950 text-orange-400 border-orange-800',
      'Instagram': 'bg-fuchsia-950 text-fuchsia-400 border-fuchsia-800',
      'LinkedIn': 'bg-blue-950 text-blue-400 border-blue-800',
      'Wikipedia/Media': 'bg-emerald-950 text-emerald-400 border-emerald-800',
    };
    return map[platform] || 'bg-slate-900 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-sm font-semibold tracking-wider uppercase">
            <Globe className="h-4 w-4" />
            <span>Step 2: Reverse Web & Social Media Search</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">Discovered Web & Social Matches</h2>
          <p className="text-sm text-slate-400 mt-1">
            Reverse image query and multi-engine crawling locate public posts, articles, and media matching facial features.
          </p>
        </div>

        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium self-start md:self-auto transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Face Scan</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Query Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch()}
            placeholder="Search keywords or filter platforms (e.g. 'summit keynote', 'tech interview', 'profile')..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <button
          onClick={() => handleExecuteSearch()}
          disabled={loading}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span>{loading ? "Searching Web..." : "Run Web Search"}</span>
        </button>
      </div>

      {/* Discovered Posts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Results List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            <span>Discovered Matches ({results.length})</span>
            <span>Sorted by Facial Match %</span>
          </div>

          {loading ? (
            <div className="border border-slate-800/80 rounded-2xl bg-slate-900/30 p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <Globe className="h-6 w-6 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h4 className="text-base font-semibold text-white">Searching Global Web & Social Indexes...</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Crawling Twitter/X, Reddit, LinkedIn, Instagram, and news media using facial biometric signatures.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-10 text-center">
              <p className="text-sm text-slate-400">No matching posts found. Try running a broader keyword search above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((item) => {
                const isSelected = selectedPost?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedPost(item)}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                        : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Thumbnail */}
                      <div className="w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content details */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${getPlatformBadge(item.platform)}`}>
                            {item.platform}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] text-slate-400 font-mono">Confidence:</span>
                            <span className="text-xs font-bold text-cyan-400 font-mono">
                              {Math.round(item.confidence_score * 100)}%
                            </span>
                          </div>
                        </div>

                        <h4 className="text-sm font-semibold text-white hover:text-cyan-300 transition-colors line-clamp-1">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {item.content_snippet}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                          <span className="text-slate-300 font-medium">By {item.author}</span>
                          <a
                            href={item.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            <span className="truncate max-w-[160px]">{item.post_url}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Post & Anchor Action Preview (1 Col) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col justify-between space-y-5 sticky top-20 h-fit">
          {selectedPost ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Selected for Blockchain Proof</span>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-800 aspect-video bg-black">
                <img
                  src={selectedPost.image_url}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Platform & Author</span>
                  <span className="text-slate-200 font-semibold">{selectedPost.platform} — {selectedPost.author}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Post URL</span>
                  <a
                    href={selectedPost.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 break-all hover:underline"
                  >
                    {selectedPost.post_url}
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block">Publication Timestamp</span>
                  <span className="text-slate-300 font-mono">{selectedPost.timestamp}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">Ready to Anchor</span>
                <p className="text-[11px] leading-relaxed">
                  Proceeding will generate a deterministic Merkle leaf binding this post URL, author, raw image SHA-256, and 128-d face embedding into the blockchain ledger.
                </p>
              </div>

              <button
                onClick={() => onSelectPostForAnchor(selectedPost)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <span>Upload to Blockchain</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a discovered post from the list to preview and anchor.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
