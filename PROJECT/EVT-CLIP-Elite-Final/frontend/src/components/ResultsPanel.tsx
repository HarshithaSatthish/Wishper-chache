import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';

interface Props {
  result: any;
  loading: boolean;
}

const ResultsPanel: React.FC<Props> = ({ result, loading }) => {
  const [showHeatmap, setShowHeatmap] = useState(true);

  if (loading) {
    return (
      <div className="bg-panel rounded-2xl p-8 border border-gray-800 h-full min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full mx-auto mb-4"
          />
          <p className="text-cyan-400 font-mono animate-pulse">Running CLIP Inference...</p>
          <p className="text-gray-500 text-sm mt-2">DAEP → CMI → Segmentation</p>
          <div className="mt-6 flex justify-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-panel rounded-2xl p-8 border border-gray-800 h-full min-h-[500px] flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-10 h-10 text-gray-600" />
          </div>
          <p className="text-lg">No analysis yet</p>
          <p className="text-sm mt-2">Upload and analyze an image to see results</p>
        </div>
      </div>
    );
  }

  const isAnomaly = result.anomaly_score > result.threshold;
  const scorePercent = Math.round(result.anomaly_score * 100);
  const thresholdPercent = Math.round(result.threshold * 100);

  const handleDownload = () => {
    if (result.overlay_base64) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${result.overlay_base64}`;
      link.download = `evt-clip-result-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Score Card */}
      <div className="bg-panel rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-sm font-mono uppercase tracking-wider">Anomaly Score</h3>
          {isAnomaly ? (
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold flex items-center gap-1 border border-red-500/30">
              <AlertTriangle className="w-3 h-3" /> DEFECT DETECTED
            </span>
          ) : (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold flex items-center gap-1 border border-green-500/30">
              <CheckCircle className="w-3 h-3" /> NORMAL
            </span>
          )}
        </div>

        <div className="flex items-end gap-2 mb-4">
          <span className={`text-6xl font-bold font-mono ${isAnomaly ? 'text-red-500' : 'text-green-500'}`}>
            {scorePercent}%
          </span>
          <span className="text-gray-500 mb-2 font-mono">/ {thresholdPercent}% threshold</span>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${scorePercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${isAnomaly ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gradient-to-r from-green-400 to-green-600'}`}
          />
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Processing Time</div>
            <div className="flex items-center gap-1 text-cyan-400 font-mono">
              <Clock className="w-4 h-4" />
              {result.processing_time_ms}ms
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Anomaly Area</div>
            <div className="text-orange-400 font-mono">
              {result.anomaly_area_percent.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Visualization */}
      {result.overlay_base64 && (
        <div className="bg-panel rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-mono uppercase tracking-wider">Localization Heatmap</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowHeatmap(!showHeatmap)}
                className="text-xs px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                {showHeatmap ? 'Show Overlay' : 'Show Heatmap'}
              </button>
              <button 
                onClick={handleDownload}
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
              >
                <Download className="w-3 h-3" /> Save
              </button>
            </div>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-gray-700">
            <img 
              src={`data:image/png;base64,${showHeatmap ? result.heatmap_base64 : result.overlay_base64}`}
              alt="Anomaly Result"
              className="w-full"
            />
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs font-mono">
              {showHeatmap ? 'Heatmap' : 'Overlay'}
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            {showHeatmap 
              ? 'Raw anomaly heatmap showing pixel-level anomaly scores' 
              : 'Overlay on original image with anomaly localization'}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ResultsPanel;
