import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Settings, ImageIcon, X } from 'lucide-react';
import { analyzeImage } from '../api/client';
import { AnalysisParams } from '../types';

interface Props {
  onResult: (data: any) => void;
  setLoading: (loading: boolean) => void;
  onError: (error: Error) => void;
}

const UploadPanel: React.FC<Props> = ({ onResult, setLoading, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [advanced, setAdvanced] = useState(false);

  const [params, setParams] = useState<AnalysisParams>({
    text_good: "a photo of a flawless industrial component without any defects",
    text_damaged: "a photo of a damaged industrial component with visible defects",
    temperature: 100,
    top_k: 64
  });

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith('image/')) {
      handleFile(droppedFile);
    }
  }, []);

  const handleFile = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      onError(new Error('File too large (max 10MB)'));
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await analyzeImage(file, params);
      onResult(result);
    } catch (error) {
      onError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Upload Zone */}
      <div 
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
          ${isDragging ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_40px_rgba(0,229,255,0.2)]' : 'border-gray-700 bg-panel'}
        `}
      >
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
            <button 
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="mt-2 text-sm text-gray-400 font-mono">{file?.name}</p>
          </div>
        ) : (
          <div className="py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-cyan-400" />
            </div>
            <p className="text-lg font-medium text-gray-300">Drop industrial image here</p>
            <p className="text-sm text-gray-500 mt-2">or click to browse (PNG, JPG, WebP)</p>
            <p className="text-xs text-gray-600 mt-4 font-mono">Max 10MB</p>
          </div>
        )}
      </div>

      {/* Prompts */}
      <div className="bg-panel rounded-2xl p-6 border border-gray-800">
        <h3 className="text-sm font-mono text-gray-400 mb-4 uppercase tracking-wider">Text Prompts</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-cyan-400 mb-2">NORMAL / GOOD</label>
            <textarea 
              value={params.text_good}
              onChange={(e) => setParams(p => ({...p, text_good: e.target.value}))}
              className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-cyan-400 focus:outline-none transition-colors resize-none h-20"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-orange-400 mb-2">ANOMALY / DAMAGED</label>
            <textarea 
              value={params.text_damaged}
              onChange={(e) => setParams(p => ({...p, text_damaged: e.target.value}))}
              className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-orange-400 focus:outline-none transition-colors resize-none h-20"
            />
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-panel rounded-2xl border border-gray-800 overflow-hidden">
        <button 
          onClick={() => setAdvanced(!advanced)}
          className="w-full px-6 py-4 flex items-center justify-between text-gray-400 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Advanced Settings</span>
          </div>
          <motion.div animate={{ rotate: advanced ? 180 : 0 }} transition={{ duration: 0.2 }}>
            ▼
          </motion.div>
        </button>

        {advanced && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            className="px-6 pb-6 space-y-4 border-t border-gray-800 pt-4"
          >
            <div>
              <label className="text-xs text-gray-500 mb-1 block flex justify-between">
                <span>Temperature</span>
                <span className="text-cyan-400">{params.temperature}</span>
              </label>
              <input 
                type="range" min="50" max="200" 
                value={params.temperature}
                onChange={(e) => setParams(p => ({...p, temperature: parseInt(e.target.value)}))}
                className="w-full accent-cyan-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block flex justify-between">
                <span>Top-K Patches</span>
                <span className="text-cyan-400">{params.top_k}</span>
              </label>
              <input 
                type="range" min="32" max="128" 
                value={params.top_k}
                onChange={(e) => setParams(p => ({...p, top_k: parseInt(e.target.value)}))}
                className="w-full accent-cyan-400"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Analyze Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleAnalyze}
        disabled={!file}
        className={`
          w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2
          ${file 
            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40' 
            : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
        `}
      >
        <Upload className="w-5 h-5" />
        {file ? 'Analyze Image' : 'Upload an Image First'}
      </motion.button>
    </motion.div>
  );
};

export default UploadPanel;
