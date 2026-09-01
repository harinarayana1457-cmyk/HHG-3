import React, { useState, useRef } from 'react';

export default function App() {
  const [inputImage, setInputImage] = useState(null);
  const [inputImageB64, setInputImageB64] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [resultLink, setResultLink] = useState(null);
  const [resultTitle, setResultTitle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setInputImage(e.target.result);
      setInputImageB64(e.target.result);
      runPipeline(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const runPipeline = async (b64) => {
    setLoading(true);
    setError(null);
    setResultImage(null);
    setResultLink(null);
    setResultTitle(null);

    try {
      // Step 1: Face Detection
      const formData = new FormData();
      formData.append('image_base64', b64);
      const detectRes = await fetch('/api/face/detect', { method: 'POST', body: formData });
      const detectData = await detectRes.json();
      if (!detectRes.ok || !detectData.success) throw new Error(detectData.detail || 'Face detection failed.');

      const face = detectData.data.primary_face;
      const phash = detectData.data.phash;

      // Step 2: Web Search
      const searchRes = await fetch('/api/search/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          face_crop_base64: face.face_crop_base64,
          embedding: face.embedding,
          phash: phash,
        }),
      });
      const searchData = await searchRes.json();
      if (!searchRes.ok || !searchData.success) throw new Error(searchData.detail || 'Web search failed.');

      const topMatch = searchData.matches?.[0];
      if (!topMatch) throw new Error('No matching posts found.');

      setResultImage(topMatch.image_url);
      setResultLink(topMatch.post_url);
      setResultTitle(topMatch.title);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setInputImage(null);
    setInputImageB64(null);
    setResultImage(null);
    setResultLink(null);
    setResultTitle(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '40px 20px',
    }}>
      {/* Title */}
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
        Face → Social Media Match
      </h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 40, textAlign: 'center' }}>
        Upload a face image. We'll find the matching social media post and show you the result image + link.
      </p>

      {/* Two-panel layout */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 32,
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'wrap',
        width: '100%',
        maxWidth: 900,
      }}>
        {/* LEFT: Input Image */}
        <div style={{ flex: 1, minWidth: 300, maxWidth: 420 }}>
          <p style={{ color: '#888', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Input Image
          </p>
          <div
            onClick={() => !inputImage && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              background: inputImage ? '#000' : '#111',
              border: inputImage ? '2px solid #333' : '2px dashed #333',
              borderRadius: 16,
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
                style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: 420 }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                <p style={{ color: '#555', fontSize: 14 }}>Click or drag & drop an image here</p>
              </div>
            )}
          </div>

          {inputImage && !loading && (
            <button
              onClick={reset}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '10px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 10,
                color: '#888',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ↺ Upload New Image
            </button>
          )}
        </div>

        {/* RIGHT: Result Image + Link */}
        <div style={{ flex: 1, minWidth: 300, maxWidth: 420 }}>
          <p style={{ color: '#888', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Matched Social Media Result
          </p>
          <div style={{
            background: '#111',
            border: '2px solid #333',
            borderRadius: 16,
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
                  width: 48, height: 48, border: '3px solid #333', borderTopColor: '#0af',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
                }} />
                <p style={{ color: '#555', fontSize: 14 }}>Searching social media...</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                <p style={{ color: '#e55', fontSize: 13 }}>{error}</p>
              </div>
            ) : resultImage ? (
              <img
                src={resultImage}
                alt="Match Result"
                style={{ width: '100%', objectFit: 'contain', maxHeight: 420 }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p style={{ color: '#444', fontSize: 14 }}>Result will appear here after upload</p>
              </div>
            )}
          </div>

          {/* Result Link */}
          {resultLink && (
            <div style={{ marginTop: 12, padding: '12px 16px', background: '#111', border: '1px solid #222', borderRadius: 12 }}>
              {resultTitle && (
                <p style={{ color: '#aaa', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{resultTitle}</p>
              )}
              <a
                href={resultLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#0af',
                  fontSize: 13,
                  textDecoration: 'none',
                  wordBreak: 'break-all',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                🔗 {resultLink}
              </a>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
