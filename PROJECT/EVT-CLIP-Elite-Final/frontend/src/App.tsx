import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Activity, BarChart3, Github } from 'lucide-react';
import UploadPanel from './components/UploadPanel';
import ResultsPanel from './components/ResultsPanel';
import MetricsCard from './components/MetricsCard';
import { checkHealth } from './api/client';
import { HealthStatus } from './types';
import './index.css';

function App() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check API health on mount
    checkHealth()
      .then(setHealth)
      .catch((err) => console.error('Health check failed:', err));
  }, []);

  const handleResult = (data: any) => {
    setResult(data);
    setError(null);
  };

  const handleError = (err: Error) => {
    setError(err.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-navy text-white font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-dark-navy/90 backdrop-blur-md border-b border-cyan-500/20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="w-8 h-8 text-cyan-400" />
              <motion.div 
                className="absolute inset-0 bg-cyan-400 blur-lg opacity-50"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                EVT-CLIP
              </h1>
              <p className="text-xs text-gray-500 font-mono">v2.0 Production</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {health && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono ${
                health.model_loaded ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${health.model_loaded ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                {health.model_loaded ? 'Model Ready' : 'Model Offline'}
              </div>
            )}
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <Github className="w-6 h-6" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-4 font-sora">
              Zero-Shot <span className="text-cyan-400">Anomaly Detection</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Detect industrial defects without training on defective samples. 
              Powered by CLIP with Dynamic Attention-Enhanced Prompts.
            </p>
          </motion.div>

          {/* Error Banner */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <MetricsCard label="Mean AUROC" value="95.2%" trend="+2.1%" color="cyan" />
            <MetricsCard label="Mean PRO" value="90.6%" trend="+1.8%" color="blue" />
            <MetricsCard label="Inference" value="<3s" trend="GPU" color="green" />
            <MetricsCard label="Backbone" value="ViT-L-14" trend="336px" color="orange" />
          </div>

          {/* Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <UploadPanel 
              onResult={handleResult} 
              setLoading={setLoading}
              onError={handleError}
            />
            <ResultsPanel result={result} loading={loading} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <p>EVT-CLIP v2.0 | Production-Ready Zero-Shot Anomaly Segmentation</p>
        <p className="mt-2 text-xs">Built with PyTorch, FastAPI & React</p>
      </footer>
    </div>
  );
}

export default App;
