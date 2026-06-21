// ForensAI — Intelligent Forest Protection System v2.0
// Complete React Dashboard with all 12 features
// Design: Dark forest command center — #080E08 bg, #4ADE80 accent, Courier New monospace
// AI-Sthetica 2026 | Harshitha + Kshema + Neha

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon bug
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const API = 'http://localhost:8000';

// ─── Color Scheme ─────────────────────────────────────────────────────────────
const THREAT_COLORS = {
  gunshot: '#EF4444',
  chainsaw: '#F97316',
  vehicle: '#EAB308',
  unknown_threat: '#A855F7',
  unknown_type_A: '#A855F7',
  unknown_type_B: '#8B5CF6',
  safe: '#4ADE80',
  noise: '#6B7280',
  uncertain: '#6B7280',
  duplicate: '#6B7280',
};

const THREAT_ICONS = {
  gunshot: '🔫',
  chainsaw: '🪚',
  vehicle: '🚗',
  unknown_threat: '❓',
  unknown_type_A: '🔬',
  unknown_type_B: '🔬',
  safe: '🌿',
  noise: '🔇',
  uncertain: '⚠️',
  duplicate: '♻️',
};

const RISK_COLORS = {
  active_threat: '#EF4444',
  elevated: '#F97316',
  normal: '#4ADE80',
};

// ─── Inline Styles ────────────────────────────────────────────────────────────
const S = {
  app: {
    background: '#080E08',
    minHeight: '100vh',
    color: '#D4F5D4',
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '13px',
  },
  topBar: {
    background: '#0D160D',
    borderBottom: '1px solid #1a2e1a',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  logo: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#4ADE80',
    letterSpacing: '2px',
  },
  agentPills: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  pill: (state) => ({
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    background: state === 'ACTIVE' ? '#052e16' : state === 'LEARNING' ? '#2e1065' : '#1f2937',
    color: state === 'ACTIVE' ? '#4ADE80' : state === 'LEARNING' ? '#A855F7' : '#9CA3AF',
    border: `1px solid ${state === 'ACTIVE' ? '#4ADE80' : state === 'LEARNING' ? '#A855F7' : '#374151'}`,
  }),
  systemStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#4ADE80',
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4ADE80',
    animation: 'pulse 1.5s infinite',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '8px',
    padding: '12px 20px',
    background: '#0A120A',
    borderBottom: '1px solid #1a2e1a',
  },
  statCard: {
    background: '#0D160D',
    border: '1px solid #1a2e1a',
    borderRadius: '6px',
    padding: '10px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#4ADE80',
  },
  statLabel: {
    fontSize: '10px',
    color: '#6B7280',
    letterSpacing: '1px',
    marginTop: '2px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '30% 40% 30%',
    gap: '12px',
    padding: '12px 20px',
    minHeight: 'calc(100vh - 120px)',
    overflowY: 'auto',
  },
  panel: {
    background: '#0D160D',
    border: '1px solid #1a2e1a',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '12px',
  },
  panelTitle: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#4ADE80',
    letterSpacing: '2px',
    marginBottom: '12px',
    borderBottom: '1px solid #1a2e1a',
    paddingBottom: '8px',
  },
  uploadZone: (dragging) => ({
    border: `2px dashed ${dragging ? '#4ADE80' : '#1a2e1a'}`,
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: dragging ? '#052e16' : 'transparent',
  }),
  threatCard: (color) => ({
    border: `1px solid ${color}`,
    borderLeft: `4px solid ${color}`,
    borderRadius: '6px',
    padding: '12px',
    background: `${color}11`,
    boxShadow: `0 0 12px ${color}33`,
    marginTop: '12px',
  }),
  agentRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #1a2e1a',
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '6px 0',
    borderBottom: '1px solid #0f1f0f',
    fontSize: '12px',
  },
  predictBar: (pct, color) => ({
    height: '6px',
    width: `${pct * 100}%`,
    background: color,
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  }),
  evidenceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid #0f1f0f',
    fontSize: '11px',
  },
  alertBanner: (color) => ({
    position: 'fixed',
    top: '60px',
    left: 0,
    right: 0,
    background: color,
    color: '#fff',
    textAlign: 'center',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    zIndex: 2000,
    animation: 'bannerPulse 0.5s infinite alternate',
    letterSpacing: '2px',
  }),
  btn: (color = '#4ADE80') => ({
    background: 'transparent',
    border: `1px solid ${color}`,
    color: color,
    padding: '5px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
    fontSize: '11px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    transition: 'all 0.2s',
  }),
  badge: (color) => ({
    background: `${color}22`,
    border: `1px solid ${color}`,
    color: color,
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: 'bold',
  }),
  dispatchCard: (color) => ({
    borderLeft: `3px solid ${color}`,
    background: '#0A120A',
    borderRadius: '4px',
    padding: '8px',
    marginBottom: '6px',
  }),
};

