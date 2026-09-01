import React, { useState, useRef } from 'react';

export default function App() {
  const [inputImage, setInputImage] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

    try {
      // Step 1: Face Detection
      const formData = new FormData();
      formData.append('image_base64', b64);
      const detectRes = await fetch('/api/face/detect', { method: 'POST', body: formData });
      const detectData = await detectRes.json();
      if (!detectRes.ok || !detectData.success) throw new Error(detectData.detail || 'Face detection failed.');

      const face = detectData.data.primary_face;
      const phash = detectData.data.phash;

      // Step 2: Real Reverse Image Search (Yandex CBIR)
      const searchRes = await fetch('/api/search/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          face_crop_base64: b64,
          embedding: face.embedding,
          phash: phash,
        }),
      });
      const searchData = await searchRes.json();
      if (!searchRes.ok || !searchData.success) throw new Error(searchData.detail || 'Search failed.');

      const matches = searchData.matches || [];
      if (matches.length === 0) throw new Error('No matching images found on the web.');
      setResults(matches);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setInputImage(null);
    setResults([]);
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
      'News': '#f59e0b',
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
      padding: '48px 20px 60px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Title */}
      <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
        Face → Web Match
      </h1>
      <p style={{ color: '#555', fontSize: 13, marginBottom: 44, textAlign: 'center' }}>
        Upload a face image — we search Google, Twitter, Instagram, Pinterest, Wikipedia and more to find where it appears online.
      </p>

      {/* Two-panel */}
      <div style={{
        display: 'flex',
        gap: 32,
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'wrap',
        width: '100%',
        maxWidth: 860,
      }}>
        {/* ---- LEFT: Input ---- */}
        <div style={{ flex: 1, minWidth: 280, maxWidth: 400 }}>
          <p style={{ color: '#555', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
            Input Image
          </p>
          <div
            onClick={() => !inputImage && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
            style={{
              background: '#0f0f0f',
              border: inputImage ? '1.5px solid #222' : '2px dashed #2a2a2a',
              borderRadius: 20,
              minHeight: 380,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputImage ? 'default' : 'pointer',
              overflow: 'hidden',
              position: 'relative',
              transition: 'border-color 0.2s',
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
                style={{ width: '100%', objectFit: 'contain', maxHeight: 460, display: 'block' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>📷</div>
                <p style={{ color: '#333', fontSize: 14, lineHeight: 1.6 }}>
                  Click or drop a face image<br />to start reverse searching
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
                color: '#555', fontSize: 13, cursor: 'pointer',
              }}
            >
              ↺ Try Another Image
            </button>
          )}
        </div>

        {/* ---- RIGHT: Match Result ---- */}
        <div style={{ flex: 1, minWidth: 280, maxWidth: 400 }}>
          <p style={{ color: '#555', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
            Found on the Web
            {results.length > 0 && (
              <span style={{ color: '#333', fontWeight: 400, marginLeft: 8 }}>
                ({results.length} matches via Yandex Reverse Search)
              </span>
            )}
          </p>

          {/* Top matched image */}
          <div style={{
            background: '#0f0f0f',
            border: '1.5px solid #222',
            borderRadius: 20,
            minHeight: 380,
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
                <p style={{ color: '#444', fontSize: 13 }}>Searching Yandex, Google, Twitter, Instagram...</p>
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
                style={{ width: '100%', objectFit: 'contain', maxHeight: 460, display: 'block' }}
                onError={(e) => {
                  // Try next result if image fails to load
                  const nextResult = results.find(r => r.image_url !== e.target.src);
                  if (nextResult) e.target.src = nextResult.image_url;
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>🔍</div>
                <p style={{ color: '#333', fontSize: 13 }}>Matched image will appear here</p>
              </div>
            )}
          </div>

          {/* Source link(s) */}
          {results.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.slice(0, 4).map((r, i) => (
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
                    background: i === 0 ? '#0f1a0f' : '#0f0f0f',
                    border: `1.5px solid ${i === 0 ? '#1a3a1a' : '#1a1a1a'}`,
                    borderRadius: 12,
                    textDecoration: 'none',
                    transition: 'border-color 0.2s',
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
                    color: i === 0 ? '#5af' : '#3a3a4a', fontSize: 12,
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}
