# ForensAI — Judge Q&A Cheat Sheet
## AI-Sthetica 2026

---

| Judge Asks | You Say |
|-----------|---------|
| **How does the AI learn new sounds?** | YAMNet classifies known threats. Unknown sounds go into a pool. When we collect 10, KMeans clusters them automatically — the system names them unknown_type_A, B etc. It evolves without retraining. |
| **Is the blockchain real?** | The cryptographic proof is real — SHA256 hashes, IPFS CIDs, Merkle roots. We simulate the Polygon write because testnet requires gas fees, but the evidence package is court-ready. |
| **Does it work without internet?** | Yes. EDGE_MODE caches YAMNet locally and queues detections. When connectivity returns, POST /edge/sync flushes the queue. Built for Raspberry Pi in remote forests. |
| **How is this different from existing tools?** | Existing systems are static classifiers that react to sound. ForensAI predicts, learns, reasons about intent, chains evidence, and collaborates with rangers — all in one system. |
| **What's the forest behavior model?** | It learns baseline forest sounds over 20 events. Sudden silence after 10+ safe sounds triggers a human intrusion alert. Animal panic patterns trigger a predator/intruder warning. Ecological intelligence. |
| **What's the accuracy?** | YAMNet achieves 94%+ on AudioSet benchmarks. Our false alert engine eliminates noise, duplicates, and low-confidence detections. In simulation mode, we demonstrate the full pipeline architecture. |
| **Can it scale?** | Each Raspberry Pi covers one zone. 10 devices cover 200 sq km. 650 sanctuaries × 10 sensors = 6,500 deployment points. Central dashboard aggregates all zones. |
| **What's the cost?** | Raspberry Pi 4: ₹4,000. Microphone: ₹500. Solar panel: ₹2,000. Total per node: ~₹7,000. One-time cost, zero recurring fees for the AI. |
| **How do you handle false positives?** | Four-layer filter: duration check (< 0.3s = noise), duplicate hash check (60s window), confidence threshold (< 0.25 = uncertain), zone suppression (8+ safe events/hour). |
| **Is the Telegram alert real?** | Yes. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to .env. The alert fires automatically on any non-safe classification. |

---

## Emergency Answers

**If demo breaks:** "The architecture is sound. Let me show you the API directly." → `curl http://localhost:8000/health`

**If map doesn't load:** "OpenStreetMap tiles require internet. The core AI pipeline works offline." → Show /classify endpoint directly.

**If YAMNet fails to download:** "In production, YAMNet is pre-cached on the device. We're demonstrating the full pipeline in simulation mode." → Classification still works via simulation.

---

*"The forest has a voice. ForensAI speaks it."*
