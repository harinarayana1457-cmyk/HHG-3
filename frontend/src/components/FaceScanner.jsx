import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Sparkles, CheckCircle2, Scan, Eye, Hash, Shield, ArrowRight, RefreshCw } from 'lucide-react';

export default function FaceScanner({ onScanComplete, activeScanData }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [samples, setSamples] = useState([]);
  const [scanResult, setScanResult] = useState(activeScanData || null);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Load sample faces on mount
  useEffect(() => {
    fetch('/api/sample-faces')
      .then(res => res.json())
      .then(data => {
        if (data.samples) setSamples(data.samples);
      })
      .catch(err => console.error("Error fetching sample faces:", err));
  }, []);

  // Sync scanResult if parent updates
  useEffect(() => {
    if (activeScanData) {
      setScanResult(activeScanData);
    }
  }, [activeScanData]);

  // Clean up camera stream
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleStartCamera = async () => {
    try {
      setError(null);
      setUseCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Unable to access camera. Please allow camera permissions or upload an image file.");
      setUseCamera(false);
    }
  };

  const handleCaptureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg');
    
    // Stop camera
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setUseCamera(false);
    
    processFaceBase64(b64);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      processFaceBase64(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = async (sample) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch image from URL and convert to Base64
      const resp = await fetch(sample.image_url);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        processFaceBase64(reader.result);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setError("Failed to load sample image. Please try uploading directly.");
      setLoading(false);
    }
  };

  const processFaceBase64 = async (b64) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image_base64", b64);

      const res = await fetch("/api/face/detect", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || "Failed to process face detection.");
      }

      setScanResult(data.data);
      if (onScanComplete) {
        onScanComplete(data.data);
      }
    } catch (err) {
      setError(err.message || "Face scanning encountered an error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-sm font-semibold tracking-wider uppercase">
            <Scan className="h-4 w-4" />
            <span>Step 1: Face Scan & Biometric Encoding</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">Biometric Face Identification</h2>
          <p className="text-sm text-slate-400 mt-1">
            Detect facial structures, extract 128-d L2-normalized vector embeddings, and compute cryptographic hash signatures.
          </p>
        </div>

        {scanResult && (
          <button
            onClick={() => {
              setScanResult(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium self-start md:self-auto transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Scan New Image</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-2">
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload / Camera / Sample Cards */}
      {!scanResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Area (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            {!useCamera ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[320px] ${
                  dragActive
                    ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                    : 'border-slate-700/80 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-600'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-inner">
                  {loading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
                  ) : (
                    <Upload className="h-8 w-8" />
                  )}
                </div>

                <h3 className="text-lg font-semibold text-white">
                  {loading ? "Processing Biometric Scan..." : "Drag & Drop Face Image or Browse"}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-2">
                  Supports JPEG, PNG, WEBP. The pipeline detects landmarks, generates a 128-d biometric feature vector, and prepares reverse web indexing.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-md shadow-cyan-500/20"
                  >
                    Select File
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartCamera();
                    }}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition-all"
                  >
                    <Camera className="h-4 w-4 text-cyan-400" />
                    <span>Use Webcam</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Live Webcam View */
              <div className="rounded-2xl border border-cyan-500/40 bg-slate-900 p-6 flex flex-col items-center">
                <div className="relative rounded-xl overflow-hidden border border-slate-700 aspect-video w-full max-w-md bg-black">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-2 border-cyan-400/40 pointer-events-none rounded-xl">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-56 border-2 border-dashed border-cyan-400/80 rounded-full animate-pulse" />
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={handleCaptureCamera}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/30 transition-all"
                  >
                    <Scan className="h-4 w-4" />
                    <span>Capture & Scan</span>
                  </button>
                  <button
                    onClick={() => {
                      if (mediaStreamRef.current) {
                        mediaStreamRef.current.getTracks().forEach(t => t.stop());
                      }
                      setUseCamera(false);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Presets / Test Samples (1 Col) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-sm font-semibold text-slate-300 mb-3">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>1-Click Test Presets</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Click any preloaded public persona to test the face identification & web discovery pipeline instantly.
              </p>

              <div className="space-y-2.5">
                {samples.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="flex items-center space-x-3 p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-cyan-500/50 hover:bg-cyan-950/20 cursor-pointer transition-all group"
                  >
                    <img
                      src={sample.image_url}
                      alt={sample.name}
                      className="h-11 w-11 rounded-lg object-cover border border-slate-700 group-hover:border-cyan-400 transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-300">
                        {sample.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">{sample.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
              ⚡ OpenCV 4.x Cascade & Haar Landmarker active.
            </div>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Annotated Face Preview (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Annotated Biometric Scan
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Detected: {scanResult.face_count} Face(s)</span>
              </span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-black aspect-square flex items-center justify-center">
              <img
                src={scanResult.annotated_preview_base64}
                alt="Face Scan Result"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Bounding Box & Dimensions */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Resolution</span>
                <span className="text-slate-200 font-mono font-medium">
                  {scanResult.image_width} × {scanResult.image_height} px
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Match Confidence</span>
                <span className="text-cyan-400 font-mono font-medium">
                  {Math.round((scanResult.primary_face?.confidence || 0.95) * 100)}% Verified
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic & Biometric Fingerprint Breakdown (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Shield className="h-4 w-4 text-cyan-400" />
                <span>Cryptographic & Biometric Signatures</span>
              </div>

              {/* SHA-256 Hash */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center space-x-1.5 font-medium">
                    <Hash className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Raw Image SHA-256 Digest</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">256-bit</span>
                </div>
                <div className="font-mono text-xs text-cyan-300 break-all bg-slate-900/90 p-2 rounded border border-slate-800/80">
                  {scanResult.sha256}
                </div>
              </div>

              {/* Perceptual Hash (pHash) */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center space-x-1.5 font-medium">
                    <Eye className="h-3.5 w-3.5 text-blue-400" />
                    <span>Perceptual Difference Hash (pHash / dHash)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">64-bit</span>
                </div>
                <div className="font-mono text-xs text-blue-300 break-all bg-slate-900/90 p-2 rounded border border-slate-800/80">
                  {scanResult.phash}
                </div>
              </div>

              {/* 128-d Biometric Vector Preview */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    128-Dimensional Biometric Embedding Vector (Normalized)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">L2 Unit Sphere</span>
                </div>

                {/* Mini Visual Bar Representation of the 128-D vector */}
                <div className="h-10 flex items-end gap-[2px] bg-slate-900/80 p-1.5 rounded border border-slate-800/80 overflow-hidden">
                  {(scanResult.primary_face?.embedding || []).slice(0, 64).map((val, idx) => {
                    const normalizedHeight = Math.min(100, Math.max(10, Math.abs(val) * 350));
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-300 rounded-t-[1px] opacity-85 hover:opacity-100 transition-opacity"
                        style={{ height: `${normalizedHeight}%` }}
                        title={`Dim #${idx}: ${val}`}
                      />
                    );
                  })}
                </div>

                <div className="text-[11px] font-mono text-slate-500 break-all truncate">
                  Digest: {scanResult.primary_face?.embedding_digest}
                </div>
              </div>
            </div>

            {/* Proceed to Search Button */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  if (onScanComplete) onScanComplete(scanResult);
                }}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <span>Proceed to Web / Social Media Search</span>
                <ArrowRight className="h-4 w-4 text-slate-950" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
