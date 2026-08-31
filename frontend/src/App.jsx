import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FaceScanner from './components/FaceScanner';
import WebSearch from './components/WebSearch';
import BlockchainAnchor from './components/BlockchainAnchor';
import VerificationLab from './components/VerificationLab';
import BlockchainExplorer from './components/BlockchainExplorer';
import { Scan, Globe, Database, ShieldCheck, Check } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [pipelineStep, setPipelineStep] = useState(1);
  const [scanData, setScanData] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [anchoredReceipt, setAnchoredReceipt] = useState(null);
  const [blockchainStatus, setBlockchainStatus] = useState(null);

  // Poll blockchain status
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setBlockchainStatus(data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleScanComplete = (data) => {
    setScanData(data);
    setPipelineStep(2);
  };

  const handleSelectPostForAnchor = (post) => {
    setSelectedPost(post);
    setPipelineStep(3);
  };

  const handleAnchorComplete = (receipt) => {
    setAnchoredReceipt(receipt);
    fetchStatus();
    setPipelineStep(4);
  };

  const steps = [
    { num: 1, label: "Face Identification", icon: Scan },
    { num: 2, label: "Web / Social Search", icon: Globe },
    { num: 3, label: "Blockchain Anchor", icon: Database },
    { num: 4, label: "Tamper Re-Verification", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col bg-grid-pattern">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        blockchainStatus={blockchainStatus}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'pipeline' && (
          <div className="space-y-8">
            {/* Step Progress Tracker */}
            <div className="border border-slate-800/80 bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {steps.map((step) => {
                  const isCompleted = pipelineStep > step.num;
                  const isActive = pipelineStep === step.num;
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.num}
                      onClick={() => {
                        // Allow clicking back to completed steps
                        if (isCompleted || (step.num === 2 && scanData) || (step.num === 3 && selectedPost) || (step.num === 4 && anchoredReceipt)) {
                          setPipelineStep(step.num);
                        }
                      }}
                      className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'border-cyan-500/80 bg-cyan-950/30 text-cyan-300 shadow-md shadow-cyan-500/10'
                          : isCompleted
                          ? 'border-emerald-800/60 bg-emerald-950/20 text-emerald-400'
                          : 'border-slate-800/60 bg-slate-950/40 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isActive
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isCompleted ? <Check className="h-4 w-4" /> : step.num}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-mono block text-slate-400">Step 0{step.num}</span>
                        <span className="text-xs font-semibold truncate block text-slate-200">{step.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pipeline Step Views */}
            {pipelineStep === 1 && (
              <FaceScanner
                onScanComplete={handleScanComplete}
                activeScanData={scanData}
              />
            )}

            {pipelineStep === 2 && (
              <WebSearch
                scanData={scanData}
                onSelectPostForAnchor={handleSelectPostForAnchor}
                onBack={() => setPipelineStep(1)}
              />
            )}

            {pipelineStep === 3 && (
              <BlockchainAnchor
                scanData={scanData}
                selectedPost={selectedPost}
                onAnchorComplete={handleAnchorComplete}
                onBack={() => setPipelineStep(2)}
              />
            )}

            {pipelineStep === 4 && (
              <VerificationLab
                initialReceipt={anchoredReceipt}
              />
            )}
          </div>
        )}

        {activeTab === 'explorer' && <BlockchainExplorer />}

        {activeTab === 'verifier' && <VerificationLab initialReceipt={anchoredReceipt} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>FaceLedger — End-to-End Forensic Biometric to Blockchain Pipeline</span>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span className="text-cyan-400">OpenCV 4.x</span>
            <span>•</span>
            <span className="text-emerald-400">SHA-256 Merkle Ledger</span>
            <span>•</span>
            <span className="text-purple-400">Solidity EVM Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