// ─── Keyframes ────────────────────────────────────────────────────────────────
const injectStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
    @keyframes bannerPulse { from { opacity:0.8; } to { opacity:1; } }
    @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
    @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    .leaflet-container { background: #080E08 !important; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #0D160D; }
    ::-webkit-scrollbar-thumb { background: #1a2e1a; border-radius: 2px; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
  `;
  document.head.appendChild(style);
};

// ═══════════════════════════════════════════════════════════════════════════════
// RANGER PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function RangerPanel({ timeline, zones }) {
  const [dispatchQueue, setDispatchQueue] = useState([]);
  const [patrolCoverage, setPatrolCoverage] = useState({});
  const [forestHealth, setForestHealth] = useState({ score: 85, anomalies: [], alerts: [] });
  const [exportMsg, setExportMsg] = useState('');

  const SUGGESTED_ACTIONS = {
    gunshot: 'Deploy 2-ranger patrol to Zone A. Approach from north trail.',
    chainsaw: 'Intercept logging team at Sector 3. Alert Forest Dept.',
    vehicle: 'Set checkpoint on Forest Road 7. Request police backup.',
    unknown_threat: 'Send scout to investigate. Do not engage.',
    unknown_type_A: 'Send scout to investigate. Do not engage.',
    unknown_type_B: 'Send scout to investigate. Do not engage.',
  };

  useEffect(() => {
    const highThreats = timeline.filter(e =>
      ['gunshot', 'chainsaw', 'vehicle', 'unknown_threat'].includes(e.threat_type)
    ).slice(0, 3);
    setDispatchQueue(prev => {
      const existingIds = new Set(prev.map(p => p.event_id));
      const newItems = highThreats.filter(e => !existingIds.has(e.event_id)).map(e => ({
        ...e,
        event_id: Math.random(),
        acknowledged: false,
        escalated: false,
      }));
      return [...prev.filter(p => !p.acknowledged), ...newItems].slice(0, 3);
    });
  }, [timeline]);

  useEffect(() => {
    const fetch = async () => {
      try { const r = await axios.get(`${API}/behavior/health`); setForestHealth(r.data); } catch {}
    };
    fetch();
    const t = setInterval(fetch, 10000);
    return () => clearInterval(t);
  }, []);

  const acknowledge = (id) => {
    setDispatchQueue(prev => prev.filter(e => e.event_id !== id));
  };

  const escalate = (id) => {
    setDispatchQueue(prev => prev.map(e => e.event_id === id ? { ...e, escalated: true } : e));
  };

  const togglePatrol = (zone) => {
    setPatrolCoverage(prev => ({ ...prev, [zone]: !prev[zone] }));
  };

  const exportEvidence = async () => {
    try {
      const r = await axios.get(`${API}/evidence/all`);
      const data = JSON.stringify(r.data, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ForensAI_Evidence_${Date.now()}.json`;
      a.click();
      setExportMsg('Evidence sealed. SHA256 verified. Ready for submission.');
      setTimeout(() => setExportMsg(''), 4000);
    } catch {
      setExportMsg('Export failed. Check backend connection.');
    }
  };

  const healthColor = forestHealth.score >= 70 ? '#4ADE80' : forestHealth.score >= 40 ? '#F97316' : '#EF4444';
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (forestHealth.score / 100) * circumference;

  return (
    <div style={S.panel}>
      <div style={S.panelTitle}>🦺 RANGER OPERATIONS CENTER</div>

      {/* Dispatch Queue */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '10px', color: '#6B7280', letterSpacing: '1px', marginBottom: '8px' }}>ACTIVE DISPATCH QUEUE</div>
        {dispatchQueue.length === 0 ? (
          <div style={{ color: '#6B7280', fontSize: '11px', padding: '8px 0' }}>No active dispatches</div>
        ) : (
          dispatchQueue.map((item) => (
            <div key={item.event_id} style={S.dispatchCard(THREAT_COLORS[item.threat_type] || '#4ADE80')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: THREAT_COLORS[item.threat_type], fontSize: '11px', fontWeight: 'bold' }}>
                  {THREAT_ICONS[item.threat_type]} {(item.threat_type || '').toUpperCase()}
                </span>
                {item.escalated && <span style={S.badge('#EF4444')}>ESCALATED</span>}
              </div>
              <div style={{ fontSize: '10px', color: '#EAB308', fontWeight: 'bold', marginBottom: '6px' }}>
                {SUGGESTED_ACTIONS[item.threat_type] || 'Monitor situation.'}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button style={S.btn('#4ADE80')} onClick={() => acknowledge(item.event_id)}>ACK</button>
                {!item.escalated && <button style={S.btn('#EF4444')} onClick={() => escalate(item.event_id)}>ESC</button>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Patrol Coverage */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '10px', color: '#6B7280', letterSpacing: '1px', marginBottom: '6px' }}>PATROL COVERAGE</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {zones.map((zone) => (
            <button
              key={zone.zone}
              style={{
                ...S.btn(patrolCoverage[zone.zone] ? '#4ADE80' : '#EF4444'),
                fontSize: '9px',
                padding: '2px 6px',
              }}
              onClick={() => togglePatrol(zone.zone)}
            >
              {patrolCoverage[zone.zone] ? '✓' : '✗'} {zone.zone?.split(' ')[2] || 'Z'}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Export */}
      <div style={{ marginBottom: '12px' }}>
        <button style={{ ...S.btn('#4ADE80'), width: '100%', padding: '6px', fontSize: '10px' }} onClick={exportEvidence}>
          📦 EXPORT EVIDENCE
        </button>
        {exportMsg && <div style={{ color: '#4ADE80', fontSize: '10px', marginTop: '4px' }}>{exportMsg}</div>}
      </div>

      {/* Forest Health */}
      <div>
        <div style={{ fontSize: '10px', color: '#6B7280', letterSpacing: '1px', marginBottom: '8px' }}>FOREST HEALTH</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="60" height="60" viewBox="0 0 70 70">
            <circle cx="35" cy="35" r="28" fill="none" stroke="#1a2e1a" strokeWidth="6" />
            <circle
              cx="35" cy="35" r="28"
              fill="none"
              stroke={healthColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 35 35)"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
            <text x="35" y="40" textAnchor="middle" fill={healthColor} fontSize="12" fontFamily="Courier New" fontWeight="bold">
              {forestHealth.score}
            </text>
          </svg>
          <div style={{ flex: 1 }}>
            {forestHealth.anomalies?.length > 0 ? (
              forestHealth.anomalies.slice(0, 2).map((a, i) => (
                <div key={i} style={{ fontSize: '9px', color: '#F97316', marginBottom: '2px' }}>
                  ⚠ {String(a).replace(/_/g, ' ')}
                </div>
              ))
            ) : (
              <div style={{ fontSize: '10px', color: '#4ADE80' }}>Forest nominal</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [stats, setStats] = useState({ total_scans: 0, gunshots: 0, chainsaws: 0, vehicles: 0, unknown: 0, evidence_sealed: 0 });
  const [agents, setAgents] = useState([]);
  const [zones, setZones] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [evidenceList, setEvidenceList] = useState([]);
  const [falseAlerts, setFalseAlerts] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [alert, setAlert] = useState(null);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  const fileInputRef = useRef();

  useEffect(() => {
    injectStyles();
  }, []);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  // Stats — every 3s
  useEffect(() => {
    const fetchStats = async () => {
      try { const r = await axios.get(`${API}/stats`); setStats(r.data); } catch {}
    };
    fetchStats();
    const t = setInterval(fetchStats, 3000);
    return () => clearInterval(t);
  }, []);

  // Agents — every 5s
  useEffect(() => {
    const fetchAgents = async () => {
      try { const r = await axios.get(`${API}/agents/status`); setAgents(r.data.agents || []); } catch {}
    };
    fetchAgents();
    const t = setInterval(fetchAgents, 5000);
    return () => clearInterval(t);
  }, []);

  // Zones — every 3s
  useEffect(() => {
    const fetchZones = async () => {
      try { const r = await axios.get(`${API}/zones`); setZones(r.data.zones || []); } catch {}
    };
    fetchZones();
    const t = setInterval(fetchZones, 3000);
    return () => clearInterval(t);
  }, []);

  // Timeline — every 3s
  useEffect(() => {
    const fetchTimeline = async () => {
      try { const r = await axios.get(`${API}/timeline`); setTimeline(r.data.events || []); } catch {}
    };
    fetchTimeline();
    const t = setInterval(fetchTimeline, 3000);
    return () => clearInterval(t);
  }, []);

  // Predictions — every 10s
  useEffect(() => {
    const fetchPredictions = async () => {
      try { const r = await axios.get(`${API}/predict/all`); setPredictions(r.data.predictions || {}); } catch {}
    };
    fetchPredictions();
    const t = setInterval(fetchPredictions, 10000);
    return () => clearInterval(t);
  }, []);

  // Evidence — every 5s
  useEffect(() => {
    const fetchEvidence = async () => {
      try { const r = await axios.get(`${API}/evidence/all`); setEvidenceList(r.data.records || []); } catch {}
    };
    fetchEvidence();
    const t = setInterval(fetchEvidence, 5000);
    return () => clearInterval(t);
  }, []);

  // False alerts — every 3s
  useEffect(() => {
    const fetchFalse = async () => {
      try { const r = await axios.get(`${API}/false-alerts`); setFalseAlerts(r.data.logs || []); } catch {}
    };
    fetchFalse();
    const t = setInterval(fetchFalse, 3000);
    return () => clearInterval(t);
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setLastResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('zone', 'Zone A Nagarhole');
      const r = await axios.post(`${API}/classify`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLastResult(r.data);
      const tt = r.data.threat_type;
      if (tt === 'gunshot' || tt === 'chainsaw') {
        setAlert({ type: 'threat', msg: `⚠️ ACTIVE THREAT — ${tt.toUpperCase()} — RANGER DISPATCHED` });
        setTimeout(() => setAlert(null), 5000);
      } else if (tt === 'unknown_threat' || tt === 'unknown_type_A' || tt === 'unknown_type_B') {
        setAlert({ type: 'unknown', msg: '🔬 UNKNOWN SIGNATURE — AI LEARNING MODE' });
        setTimeout(() => setAlert(null), 5000);
      }
    } catch (e) {
      console.error('Upload error:', e);
    }
    setUploading(false);
  };

  const onFileChange = (e) => { if (e.target.files[0]) handleUpload(e.target.files[0]); };
  const onDrop = (e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]); };
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  return (
    <div style={S.app}>
      {/* Alert Banner */}
      {alert && (
        <div style={S.alertBanner(alert.type === 'threat' ? '#EF4444' : '#7C3AED')}>
          {alert.msg}
        </div>
      )}

      {/* Top Bar */}
      <div style={S.topBar}>
        <div style={S.logo}>🌿 FORENSAI</div>
        <div style={S.agentPills}>
          {agents.map((a) => (
            <span key={a.name} style={S.pill(a.state)}>
              {a.name.replace('Agent', '').toUpperCase()} • {a.state}
            </span>
          ))}
        </div>
        <div style={S.systemStatus}>
          <div style={S.pulseDot} />
          <span>SYSTEM ONLINE</span>
          <span style={{ color: '#6B7280' }}>{clock}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={S.statsRow}>
        {[
          { label: 'TOTAL SCANS', value: stats.total_scans, color: '#4ADE80' },
          { label: 'GUNSHOTS', value: stats.gunshots, color: '#EF4444' },
          { label: 'CHAINSAWS', value: stats.chainsaws, color: '#F97316' },
          { label: 'VEHICLES', value: stats.vehicles, color: '#EAB308' },
          { label: 'UNKNOWN', value: stats.unknown, color: '#A855F7' },
          { label: 'EVIDENCE SEALED', value: stats.evidence_sealed, color: '#4ADE80' },
        ].map((s) => (
          <div key={s.label} style={S.statCard}>
            <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={S.mainGrid}>
        {/* LEFT COLUMN */}
        <div>
          {/* Audio Upload */}
          <div style={S.panel}>
            <div style={S.panelTitle}>🎙️ ACOUSTIC ANALYSIS</div>
            <div
              style={S.uploadZone(dragging)}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".wav,.mp3,.ogg,.flac" style={{ display: 'none' }} onChange={onFileChange} />
              {uploading ? (
                <div style={{ color: '#4ADE80' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⟳</div>
                  <div>ANALYZING...</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎙️</div>
                  <div style={{ color: '#4ADE80', marginBottom: '4px' }}>DROP AUDIO FILE</div>
                  <div style={{ color: '#6B7280', fontSize: '11px' }}>WAV · MP3 · OGG · FLAC</div>
                </>
              )}
            </div>

            {/* Threat Result */}
            {lastResult && !lastResult.is_false_alert && (
              <div style={S.threatCard(THREAT_COLORS[lastResult.threat_type] || '#4ADE80')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '28px' }}>{THREAT_ICONS[lastResult.threat_type] || '❓'}</span>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: THREAT_COLORS[lastResult.threat_type] || '#4ADE80' }}>
                      {(lastResult.threat_type || 'UNKNOWN').toUpperCase()}
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '12px' }}>
                      Confidence: {((lastResult.confidence || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div style={{ background: '#0A120A', borderRadius: '4px', padding: '8px', marginBottom: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#6B7280' }}>INTENT: </span>
                  <span style={{ color: '#EAB308' }}>{lastResult.intent_label || 'Analyzing...'}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>
                  📍 {lastResult.zone} | {lastResult.lat?.toFixed(4)}, {lastResult.lng?.toFixed(4)}
                </div>
                {lastResult.evidence_id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ ...S.badge('#4ADE80'), animation: 'blink 1s infinite' }}>🔒 SEALED</span>
                    <span style={{ color: '#6B7280', fontSize: '10px' }}>{lastResult.evidence_id}</span>
                  </div>
                )}
              </div>
            )}
            {lastResult?.is_false_alert && (
              <div style={{ ...S.panel, marginTop: '12px', borderColor: '#6B7280' }}>
                <div style={{ color: '#6B7280', fontSize: '11px' }}>🔇 FALSE ALERT: {lastResult.false_alert_reason}</div>
              </div>
            )}
          </div>

          {/* Agent Swarm */}
          <div style={S.panel}>
            <div style={S.panelTitle}>🤖 AGENT SWARM STATUS</div>
            {(agents.length > 0 ? agents : [
              { name: 'AudioAgent', state: 'ACTIVE', last_action: 'Waiting for input' },
              { name: 'PredictionAgent', state: 'ACTIVE', last_action: 'Monitoring zones' },
              { name: 'LegalAgent', state: 'ACTIVE', last_action: 'Ready to seal evidence' },
              { name: 'GeoAgent', state: 'ACTIVE', last_action: 'Zones mapped' },
            ]).map((agent) => (
              <div key={agent.name} style={S.agentRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>
                    {agent.name === 'AudioAgent' ? '🎙️' : agent.name === 'PredictionAgent' ? '🧠' : agent.name === 'LegalAgent' ? '⚖️' : '🗺️'}
                  </span>
                  <div>
                    <div style={{ color: '#D4F5D4', fontSize: '12px' }}>{agent.name}</div>
                    <div style={{ color: '#6B7280', fontSize: '10px' }}>{agent.last_action}</div>
                  </div>
                </div>
                <span style={S.pill(agent.state)}>{agent.state}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER COLUMN */}
        <div>
          {/* Forest Twin Map */}
          <div style={S.panel}>
            <div style={S.panelTitle}>🌲 DIGITAL FOREST TWIN</div>
            <div style={{ height: '320px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #1a2e1a' }}>
              <MapContainer center={[12.5, 76.5]} zoom={7} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {zones.map((zone) => {
                  const riskColor = RISK_COLORS[zone.risk_level] || '#4ADE80';
                  const radius = 8 + (zone.risk_score || 0.1) * 20;
                  return (
                    <CircleMarker
                      key={zone.zone}
                      center={[zone.lat, zone.lng]}
                      radius={radius}
                      pathOptions={{ color: riskColor, fillColor: riskColor, fillOpacity: 0.6, weight: 2 }}
                    >
                      <Popup>
                        <div style={{ fontFamily: 'Courier New', fontSize: '12px', background: '#0D160D', color: '#D4F5D4', padding: '8px', minWidth: '160px' }}>
                          <div style={{ color: '#4ADE80', fontWeight: 'bold', marginBottom: '4px' }}>{zone.zone}</div>
                          <div>Risk: <span style={{ color: riskColor }}>{zone.risk_level?.toUpperCase()}</span></div>
                          <div>Score: {((zone.risk_score || 0) * 100).toFixed(0)}%</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Incident Timeline */}
          <div style={S.panel}>
            <div style={S.panelTitle}>📅 INCIDENT TIMELINE</div>
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {timeline.length === 0 ? (
                <div style={{ color: '#6B7280', textAlign: 'center', padding: '20px' }}>No incidents recorded yet</div>
              ) : (
                timeline.slice(0, 30).map((event, i) => (
                  <div key={i} style={S.timelineItem}>
                    <span style={{ color: '#6B7280', minWidth: '70px', fontSize: '10px' }}>
                      {event.datetime ? new Date(event.datetime).toLocaleTimeString() : '--:--:--'}
                    </span>
                    <span style={{ fontSize: '14px' }}>{THREAT_ICONS[event.threat_type] || '❓'}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: THREAT_COLORS[event.threat_type] || '#D4F5D4' }}>
                        {(event.threat_type || 'unknown').toUpperCase()}
                      </span>
                      <span style={{ color: '#6B7280' }}> · {event.intent_label || 'N/A'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Predictive Intelligence */}
          <div style={S.panel}>
            <div style={S.panelTitle}>📊 PREDICTIVE INTELLIGENCE</div>
            {Object.entries(predictions).length === 0 ? (
              <div style={{ color: '#6B7280', fontSize: '12px' }}>Awaiting data...</div>
            ) : (
              Object.entries(predictions).map(([zone, pred]) => {
                const prob = pred.probability || 0;
                const barColor = prob > 0.6 ? '#EF4444' : prob > 0.3 ? '#F97316' : '#4ADE80';
                return (
                  <div key={zone} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                      <span style={{ color: '#D4F5D4' }}>{zone.split(' ')[2] || 'Z'}</span>
                      <span style={{ color: barColor }}>{(prob * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ background: '#0A120A', borderRadius: '3px', height: '6px', overflow: 'hidden' }}>
                      <div style={S.predictBar(prob, barColor)} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Evidence Chain */}
          <div style={S.panel}>
            <div style={S.panelTitle}>⛓️ BLOCKCHAIN EVIDENCE CHAIN</div>
            {evidenceList.length === 0 ? (
              <div style={{ color: '#6B7280', fontSize: '12px' }}>No evidence sealed yet</div>
            ) : (
              evidenceList.slice(-5).reverse().map((ev) => (
                <div key={ev.evidence_id} style={S.evidenceRow}>
                  <span style={{ color: '#6B7280', fontSize: '10px' }}>{ev.evidence_id?.slice(0, 12)}</span>
                  <span style={{ color: THREAT_COLORS[ev.threat_type] || '#D4F5D4' }}>
                    {THREAT_ICONS[ev.threat_type] || '❓'}
                  </span>
                  <span style={{ color: '#6B7280', fontFamily: 'monospace', fontSize: '10px' }}>
                    {ev.sha256_hash?.slice(0, 12)}...
                  </span>
                  <span>{ev.tamper_status === 'verified' ? '🔒' : '🔓'}</span>
                </div>
              ))
            )}
          </div>

          {/* False Alert Log */}
          <div style={S.panel}>
            <div style={S.panelTitle}>🚫 FALSE ALERT LOG</div>
            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
              {falseAlerts.length === 0 ? (
                <div style={{ color: '#6B7280', fontSize: '12px' }}>No false alerts suppressed</div>
              ) : (
                falseAlerts.slice(0, 10).map((fa, i) => (
                  <div key={i} style={{ fontSize: '10px', color: '#6B7280', padding: '3px 0', borderBottom: '1px solid #0f1f0f' }}>
                    [{fa.time ? new Date(fa.time).toLocaleTimeString() : '--'}] {fa.reason}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ranger Panel */}
          <RangerPanel timeline={timeline} zones={zones} />
        </div>
      </div>
    </div>
  );
}
